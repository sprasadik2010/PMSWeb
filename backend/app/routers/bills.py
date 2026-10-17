from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
import random

from database import get_db
from .auth import get_current_user, get_tenant_id
from ..models import OPBill, OPBillItem, IPBill, IPBillItem, Patient, Doctor
from ..schemas import OPBillCreate, IPBillCreate

router = APIRouter(prefix="/bills", tags=["bills"])


def generate_bill_number(db: Session, tenant_id: int, prefix: str = "OPB") -> str:
    current_year = datetime.now().strftime("%Y")
    if prefix.startswith("OP"):
        count = db.query(OPBill).filter(OPBill.user_id == tenant_id).count()
        return f"OPB-{current_year}-{(count + 1):05d}"
    else:
        count = db.query(IPBill).filter(IPBill.user_id == tenant_id).count()
        return f"IPB-{current_year}-{(count + 1):05d}"


@router.post("/op")
async def create_op_bill(
    bill_data: OPBillCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    patient = db.query(Patient).filter(Patient.id == bill_data.patient_id, Patient.user_id == tenant_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == bill_data.doctor_id, Doctor.user_id == tenant_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    bill_number = generate_bill_number(db, tenant_id, "OPB")

    total_amount = 0
    discount_amount = 0
    bill_items = []

    for item_data in bill_data.items:
        amount = item_data.unit * item_data.rate
        discount_amt = amount * (item_data.discount_percent / 100)
        total = amount - discount_amt

        total_amount += amount
        discount_amount += discount_amt

        bill_items.append(
            OPBillItem(
                particular=item_data.particular,
                doctor=item_data.doctor,
                department=item_data.department,
                unit=item_data.unit,
                rate=item_data.rate,
                amount=amount,
                discount_percent=item_data.discount_percent,
                discount_amount=discount_amt,
                total=total
            )
        )

    net_amount = total_amount - discount_amount

    db_bill = OPBill(
        bill_number=bill_number,
        patient_id=bill_data.patient_id,
        bill_type=bill_data.bill_type,
        category=bill_data.category,
        doctor_id=bill_data.doctor_id,
        discount_type=bill_data.discount_type,
        total_amount=total_amount,
        discount_amount=discount_amount,
        net_amount=net_amount,
        created_by=current_user.full_name,
        user_id=tenant_id,
        items=bill_items
    )

    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)

    return {
        "message": "OP Bill created successfully",
        "bill_number": bill_number,
        "bill_id": db_bill.id
    }


@router.post("/ip")
async def create_ip_bill(
    bill_data: IPBillCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    patient = db.query(Patient).filter(Patient.id == bill_data.patient_id, Patient.user_id == tenant_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.query(Doctor).filter(Doctor.id == bill_data.doctor_id, Doctor.user_id == tenant_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    bill_number = generate_bill_number(db, tenant_id, "IPB")

    total_amount = 0
    discount_amount = 0
    bill_items = []

    for item_data in bill_data.items:
        discount_amt = item_data.amount * (item_data.discount_percent / 100)
        total = item_data.amount - discount_amt

        total_amount += item_data.amount
        discount_amount += discount_amt

        bill_items.append(
            IPBillItem(
                particular=item_data.particular,
                department=item_data.department,
                amount=item_data.amount,
                discount_percent=item_data.discount_percent,
                discount_amount=discount_amt,
                total=total
            )
        )

    net_amount = (
        total_amount
        - discount_amount
        + bill_data.service_tax
        + bill_data.education_cess
        + bill_data.she_education_cess
    )

    db_bill = IPBill(
        bill_number=bill_number,
        patient_id=bill_data.patient_id,
        is_credit=bill_data.is_credit,
        is_insurance=bill_data.is_insurance,
        category=bill_data.category,
        doctor_id=bill_data.doctor_id,
        discount_type=bill_data.discount_type,
        room=bill_data.room,
        admission_date=bill_data.admission_date,
        insurance_company=bill_data.insurance_company,
        third_party=bill_data.third_party,
        total_amount=total_amount,
        service_tax=bill_data.service_tax,
        education_cess=bill_data.education_cess,
        she_education_cess=bill_data.she_education_cess,
        net_amount=net_amount,
        created_by=current_user.full_name,
        user_id=tenant_id,
        items=bill_items
    )

    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)

    return {
        "message": "IP Bill created successfully",
        "bill_number": bill_number,
        "bill_id": db_bill.id
    }


@router.get("/op/today")
async def get_today_op_bills(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    today = datetime.now().date()

    bills = (
        db.query(OPBill)
        .filter(OPBill.user_id == current_user.id, func.date(OPBill.bill_date) == today)
        .all()
    )

    return bills


@router.get("/ip/today")
async def get_today_ip_bills(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    today = datetime.now().date()

    bills = (
        db.query(IPBill)
        .filter(IPBill.user_id == current_user.id, func.date(IPBill.bill_date) == today)
        .all()
    )

    return bills
    
@router.get("/op/all")
async def get_all_op_bills(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # today = datetime.now().date()

    bills = (
        db.query(OPBill)
        .filter(OPBill.user_id == current_user.id)
        .all()
    )

    return bills


    
@router.get("/ip/all")
async def get_all_ip_bills(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    bills = (
        db.query(IPBill)
        .filter(IPBill.user_id == current_user.id)
        .all()
    )
    return bills


    
@router.get("/ip/{patient_id}")
async def get_patient_ip_bills(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    bills = (
        db.query(IPBill)
        .filter(IPBill.patient_id == patient_id, IPBill.user_id == current_user.id)
        .all()
    )
    return bills


    
@router.get("/op/{patient_id}")
async def get_patient_op_bills(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    bills = (
        db.query(OPBill)
        .filter(OPBill.patient_id == patient_id, OPBill.user_id == current_user.id)
        .all()
    )
    return bills

@router.get("/ip/details/{bill_id}")
async def get_ip_bill_details(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    bill = db.query(IPBill).filter(IPBill.id == bill_id, IPBill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Load items
    items = db.query(IPBillItem).filter(IPBillItem.bill_id == bill_id).all()
    
    return {
        "bill": bill,
        "items": items
    }


@router.get("/op/details/{bill_id}")
async def get_op_bill_details(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    bill = db.query(OPBill).filter(OPBill.id == bill_id, OPBill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Load items
    items = db.query(OPBillItem).filter(OPBillItem.bill_id == bill_id).all()
    
    return {
        "bill": bill,
        "items": items
    }