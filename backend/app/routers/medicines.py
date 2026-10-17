from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from database import get_db
from .auth import get_current_user, get_tenant_id
from ..models import Medicine
from ..schemas import MedicineCreate, MedicineResponse

router = APIRouter(prefix="/medicines", tags=["medicines"])

@router.get("/", response_model=List[MedicineResponse])
async def get_medicines(
    search: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    
    # Medicines can be global (user_id is None) or custom to this clinic (user_id == tenant_id)
    query = db.query(Medicine).filter(
        or_(Medicine.user_id == tenant_id, Medicine.user_id == None)
    )
    
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Medicine.brand_name.ilike(search_fmt),
                Medicine.generic_name.ilike(search_fmt)
            )
        )
    if category:
        query = query.filter(Medicine.category == category)
        
    return query.order_by(Medicine.brand_name.asc()).limit(limit).all()

@router.post("/", response_model=MedicineResponse)
async def create_medicine(
    data: MedicineCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    
    med = Medicine(
        user_id=tenant_id,
        brand_name=data.brand_name,
        generic_name=data.generic_name,
        category=data.category,
        strength=data.strength,
        default_dosage=data.default_dosage,
        default_frequency=data.default_frequency,
        default_duration=data.default_duration,
        default_instruction=data.default_instruction
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med

@router.delete("/{med_id}")
async def delete_medicine(
    med_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    med = db.query(Medicine).filter(Medicine.id == med_id, Medicine.user_id == tenant_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found or is system default")
    db.delete(med)
    db.commit()
    return {"message": "Medicine removed from clinic master"}
