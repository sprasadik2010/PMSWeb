from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from .auth import get_current_user
from ..models.models import User, Ad, Doctor, Patient, OPBill, IPBill

router = APIRouter(prefix="/admin", tags=["admin"])

# Verification dependency
def require_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Superadmin access required."
        )
    return current_user

# Ad Schemas for Request bodies
class AdCreate(BaseModel):
    title: str
    description: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    is_active: Optional[bool] = True

class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    subscription_tier: Optional[str] = None
    ad_free: Optional[bool] = None

@router.get("/stats", dependencies=[Depends(require_superadmin)])
async def get_admin_stats(db: Session = Depends(get_db)):
    """
    Get platform-wide diagnostics and SaaS stats
    """
    total_users = db.query(User).count()
    free_users = db.query(User).filter(User.subscription_tier == "free").count()
    premium_users = db.query(User).filter(User.subscription_tier == "premium").count()
    
    # Scoped tables counts
    total_doctors = db.query(Doctor).count()
    total_patients = db.query(Patient).count()
    total_op_bills = db.query(OPBill).count()
    total_ip_bills = db.query(IPBill).count()
    
    # Revenue calculations (system-wide)
    op_revenue = db.query(func.sum(OPBill.net_amount)).scalar() or 0.0
    ip_revenue = db.query(func.sum(IPBill.net_amount)).scalar() or 0.0
    total_revenue = op_revenue + ip_revenue
    
    # Ad impressions and clicks
    ads = db.query(Ad).all()
    total_impressions = sum(ad.impressions for ad in ads)
    total_clicks = sum(ad.clicks for ad in ads)
    ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0.0
    
    return {
        "total_users": total_users,
        "free_users": free_users,
        "premium_users": premium_users,
        "total_doctors": total_doctors,
        "total_patients": total_patients,
        "total_op_bills": total_op_bills,
        "total_ip_bills": total_ip_bills,
        "total_revenue": total_revenue,
        "total_ad_impressions": total_impressions,
        "total_ad_clicks": total_clicks,
        "ad_ctr_percent": ctr
    }

@router.get("/users", dependencies=[Depends(require_superadmin)])
async def list_users(db: Session = Depends(get_db)):
    """
    List all users with their clinic statistics
    """
    users = db.query(User).all()
    user_list = []
    
    for u in users:
        patient_count = db.query(Patient).filter(Patient.user_id == u.id).count()
        doctor_count = db.query(Doctor).filter(Doctor.user_id == u.id).count()
        bill_count = (
            db.query(OPBill).filter(OPBill.user_id == u.id).count() +
            db.query(IPBill).filter(IPBill.user_id == u.id).count()
        )
        
        user_list.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "ad_free": u.ad_free,
            "subscription_tier": u.subscription_tier,
            "created_at": u.created_at,
            "patients_count": patient_count,
            "doctors_count": doctor_count,
            "bills_count": bill_count
        })
        
    return user_list

@router.put("/users/{user_id}/status", dependencies=[Depends(require_superadmin)])
async def update_user_status(user_id: int, updates: UserUpdate, db: Session = Depends(get_db)):
    """
    Update a tenant user's subscription, ad tier, or active status
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if updates.is_active is not None:
        user.is_active = updates.is_active
    if updates.subscription_tier is not None:
        user.subscription_tier = updates.subscription_tier
        if updates.subscription_tier == "premium":
            user.ad_free = True
        elif updates.subscription_tier == "free":
            user.ad_free = False
    if updates.ad_free is not None:
        user.ad_free = updates.ad_free
        
    db.commit()
    db.refresh(user)
    return user

@router.get("/ads", dependencies=[Depends(require_superadmin)], response_model=List[AdCreate])
async def list_ads(db: Session = Depends(get_db)):
    """
    List all advertisements (active and inactive)
    """
    return db.query(Ad).order_by(Ad.created_at.desc()).all()

# Override list_ads response model to also include performance details
@router.get("/ads/details", dependencies=[Depends(require_superadmin)])
async def list_ads_with_details(db: Session = Depends(get_db)):
    ads = db.query(Ad).order_by(Ad.created_at.desc()).all()
    return [
        {
            "id": ad.id,
            "title": ad.title,
            "description": ad.description,
            "image_url": ad.image_url,
            "link_url": ad.link_url,
            "is_active": ad.is_active,
            "impressions": ad.impressions,
            "clicks": ad.clicks,
            "ctr": (ad.clicks / ad.impressions * 100) if ad.impressions > 0 else 0.0,
            "created_at": ad.created_at
        }
        for ad in ads
    ]

@router.post("/ads", dependencies=[Depends(require_superadmin)])
async def create_ad(ad_data: AdCreate, db: Session = Depends(get_db)):
    """
    Create a new platform advertisement
    """
    ad = Ad(
        title=ad_data.title,
        description=ad_data.description,
        image_url=ad_data.image_url,
        link_url=ad_data.link_url,
        is_active=ad_data.is_active
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return ad

@router.put("/ads/{ad_id}", dependencies=[Depends(require_superadmin)])
async def edit_ad(ad_id: int, ad_data: AdCreate, db: Session = Depends(get_db)):
    """
    Update an advertisement details or status
    """
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
        
    ad.title = ad_data.title
    ad.description = ad_data.description
    ad.image_url = ad_data.image_url
    ad.link_url = ad_data.link_url
    ad.is_active = ad_data.is_active
    
    db.commit()
    db.refresh(ad)
    return ad

@router.delete("/ads/{ad_id}", dependencies=[Depends(require_superadmin)])
async def delete_ad(ad_id: int, db: Session = Depends(get_db)):
    """
    Delete an advertisement from the database
    """
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
        
    db.delete(ad)
    db.commit()
    return {"message": "Ad deleted successfully"}
