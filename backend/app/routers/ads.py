from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import random

from database import get_db
from ..models.models import Ad

router = APIRouter(prefix="/ads", tags=["ads"])

@router.get("/random")
async def get_random_ad(db: Session = Depends(get_db)):
    """
    Get a random active advertisement and increment its impression count
    """
    active_ads = db.query(Ad).filter(Ad.is_active == True).all()
    if not active_ads:
        # Fallback default ad in case DB is unseeded
        return {
            "id": 0,
            "title": "Upgrade to PMS Pro Premium",
            "description": "Remove all sponsored banners, get priority hospital support and detailed billing analytics.",
            "image_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",
            "link_url": "/upgrade"
        }
    
    selected_ad = random.choice(active_ads)
    
    # Increment impressions
    try:
        selected_ad.impressions += 1
        db.commit()
        db.refresh(selected_ad)
    except Exception as e:
        db.rollback()
        print(f"Failed to increment ad impressions: {e}")
        
    return selected_ad

@router.post("/{ad_id}/click")
async def register_ad_click(ad_id: int, db: Session = Depends(get_db)):
    """
    Increment click count on a specific ad
    """
    if ad_id == 0:
        return {"message": "Fallback ad click registered"}
        
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
        
    try:
        ad.clicks += 1
        db.commit()
        return {"message": "Ad click registered successfully", "clicks": ad.clicks}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
