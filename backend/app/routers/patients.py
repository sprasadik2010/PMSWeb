from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import random

from database import get_db
from .auth import get_current_user
from ..models import Patient, Doctor
from ..schemas import PatientCreate, PatientResponse

router = APIRouter(prefix="/patients", tags=["patients"])

def generate_op_number():
    current_date = datetime.now()
    year_month = current_date.strftime("%Y%m")
    # In real implementation, you would query the database for the last number
    sequence = random.randint(1, 999999)
    return f"{year_month}-{sequence:06d}"

def generate_ip_number():
    current_date = datetime.now()
    year_month = current_date.strftime("%Y%m")
    sequence = random.randint(1, 999999)
    return f"{year_month}-{sequence:06d}"

@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Generate OP number
    op_number = generate_op_number()
    
    # Generate IP number if it's an IP registration
    ip_number = generate_ip_number() if patient_data.is_ip else None
    
    # Get doctor name
    doctor = db.query(Doctor).filter(Doctor.id == patient_data.doctor_id, Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    db_patient = Patient(
        **patient_data.dict(),
        op_number=op_number,
        ip_number=ip_number,
        user_id=current_user.id,
        created_by=current_user.full_name
    )
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    # Add doctor name to response
    response = PatientResponse.from_orm(db_patient)
    response.doctor_name = doctor.name
    
    return response

@router.get("/", response_model=List[PatientResponse])
async def get_patients(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_ip: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Patient).filter(Patient.user_id == current_user.id)
    
    if search:
        query = query.filter(
            (Patient.name.ilike(f"%{search}%")) |
            (Patient.phone.ilike(f"%{search}%")) |
            (Patient.op_number.ilike(f"%{search}%")) |
            (Patient.ip_number.ilike(f"%{search}%"))
        )
    
    if is_ip is not None:
        query = query.filter(Patient.is_ip == is_ip)
    
    patients = query.offset(skip).limit(limit).all()
    
    # Add doctor names to response
    response = []
    for patient in patients:
        patient_dict = PatientResponse.from_orm(patient).dict()
        if patient.doctor:
            patient_dict["doctor_name"] = patient.doctor.name
        response.append(PatientResponse(**patient_dict))
    
    return response

# @router.get("/{patient_id}", response_model=PatientResponse)
# async def get_patient(
#     patient_id: int,
#     db: Session = Depends(get_db),
#     current_user = Depends(get_current_user)
# ):
#     patient = db.query(Patient).filter(Patient.id == patient_id).first()
#     if not patient:
#         raise HTTPException(status_code=404, detail="Patient not found")
    
#     response = PatientResponse.from_orm(patient)
#     if patient.doctor:
#         response.doctor_name = patient.doctor.name
    
#     return response

# @router.get("/search/op/{op_number}")
# async def search_by_op_number(
#     op_number: str,
#     db: Session = Depends(get_db)
# ):
#     patient = db.query(Patient).filter(Patient.op_number == op_number).first()
#     if not patient:
#         raise HTTPException(status_code=404, detail="Patient not found")
    
#     response = PatientResponse.from_orm(patient)
#     if patient.doctor:
#         response.doctor_name = patient.doctor.name
    
#     return response

@router.get("/search/op/{searchtext}")
def search_op_by_searchtext(
    searchtext: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    patients = db.query(Patient).filter(
        Patient.user_id == current_user.id,
        or_(
            Patient.name.contains(searchtext),
            Patient.complaint.contains(searchtext),
            Patient.house.contains(searchtext),
            Patient.street.contains(searchtext),
            Patient.place.contains(searchtext),
            Patient.phone.contains(searchtext),
            Patient.referred_by.contains(searchtext),
            Patient.room.contains(searchtext),
            Patient.op_number.contains(searchtext),
        ),
        ~Patient.is_ip
    ).all()

    if not patients:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patients


@router.get("/search/ip/{searchtext}")
def search_ip_by_searchtext(
    searchtext: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    patients = db.query(Patient).filter(
        Patient.user_id == current_user.id,
        or_(
            Patient.name.contains(searchtext),
            Patient.complaint.contains(searchtext),
            Patient.house.contains(searchtext),
            Patient.street.contains(searchtext),
            Patient.place.contains(searchtext),
            Patient.phone.contains(searchtext),
            Patient.referred_by.contains(searchtext),
            Patient.room.contains(searchtext),
            Patient.ip_number.contains(searchtext),
        ),
        Patient.is_ip
    ).all()

    if not patients:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patients