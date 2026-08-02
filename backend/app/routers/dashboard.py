from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date

from database import get_db
from .auth import get_current_user
from ..models import Patient, OPBill, IPBill
from ..schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    today = date.today()
    
    # Total patients registered today
    total_patients_today = db.query(Patient).filter(
        Patient.user_id == current_user.id,
        func.date(Patient.registration_date) == today
    ).count()
    
    # Total OP bills today
    total_op_bills_today = db.query(OPBill).filter(
        OPBill.user_id == current_user.id,
        func.date(OPBill.bill_date) == today
    ).count()
    
    # Total IP bills today
    total_ip_bills_today = db.query(IPBill).filter(
        IPBill.user_id == current_user.id,
        func.date(IPBill.bill_date) == today
    ).count()
    
    # Total revenue today
    op_revenue = db.query(func.sum(OPBill.net_amount)).filter(
        OPBill.user_id == current_user.id,
        func.date(OPBill.bill_date) == today
    ).scalar() or 0
    
    ip_revenue = db.query(func.sum(IPBill.net_amount)).filter(
        IPBill.user_id == current_user.id,
        func.date(IPBill.bill_date) == today
    ).scalar() or 0
    
    total_revenue_today = op_revenue + ip_revenue

    return DashboardStats(
        total_patients_today=total_patients_today,
        total_op_bills_today=total_op_bills_today,
        total_ip_bills_today=total_ip_bills_today,
        total_revenue_today=total_revenue_today
    )