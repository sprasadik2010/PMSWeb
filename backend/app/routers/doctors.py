from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import random

from typing import Optional
from database import get_db
from .auth import get_current_user
from ..models import Doctor
from ..schemas import DoctorCreate, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["doctors"])

def generate_doctor_code():
    # Generate a unique doctor code
    return f"DR{random.randint(1000, 9999)}"

@router.post("/", response_model=DoctorResponse)
async def create_doctor(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if doctor code already exists for this tenant
    existing_doctor = db.query(Doctor).filter(Doctor.code == doctor_data.code, Doctor.user_id == current_user.id).first()
    if existing_doctor:
        raise HTTPException(status_code=400, detail="Doctor code already exists")
    
    db_doctor = Doctor(**doctor_data.dict(), user_id=current_user.id)
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    
    return DoctorResponse.from_orm(db_doctor)

@router.get("/", response_model=List[DoctorResponse])
async def get_doctors(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Doctor).filter(Doctor.user_id == current_user.id)
    
    if search:
        query = query.filter(
            (Doctor.name.ilike(f"%{search}%")) |
            (Doctor.code.ilike(f"%{search}%")) |
            (Doctor.specialty.ilike(f"%{search}%"))
        )
    
    if active_only:
        query = query.filter(Doctor.is_resigned == False, Doctor.is_discontinued == False)
    
    doctors = query.offset(skip).limit(limit).all()
    return [DoctorResponse.from_orm(doctor) for doctor in doctors]

@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return DoctorResponse.from_orm(doctor)

@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(
    doctor_id: int,
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    for key, value in doctor_data.dict().items():
        setattr(doctor, key, value)
    
    db.commit()
    db.refresh(doctor)
    
    return DoctorResponse.from_orm(doctor)

@router.delete("/{doctor_id}")
async def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    db.delete(doctor)
    db.commit()
    
    return {"message": "Doctor deleted successfully"}