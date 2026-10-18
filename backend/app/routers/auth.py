from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from sqlalchemy import func
import bcrypt
import os


from database import get_db
from ..schemas import Token, UserCreate, UserResponse
from ..models import User, Department

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 30)))

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["authentication"])

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def authenticate_user(db: Session, username: str, password: str):
    # Case-insensitive and trimmed username comparison
    user = db.query(User).filter(
        func.lower(func.trim(User.username)) == username.strip().lower()
    ).first()
    
    if user and verify_password(password, user.password):
        return user
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get current user
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Routes
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    print("PASSWORD RECEIVED:", user_data.password)
    print("PASSWORD LENGTH:", len(user_data.password))
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
    
    # Auto-seed standard departments for the new clinic account
    default_departments = [
        "General Medicine",
        "Cardiology",
        "Pediatrics",
        "Orthopedics",
        "Gynecology & Obstetrics",
        "ENT",
        "Dermatology",
        "General Surgery"
    ]
    for d_name in default_departments:
        db.add(Department(name=d_name, user_id=db_user.id))
    db.commit()
    
    return {"message": "User created successfully !"}

def get_tenant_id(user: User) -> int:
    """Returns the effective clinic account ID (tenant ID) for either the clinic owner or a staff member."""
    return user.parent_user_id if user.parent_user_id else user.id

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/upgrade", response_model=UserResponse)
async def upgrade_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.ad_free = True
    current_user.subscription_tier = "premium"
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/downgrade", response_model=UserResponse)
async def downgrade_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.ad_free = False
    current_user.subscription_tier = "free"
    db.commit()
    db.refresh(current_user)
    return current_user