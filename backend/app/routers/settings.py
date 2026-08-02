# routers/settings.py - Modified version with independent Particular
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from .auth import get_current_user
from ..models import Base, Department, Particular
from ..schemas import DepartmentCreate, DepartmentResponse, ParticularCreate, ParticularResponse #, ParticularUpdate

router = APIRouter(prefix="/settings", tags=["settings"])

# Departments CRUD (unchanged)
@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all departments
    """
    return db.query(Department).filter(Department.user_id == current_user.id).order_by(Department.name).all()

@router.post("/departments", response_model=DepartmentResponse)
async def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new department
    """
    # Check if department with same name exists for this user
    existing = db.query(Department).filter(Department.name == department.name, Department.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    
    db_department = Department(name=department.name, user_id=current_user.id)
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

@router.delete("/departments/{department_id}")
async def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete a department
    """
    db_department = db.query(Department).filter(Department.id == department_id, Department.user_id == current_user.id).first()
    if not db_department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(db_department)
    db.commit()
    return {"message": "Department deleted successfully"}

# Particulars CRUD (Modified to be independent)
@router.get("/particulars", response_model=List[ParticularResponse])
async def get_particulars(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all particulars (no department filtering needed)
    """
    # Sort by sortorder first (ascending), then by name
    return db.query(Particular).filter(Particular.user_id == current_user.id).order_by(Particular.sortorder, Particular.name).all()

@router.get("/particulars/opdefaults", response_model=List[ParticularResponse])
async def get_op_default_particulars(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all OP default particulars
    """
    return db.query(Particular).filter(Particular.user_id == current_user.id, Particular.opdefault == True).order_by(Particular.sortorder, Particular.name).all()

@router.get("/particulars/ipdefaults", response_model=List[ParticularResponse])
async def get_ip_default_particulars(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all IP default particulars
    """
    return db.query(Particular).filter(Particular.user_id == current_user.id, Particular.ipdefault == True).order_by(Particular.sortorder, Particular.name).all()

@router.post("/particulars", response_model=ParticularResponse)
async def create_particular(
    particular: ParticularCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new particular (no department association)
    """
    # Check if particular with same name exists for this user
    existing = db.query(Particular).filter(Particular.name == particular.name, Particular.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Particular already exists")
    
    # Create particular with all fields
    db_particular = Particular(
        name=particular.name,
        opdefault=particular.opdefault,
        ipdefault=particular.ipdefault,
        sortorder=particular.sortorder,
        user_id=current_user.id
    )
    
    db.add(db_particular)
    db.commit()
    db.refresh(db_particular)
    
    return db_particular

# @router.put("/particulars/{particular_id}", response_model=ParticularResponse)
# async def update_particular(
#     particular_id: int,
#     particular: ParticularUpdate,
#     db: Session = Depends(get_db),
#     current_user = Depends(get_current_user)
# ):
#     """
#     Update a particular
#     """
#     db_particular = db.query(Particular).filter(Particular.id == particular_id).first()
#     if not db_particular:
#         raise HTTPException(status_code=404, detail="Particular not found")
    
#     # Check if name is being changed and if new name already exists
#     if particular.name and particular.name != db_particular.name:
#         existing = db.query(Particular).filter(Particular.name == particular.name).first()
#         if existing:
#             raise HTTPException(status_code=400, detail="Particular name already exists")
    
#     # Update fields if provided
#     update_data = particular.model_dump(exclude_unset=True)
#     for field, value in update_data.items():
#         setattr(db_particular, field, value)
    
#     db.commit()
#     db.refresh(db_particular)
#     return db_particular

@router.delete("/particulars/{particular_id}")
async def delete_particular(
    particular_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete a particular
    """
    db_particular = db.query(Particular).filter(Particular.id == particular_id, Particular.user_id == current_user.id).first()
    if not db_particular:
        raise HTTPException(status_code=404, detail="Particular not found")
    
    db.delete(db_particular)
    db.commit()
    return {"message": "Particular deleted successfully"}

@router.get("/stats")
async def get_settings_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get settings statistics
    """
    total_departments = db.query(Department).filter(Department.user_id == current_user.id).count()
    total_particulars = db.query(Particular).filter(Particular.user_id == current_user.id).count()
    total_op_defaults = db.query(Particular).filter(Particular.user_id == current_user.id, Particular.opdefault == True).count()
    total_ip_defaults = db.query(Particular).filter(Particular.user_id == current_user.id, Particular.ipdefault == True).count()
    
    return {
        "total_departments": total_departments,
        "total_particulars": total_particulars,
        "total_op_defaults": total_op_defaults,
        "total_ip_defaults": total_ip_defaults
    }