from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy import func, or_, cast, Integer

from database import get_db
from .auth import get_current_user
from ..models import Patient, OPBill, IPBill, OPBillItem, IPBillItem, Doctor

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/daily-op")
async def get_daily_op_report(
    report_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get daily OP bill report for a specific date
    """
    bills = db.query(OPBill).filter(
        OPBill.user_id == current_user.id,
        func.date(OPBill.bill_date) == report_date
    ).options(
        joinedload(OPBill.patient),
        joinedload(OPBill.doctor)
    ).all()
    
    return bills

@router.get("/bill-summary")
async def get_bill_summary(
    start_date: date = Query(default_factory=lambda: date.today() - timedelta(days=7)),
    end_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get billing summary between two dates
    """
    op_bills = db.query(OPBill).filter(
        OPBill.user_id == current_user.id,
        func.date(OPBill.bill_date) >= start_date,
        func.date(OPBill.bill_date) <= end_date
    ).options(
        joinedload(OPBill.patient),
        joinedload(OPBill.doctor)
    ).all()
    
    ip_bills = db.query(IPBill).filter(
        IPBill.user_id == current_user.id,
        func.date(IPBill.bill_date) >= start_date,
        func.date(IPBill.bill_date) <= end_date
    ).options(
        joinedload(IPBill.patient),
        joinedload(IPBill.doctor)
    ).all()
    
    return {
        "op_bills": op_bills,
        "ip_bills": ip_bills,
        "total_op_amount": sum(bill.net_amount or 0 for bill in op_bills),
        "total_ip_amount": sum(bill.net_amount or 0 for bill in ip_bills),
        "total_amount": sum(bill.net_amount or 0 for bill in op_bills + ip_bills)
    }

@router.get("/patient-list")
async def get_patient_list(
    start_date: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    end_date: date = Query(default_factory=date.today),
    is_ip: bool = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get patient list within date range
    """
    query = db.query(Patient).filter(
        Patient.user_id == current_user.id,
        func.date(Patient.registration_date) >= start_date,
        func.date(Patient.registration_date) <= end_date
    )
    
    if is_ip is not None:
        query = query.filter(Patient.is_ip == is_ip)
    
    patients = query.all()
    return patients

@router.get("/particulars-report")
async def get_particulars_report(
    particular_id: int = Query(..., description="Particular ID"),
    start_date: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    end_date: date = Query(default_factory=date.today),
    include_op: bool = Query(True, description="Include OP bills"),
    include_ip: bool = Query(True, description="Include IP bills"),
    group_by_patient: bool = Query(False, description="Group results by patient"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate report for specific medical particulars (e.g., X-RAY, ECG, Blood Test).
    """
    
    if not include_op and not include_ip:
        raise HTTPException(status_code=400, detail="Must include at least OP or IP bills")
    
    results = {
        "particular_id": particular_id,
        "start_date": start_date,
        "end_date": end_date,
        "total_count": 0,
        "total_amount": 0.0,
        "op_details": [],
        "ip_details": [],
        "summary_by_date": [],
        "summary_by_doctor": []
    }
    
    # Helper function to create bill item detail
    def create_bill_item_detail(item, bill, patient, bill_type):
        if bill_type == "OP":
            detail = {
                "bill_type": bill_type,
                "bill_id": bill.id if bill else None,
                "bill_number": bill.bill_number if bill else None,
                "bill_date": bill.bill_date if bill else None,
                "patient_name": patient.name if patient else None,
                "patient_id": bill.patient_id if bill else None,
                "patient_age": patient.age if patient else None,
                "patient_gender": patient.gender if patient else None,
                "particular": item.particular,
                "unit": item.unit,
                "rate": float(item.rate or 0),
                "amount": float(item.amount or 0),
                "total": float(item.total or 0),
                "doctor_name": item.doctor,
                "doctor_id": item.doctor_id,
                "department": item.department,
            }
        else:  # IP
            detail = {
                "bill_type": bill_type,
                "bill_id": bill.id if bill else None,
                "bill_number": bill.bill_number if bill else None,
                "bill_date": bill.bill_date if bill else None,
                "patient_name": patient.name if patient else None,
                "patient_id": bill.patient_id if bill else None,
                "patient_age": patient.age if patient else None,
                "patient_gender": patient.gender if patient else None,
                "particular": item.particular,
                "amount": float(item.amount or 0),
                "total": float(item.total or 0),
                "doctor_name": bill.doctor.name if bill and bill.doctor else None,
                "doctor_id": bill.doctor_id if bill else None,
                "department": item.department,
            }
        
        return detail
    
    # ========== OP BILL ITEMS ==========
    if include_op:
        op_query = db.query(OPBillItem, OPBill, Patient).join(
            OPBill, OPBillItem.bill_id == OPBill.id
        ).join(
            Patient, OPBill.patient_id == Patient.id
        )
        
        op_query = op_query.filter(
            OPBill.user_id == current_user.id,
            cast(OPBillItem.particular, Integer) == particular_id,
            func.date(OPBill.bill_date) >= start_date,
            func.date(OPBill.bill_date) <= end_date
        )
        
        op_items = op_query.order_by(OPBill.bill_date.desc()).all()
        
        for item, bill, patient in op_items:
            op_detail = create_bill_item_detail(item, bill, patient, "OP")
            results["op_details"].append(op_detail)
            results["total_count"] += 1
            results["total_amount"] += op_detail["total"]
    
    # ========== IP BILL ITEMS ==========
    if include_ip:
        ip_query = db.query(IPBillItem, IPBill, Patient).join(
            IPBill, IPBillItem.bill_id == IPBill.id
        ).join(
            Patient, IPBill.patient_id == Patient.id
        )
        
        ip_query = ip_query.filter(
            IPBill.user_id == current_user.id,
            cast(IPBillItem.particular, Integer) == particular_id,
            func.date(IPBill.bill_date) >= start_date,
            func.date(IPBill.bill_date) <= end_date
        )
        
        ip_items = ip_query.order_by(IPBill.bill_date.desc()).all()
        
        for item, bill, patient in ip_items:
            ip_detail = create_bill_item_detail(item, bill, patient, "IP")
            results["ip_details"].append(ip_detail)
            results["total_count"] += 1
            results["total_amount"] += ip_detail["total"]
    
    # ========== SUMMARY BY DATE ==========
    # OP summary by date
    op_summary = db.query(
        func.date(OPBill.bill_date).label("date"),
        func.count(OPBillItem.id).label("count"),
        func.sum(OPBillItem.total).label("total_amount")
    ).join(OPBillItem, OPBill.id == OPBillItem.bill_id
    ).filter(
        OPBill.user_id == current_user.id,
        cast(OPBillItem.particular, Integer) == particular_id,
        func.date(OPBill.bill_date) >= start_date,
        func.date(OPBill.bill_date) <= end_date
    ).group_by(func.date(OPBill.bill_date)).all()
    
    # IP summary by date
    ip_summary = db.query(
        func.date(IPBill.bill_date).label("date"),
        func.count(IPBillItem.id).label("count"),
        func.sum(IPBillItem.total).label("total_amount")
    ).join(IPBillItem, IPBill.id == IPBillItem.bill_id
    ).filter(
        IPBill.user_id == current_user.id,
        cast(IPBillItem.particular, Integer) == particular_id,
        func.date(IPBill.bill_date) >= start_date,
        func.date(IPBill.bill_date) <= end_date
    ).group_by(func.date(IPBill.bill_date)).all()
    
    # Combine summaries
    summary_dict = {}
    for date_val, count, amount in op_summary:
        if date_val not in summary_dict:
            summary_dict[date_val] = {
                "date": date_val, 
                "op_count": 0, 
                "ip_count": 0, 
                "total_amount": 0.0
            }
        summary_dict[date_val]["op_count"] = count or 0
        summary_dict[date_val]["total_amount"] += float(amount or 0)
    
    for date_val, count, amount in ip_summary:
        if date_val not in summary_dict:
            summary_dict[date_val] = {
                "date": date_val, 
                "op_count": 0, 
                "ip_count": 0, 
                "total_amount": 0.0
            }
        summary_dict[date_val]["ip_count"] = count or 0
        summary_dict[date_val]["total_amount"] += float(amount or 0)
    
    results["summary_by_date"] = sorted(summary_dict.values(), key=lambda x: x["date"], reverse=True)
    
    # ========== SUMMARY BY DOCTOR ==========
    # OP by doctor
    op_doctor_summary = db.query(
        Doctor.name.label("doctor_name"),
        func.count(OPBillItem.id).label("count"),
        func.sum(OPBillItem.total).label("total_amount")
    ).join(OPBillItem, Doctor.id == OPBillItem.doctor_id
    ).join(OPBill, OPBillItem.bill_id == OPBill.id
    ).filter(
        OPBill.user_id == current_user.id,
        Doctor.user_id == current_user.id,
        cast(OPBillItem.particular, Integer) == particular_id,
        func.date(OPBill.bill_date) >= start_date,
        func.date(OPBill.bill_date) <= end_date
    ).group_by(Doctor.name).all()
    
    results["summary_by_doctor"] = [
        {
            "doctor_name": doctor, 
            "count": count, 
            "total_amount": float(amount or 0)
        }
        for doctor, count, amount in op_doctor_summary
    ]
    
    # ========== GROUP BY PATIENT ==========
    if group_by_patient:
        patient_summary = {}
        
        # Combine all details
        all_details = results["op_details"] + results["ip_details"]
        
        for item in all_details:
            patient_id = item["patient_id"]
            if patient_id not in patient_summary:
                patient_summary[patient_id] = {
                    "patient_id": patient_id,
                    "patient_name": item["patient_name"],
                    "patient_age": item["patient_age"],
                    "patient_gender": item["patient_gender"],
                    "total_count": 0,
                    "total_amount": 0.0,
                    "details": []
                }
            patient_summary[patient_id]["total_count"] += 1
            patient_summary[patient_id]["total_amount"] += item["total"]
            patient_summary[patient_id]["details"].append(item)
        
        results["grouped_by_patient"] = list(patient_summary.values())
    
    return results

@router.get("/particulars-list")
async def get_available_particulars(
    search: str = Query("", description="Search particular names"),
    limit: int = Query(50, description="Max number of results"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get list of distinct particular names for autocomplete/search
    """
    # Get from OP bills
    op_particulars = db.query(OPBillItem.particular).join(
        OPBill, OPBillItem.bill_id == OPBill.id
    ).filter(
        OPBill.user_id == current_user.id,
        OPBillItem.particular.ilike(f"%{search}%")
    ).distinct().limit(limit).all()
    
    # Get from IP bills
    ip_particulars = db.query(IPBillItem.particular).join(
        IPBill, IPBillItem.bill_id == IPBill.id
    ).filter(
        IPBill.user_id == current_user.id,
        IPBillItem.particular.ilike(f"%{search}%")
    ).distinct().limit(limit).all()
    
    # Combine and deduplicate
    all_particulars = set([p[0] for p in op_particulars] + [p[0] for p in ip_particulars])
    
    return {
        "particulars": sorted(list(all_particulars))[:limit],
        "count": len(all_particulars)
    }