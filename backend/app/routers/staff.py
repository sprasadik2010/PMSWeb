from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from .auth import get_current_user, get_password_hash, get_tenant_id
from ..models import User, Doctor
from ..schemas import StaffCreate, StaffResponse

router = APIRouter(prefix="/staff", tags=["staff"])

@router.get("/", response_model=List[StaffResponse])
async def get_staff_members(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    # Find all staff whose parent_user_id is tenant_id
    staff = db.query(User).filter(User.parent_user_id == tenant_id).all()
    return staff

@router.post("/", response_model=StaffResponse)
async def create_staff_member(
    data: StaffCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    
    # Check if username exists
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
        
    hashed_password = get_password_hash(data.password)
    
    staff_user = User(
        username=data.username,
        password=hashed_password,
        full_name=data.full_name,
        role=data.role, # doctor, receptionist, nurse, billing
        is_active=True,
        parent_user_id=tenant_id,
        doctor_id=data.doctor_id,
        ad_free=current_user.ad_free,
        subscription_tier=current_user.subscription_tier
    )
    
    db.add(staff_user)
    db.commit()
    db.refresh(staff_user)
    return staff_user

@router.patch("/{staff_id}/toggle-status")
async def toggle_staff_status(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    staff = db.query(User).filter(User.id == staff_id, User.parent_user_id == tenant_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
        
    staff.is_active = not staff.is_active
    db.commit()
    db.refresh(staff)
    return {"message": f"Staff status updated to {'active' if staff.is_active else 'inactive'}", "is_active": staff.is_active}
