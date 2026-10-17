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
    parent_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)

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
    prescriptions = relationship("Prescription", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")

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
    prescriptions = relationship("Prescription", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    discharge_summaries = relationship("DischargeSummary", back_populates="patient")

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

class ClinicSetting(Base):
    __tablename__ = "clinic_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    clinic_name = Column(String(150), default="City Care Hospital & Research Center")
    tagline = Column(String(200), default="Advanced Healthcare & Compassionate Service")
    address = Column(Text, default="123 Hospital Road, Central Medical Enclave")
    city = Column(String(100), default="Metro City")
    state = Column(String(100), default="State")
    postal_code = Column(String(20), default="500001")
    phone = Column(String(50), default="+91 98765 43210")
    email = Column(String(100), default="info@citycarehospital.com")
    tax_id = Column(String(50), default="GSTIN36AAAAA0000A1Z5")
    currency_symbol = Column(String(10), default="₹")
    logo_url = Column(String(300), nullable=True)
    terms_conditions = Column(Text, default="1. Fees once paid are non-refundable.\n2. Consultation valid for 7 days from issue date.\n3. Please bring this receipt for all follow-up visits.")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Medicine(Base):
    __tablename__ = "medicines"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    brand_name = Column(String(150), index=True)
    generic_name = Column(String(150), nullable=True)
    category = Column(String(50), default="Tablet")  # Tablet, Syrup, Capsule, Injection, Ointment, Drops
    strength = Column(String(50), nullable=True)     # e.g. 500mg, 250mg, 10ml
    default_dosage = Column(String(50), default="1 tablet")
    default_frequency = Column(String(50), default="1-0-1")
    default_duration = Column(String(50), default="5 days")
    default_instruction = Column(String(100), default="After Food")
    created_at = Column(DateTime, default=datetime.utcnow)

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    prescription_number = Column(String(50), index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    date = Column(DateTime, default=datetime.utcnow)
    
    # Vitals
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    pulse = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    spo2 = Column(Integer, nullable=True)
    blood_sugar = Column(Float, nullable=True)
    
    # Clinical findings
    chief_complaint = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    advice = Column(Text, nullable=True)
    investigations_advised = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    
    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"))
    medicine_name = Column(String(200))
    dosage = Column(String(50))           # e.g. 500 mg, 1 tablet
    frequency = Column(String(50))        # 1-0-1, 1-1-1, 1-0-0
    duration = Column(String(50))         # 3 days, 5 days
    instruction = Column(String(100))     # After food, Before food
    route = Column(String(50), default="Oral") # Oral, IV, Topical
    created_at = Column(DateTime, default=datetime.utcnow)
    
    prescription = relationship("Prescription", back_populates="items")

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    appointment_number = Column(String(50), index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_date = Column(Date, default=date.today)
    time_slot = Column(String(20), default="10:00 AM")
    token_number = Column(Integer, default=1)
    status = Column(String(30), default="waiting") # waiting, in_consultation, completed, cancelled
    chief_complaint = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")

class DischargeSummary(Base):
    __tablename__ = "discharge_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    summary_number = Column(String(50), index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    admission_date = Column(Date)
    discharge_date = Column(Date)
    final_diagnosis = Column(Text)
    treatment_summary = Column(Text)
    condition_at_discharge = Column(String(100), default="Stable and Recovered")
    discharge_medications = Column(Text, nullable=True)
    follow_up_instructions = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="discharge_summaries")
    doctor = relationship("Doctor")