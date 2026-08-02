from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Date
from datetime import date, time,datetime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255))
    full_name = Column(String(100))
    role = Column(String(20), default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    ad_free = Column(Boolean, default=False)
    subscription_tier = Column(String(20), default="free")

class Ad(Base):
    __tablename__ = "ads"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    description = Column(String(255))
    image_url = Column(String(255), nullable=True)
    link_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    code = Column(String(20), index=True)
    name = Column(String(100))
    address = Column(Text)
    qualification = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    specialty = Column(String(100))
    department = Column(String(100))
    op_validity = Column(Integer, default=30)
    booking_code = Column(String(20))
    max_tokens = Column(Integer, default=50)
    is_resigned = Column(Boolean, default=False)
    is_discontinued = Column(Boolean, default=False)
    resignation_date = Column(DateTime, nullable=True)
    doctor_amount = Column(Float, default=0)
    hospital_amount = Column(Float, default=0)
    doctor_revisit = Column(Float, default=0)
    hospital_revisit = Column(Float, default=0)
    from_time = Column(String(10))
    to_time = Column(String(10))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patients = relationship("Patient", back_populates="doctor")
    op_bills = relationship("OPBill", back_populates="doctor")
    ip_bills = relationship("IPBill", back_populates="doctor")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    op_number = Column(String(50), index=True)
    ip_number = Column(String(50), index=True, nullable=True)
    registration_date = Column(DateTime, default=datetime.utcnow)
    name = Column(String(100))
    age = Column(String(20))
    gender = Column(String(10))
    complaint = Column(Text)
    house = Column(String(100))
    street = Column(String(100))
    place = Column(String(100))
    phone = Column(String(20))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    referred_by = Column(String(100), nullable=True)
    room = Column(String(50), nullable=True)
    is_ip = Column(Boolean, default=False)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="patients")
    op_bills = relationship("OPBill", back_populates="patient")
    ip_bills = relationship("IPBill", back_populates="patient")

class OPBill(Base):
    __tablename__ = "op_bills"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    bill_number = Column(String(50), index=True)
    bill_date = Column(DateTime, default=datetime.utcnow)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    bill_type = Column(String(20))
    category = Column(String(50))
    doctor = Column(String(100))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    discount_type = Column(String(50))
    total_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    net_amount = Column(Float, default=0)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="op_bills")
    doctor = relationship("Doctor", back_populates="op_bills")
    items = relationship("OPBillItem", back_populates="bill", cascade="all, delete-orphan")

class OPBillItem(Base):
    __tablename__ = "op_bill_items"
    
    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("op_bills.id"))
    particular = Column(String(200))
    doctor = Column(String(100))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    department = Column(String(100))
    unit = Column(Integer, default=1)
    rate = Column(Float, default=0)
    amount = Column(Float, default=0)
    discount_percent = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    total = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bill = relationship("OPBill", back_populates="items")

class IPBill(Base):
    __tablename__ = "ip_bills"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    bill_number = Column(String(50), index=True)
    bill_date = Column(DateTime, default=datetime.utcnow)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    is_credit = Column(Boolean, default=False)
    is_insurance = Column(Boolean, default=False)
    category = Column(String(50))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    discount_type = Column(String(50))
    room = Column(String(50))
    admission_date = Column(Date)
    insurance_company = Column(String(100), nullable=True)
    third_party = Column(String(100), nullable=True)
    total_amount = Column(Float, default=0)
    service_tax = Column(Float, default=0)
    education_cess = Column(Float, default=0)
    she_education_cess = Column(Float, default=0)
    net_amount = Column(Float, default=0)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="ip_bills")
    doctor = relationship("Doctor", back_populates="ip_bills")
    items = relationship("IPBillItem", back_populates="bill", cascade="all, delete-orphan")

class IPBillItem(Base):
    __tablename__ = "ip_bill_items"
    
    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("ip_bills.id"))
    particular = Column(String(200))
    department = Column(String(100))
    amount = Column(Float, default=0)
    discount_percent = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    total = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bill = relationship("IPBill", back_populates="items")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Particular(Base):
    __tablename__ = "particulars"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(200), nullable=False)
    opdefault = Column(Boolean, default=False)
    ipdefault = Column(Boolean, default=False)
    sortorder = Column(Integer, default=-1)
    created_at = Column(DateTime, default=datetime.utcnow)