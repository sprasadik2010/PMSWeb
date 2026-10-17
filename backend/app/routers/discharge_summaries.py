from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from database import get_db
from .auth import get_current_user, get_tenant_id
from ..models import DischargeSummary, Patient, Doctor
from ..schemas import DischargeSummaryCreate, DischargeSummaryResponse

router = APIRouter(prefix="/discharge-summaries", tags=["discharge-summaries"])

def generate_dis_number(db: Session, tenant_id: int) -> str:
    current_year = datetime.now().strftime("%Y")
    count = db.query(DischargeSummary).filter(DischargeSummary.user_id == tenant_id).count()
    return f"DIS-{current_year}-{(count + 1):05d}"

@router.post("/", response_model=DischargeSummaryResponse)
async def create_discharge_summary(
    data: DischargeSummaryCreate,
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
        
    dis_num = generate_dis_number(db, tenant_id)
    
    summary = DischargeSummary(
        user_id=tenant_id,
        summary_number=dis_num,
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        admission_date=data.admission_date,
        discharge_date=data.discharge_date,
        final_diagnosis=data.final_diagnosis,
        treatment_summary=data.treatment_summary,
        condition_at_discharge=data.condition_at_discharge,
        discharge_medications=data.discharge_medications,
        follow_up_instructions=data.follow_up_instructions,
        created_by=current_user.full_name
    )
    
    db.add(summary)
    db.commit()
    db.refresh(summary)
    
    res = DischargeSummaryResponse.from_orm(summary)
    res.patient_name = patient.name
    res.doctor_name = doctor.name
    return res

@router.get("/", response_model=List[DischargeSummaryResponse])
async def get_discharge_summaries(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    query = db.query(DischargeSummary).options(
        joinedload(DischargeSummary.patient),
        joinedload(DischargeSummary.doctor)
    ).filter(DischargeSummary.user_id == tenant_id)
    
    if patient_id:
        query = query.filter(DischargeSummary.patient_id == patient_id)
    if doctor_id:
        query = query.filter(DischargeSummary.doctor_id == doctor_id)
        
    summaries = query.order_by(DischargeSummary.created_at.desc()).all()
    
    results = []
    for s in summaries:
        res = DischargeSummaryResponse.from_orm(s)
        if s.patient:
            res.patient_name = s.patient.name
        if s.doctor:
            res.doctor_name = s.doctor.name
        results.append(res)
    return results

@router.get("/{summary_id}", response_model=DischargeSummaryResponse)
async def get_discharge_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    summary = db.query(DischargeSummary).options(
        joinedload(DischargeSummary.patient),
        joinedload(DischargeSummary.doctor)
    ).filter(DischargeSummary.id == summary_id, DischargeSummary.user_id == tenant_id).first()
    
    if not summary:
        raise HTTPException(status_code=404, detail="Discharge summary not found")
        
    res = DischargeSummaryResponse.from_orm(summary)
    if summary.patient:
        res.patient_name = summary.patient.name
    if summary.doctor:
        res.doctor_name = summary.doctor.name
    return res
