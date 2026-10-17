from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date

from database import get_db
from .auth import get_current_user, get_tenant_id
from ..models import Appointment, Patient, Doctor
from ..schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter(prefix="/appointments", tags=["appointments"])

def generate_appointment_number(db: Session, tenant_id: int) -> str:
    current_year = datetime.now().strftime("%Y")
    count = db.query(Appointment).filter(Appointment.user_id == tenant_id).count()
    return f"APT-{current_year}-{(count + 1):05d}"

@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    
    patient = db.query(Patient).filter(Patient.id == data.patient_id, Patient.user_id == tenant_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id, Doctor.user_id == tenant_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    apt_date = data.appointment_date or date.today()
    
    # Calculate next daily token for this doctor on this date
    token_count = db.query(Appointment).filter(
        Appointment.user_id == tenant_id,
        Appointment.doctor_id == data.doctor_id,
        Appointment.appointment_date == apt_date
    ).count()
    next_token = token_count + 1
    
    apt_num = generate_appointment_number(db, tenant_id)
    
    apt = Appointment(
        user_id=tenant_id,
        appointment_number=apt_num,
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        appointment_date=apt_date,
        time_slot=data.time_slot or "10:00 AM",
        token_number=next_token,
        status="waiting",
        chief_complaint=data.chief_complaint,
        notes=data.notes
    )
    
    db.add(apt)
    db.commit()
    db.refresh(apt)
    
    res = AppointmentResponse.from_orm(apt)
    res.patient_name = patient.name
    res.patient_phone = patient.phone
    res.doctor_name = doctor.name
    return res

@router.get("/", response_model=List[AppointmentResponse])
async def get_appointments(
    appointment_date: Optional[date] = None,
    doctor_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    query = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor)
    ).filter(Appointment.user_id == tenant_id)
    
    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status:
        query = query.filter(Appointment.status == status)
        
    apts = query.order_by(Appointment.token_number.asc()).all()
    
    results = []
    for a in apts:
        res = AppointmentResponse.from_orm(a)
        if a.patient:
            res.patient_name = a.patient.name
            res.patient_phone = a.patient.phone
        if a.doctor:
            res.doctor_name = a.doctor.name
        results.append(res)
    return results

@router.get("/queue/today")
async def get_today_queue(
    doctor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Public or waiting room live queue display data.
    """
    tenant_id = get_tenant_id(current_user)
    today = date.today()
    
    query = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor)
    ).filter(
        Appointment.user_id == tenant_id,
        Appointment.appointment_date == today
    )
    
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
        
    apts = query.order_by(Appointment.token_number.asc()).all()
    
    currently_calling = [
        {
            "id": a.id,
            "token_number": a.token_number,
            "patient_name": a.patient.name if a.patient else "Unknown",
            "doctor_name": a.doctor.name if a.doctor else "Unknown",
            "status": a.status,
            "time_slot": a.time_slot
        }
        for a in apts if a.status == "in_consultation"
    ]
    
    waiting_list = [
        {
            "id": a.id,
            "token_number": a.token_number,
            "patient_name": a.patient.name if a.patient else "Unknown",
            "doctor_name": a.doctor.name if a.doctor else "Unknown",
            "status": a.status,
            "time_slot": a.time_slot
        }
        for a in apts if a.status == "waiting"
    ]
    
    completed_count = len([a for a in apts if a.status == "completed"])
    
    return {
        "date": today.isoformat(),
        "total_tokens": len(apts),
        "currently_calling": currently_calling,
        "waiting_list": waiting_list,
        "completed_count": completed_count
    }

@router.patch("/{apt_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    apt_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    apt = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor)
    ).filter(Appointment.id == apt_id, Appointment.user_id == tenant_id).first()
    
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if data.status:
        apt.status = data.status
    if data.notes:
        apt.notes = data.notes
        
    db.commit()
    db.refresh(apt)
    
    res = AppointmentResponse.from_orm(apt)
    if apt.patient:
        res.patient_name = apt.patient.name
        res.patient_phone = apt.patient.phone
    if apt.doctor:
        res.doctor_name = apt.doctor.name
    return res

@router.delete("/{apt_id}")
async def cancel_appointment(
    apt_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.user_id == tenant_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(apt)
    db.commit()
    return {"message": "Appointment cancelled successfully"}
