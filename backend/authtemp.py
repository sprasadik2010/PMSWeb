from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from app.routers.auth import authenticate_user, create_access_token, get_password_hash
from app.schemas import Token, UserCreate
from app.models import User

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        password=hashed_password,
        full_name=user_data.full_name,
        role="admin"  # Single role as per requirement
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {"message": "User created successfully"}