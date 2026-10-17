from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date

from database import get_db
from .auth import get_current_user, get_tenant_id
from ..models import Prescription, PrescriptionItem, Patient, Doctor
from ..schemas import PrescriptionCreate, PrescriptionResponse

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

def generate_rx_number(db: Session, tenant_id: int) -> str:
    current_year = datetime.now().strftime("%Y")
    count = db.query(Prescription).filter(Prescription.user_id == tenant_id).count()
    return f"RX-{current_year}-{(count + 1):05d}"

@router.post("/", response_model=PrescriptionResponse)
async def create_prescription(
    data: PrescriptionCreate,
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
        
    rx_number = generate_rx_number(db, tenant_id)
    
    rx_items = [
        PrescriptionItem(
            medicine_name=item.medicine_name,
            dosage=item.dosage,
            frequency=item.frequency,
            duration=item.duration,
            instruction=item.instruction,
            route=item.route
        )
        for item in data.items
    ]
    
    db_rx = Prescription(
        user_id=tenant_id,
        prescription_number=rx_number,
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        bp_systolic=data.bp_systolic,
        bp_diastolic=data.bp_diastolic,
        pulse=data.pulse,
        temperature=data.temperature,
        weight_kg=data.weight_kg,
        height_cm=data.height_cm,
        spo2=data.spo2,
        blood_sugar=data.blood_sugar,
        chief_complaint=data.chief_complaint,
        diagnosis=data.diagnosis,
        clinical_notes=data.clinical_notes,
        advice=data.advice,
        investigations_advised=data.investigations_advised,
        follow_up_date=data.follow_up_date,
        created_by=current_user.full_name,
        items=rx_items
    )
    
    db.add(db_rx)
    db.commit()
    db.refresh(db_rx)
    
    # Format response
    res = PrescriptionResponse.from_orm(db_rx)
    res.patient_name = patient.name
    res.patient_age = str(patient.age)
    res.patient_gender = patient.gender
    res.doctor_name = doctor.name
    res.doctor_specialty = doctor.specialty
    return res

@router.get("/", response_model=List[PrescriptionResponse])
async def get_prescriptions(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    query = db.query(Prescription).options(
        joinedload(Prescription.patient),
        joinedload(Prescription.doctor),
        joinedload(Prescription.items)
    ).filter(Prescription.user_id == tenant_id)
    
    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)
        
    rx_list = query.order_by(Prescription.created_at.desc()).limit(limit).all()
    
    results = []
    for rx in rx_list:
        item_res = PrescriptionResponse.from_orm(rx)
        if rx.patient:
            item_res.patient_name = rx.patient.name
            item_res.patient_age = str(rx.patient.age)
            item_res.patient_gender = rx.patient.gender
        if rx.doctor:
            item_res.doctor_name = rx.doctor.name
            item_res.doctor_specialty = rx.doctor.specialty
        results.append(item_res)
        
    return results

@router.get("/{rx_id}", response_model=PrescriptionResponse)
async def get_prescription(
    rx_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    rx = db.query(Prescription).options(
        joinedload(Prescription.patient),
        joinedload(Prescription.doctor),
        joinedload(Prescription.items)
    ).filter(Prescription.id == rx_id, Prescription.user_id == tenant_id).first()
    
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    res = PrescriptionResponse.from_orm(rx)
    if rx.patient:
        res.patient_name = rx.patient.name
        res.patient_age = str(rx.patient.age)
        res.patient_gender = rx.patient.gender
    if rx.doctor:
        res.doctor_name = rx.doctor.name
        res.doctor_specialty = rx.doctor.specialty
    return res

@router.delete("/{rx_id}")
async def delete_prescription(
    rx_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    rx = db.query(Prescription).filter(Prescription.id == rx_id, Prescription.user_id == tenant_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    db.delete(rx)
    db.commit()
    return {"message": "Prescription deleted successfully"}
