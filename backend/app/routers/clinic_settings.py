from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from .auth import get_current_user, get_tenant_id
from ..models import ClinicSetting
from ..schemas import ClinicSettingUpdate, ClinicSettingResponse

router = APIRouter(prefix="/clinic-settings", tags=["clinic-settings"])

@router.get("/", response_model=ClinicSettingResponse)
async def get_clinic_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    setting = db.query(ClinicSetting).filter(ClinicSetting.user_id == tenant_id).first()
    
    if not setting:
        # Create default clinic setting for this tenant
        setting = ClinicSetting(
            user_id=tenant_id,
            clinic_name=f"{current_user.full_name}'s Healthcare Clinic",
            tagline="Committed to Compassionate Clinical Excellence",
            address="123 Hospital Road, Medical Enclave",
            city="Metro City",
            state="State",
            postal_code="500001",
            phone="+91 98765 43210",
            email="info@clinic.com",
            tax_id="GSTIN36AAAAA0000A1Z5",
            currency_symbol="₹",
            terms_conditions="1. Fees once paid are non-refundable.\n2. Consultation valid for 7 days from issue date.\n3. Please preserve this receipt for follow-up visits."
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
        
    return setting

@router.put("/", response_model=ClinicSettingResponse)
async def update_clinic_settings(
    data: ClinicSettingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = get_tenant_id(current_user)
    setting = db.query(ClinicSetting).filter(ClinicSetting.user_id == tenant_id).first()
    
    if not setting:
        setting = ClinicSetting(user_id=tenant_id, **data.dict())
        db.add(setting)
    else:
        for key, val in data.dict().items():
            setattr(setting, key, val)
        setting.updated_at = datetime.utcnow()
        
    db.commit()
    db.refresh(setting)
    return setting
