from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime,date

# User Schemas
class UserBase(BaseModel):
    username: str
    full_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    ad_free: bool
    subscription_tier: str
    
    class Config:
        from_attributes = True

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Doctor Schemas
class DoctorBase(BaseModel):
    code: str
    name: str
    address: str
    qualification: str
    phone: str
    email: str
    specialty: str
    department: str
    op_validity: int = 30
    booking_code: str
    max_tokens: int = 50
    doctor_amount: float = 0
    hospital_amount: float = 0
    doctor_revisit: float = 0
    hospital_revisit: float = 0
    from_time: str
    to_time: str

class DoctorCreate(DoctorBase):
    pass

class DoctorResponse(DoctorBase):
    id: int
    is_resigned: bool
    is_discontinued: bool
    resignation_date: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Patient Schemas
class PatientBase(BaseModel):
    name: str
    age: str
    gender: str
    complaint: str
    house: str
    street: str
    place: str
    phone: str
    doctor_id: int
    referred_by: Optional[str] = None
    room: Optional[str] = None

class PatientCreate(PatientBase):
    is_ip: bool = False

class PatientResponse(PatientBase):
    id: int
    op_number: str
    ip_number: Optional[str]
    registration_date: datetime
    is_ip: bool
    created_by: str
    created_at: datetime
    doctor_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Bill Item Schemas
class OPBillItemCreate(BaseModel):
    particular: str
    doctor: str
    department: str
    unit: int = 1
    rate: float = 0
    discount_percent: float = 0

class OPBillItemResponse(OPBillItemCreate):
    id: int
    amount: float
    discount_amount: float
    total: float
    
    class Config:
        from_attributes = True

class IPBillItemCreate(BaseModel):
    particular: str
    # doctor: str
    department: str
    amount: float
    discount_percent: float = 0
    doctor_id: int = 0

class IPBillItemResponse(IPBillItemCreate):
    id: int
    discount_amount: float
    total: float
    
    class Config:
        from_attributes = True

# Bill Schemas
class OPBillCreate(BaseModel):
    patient_id: int
    bill_type: str
    category: str
    doctor_id: int
    discount_type: str = "Percent"
    items: List[OPBillItemCreate]

class OPBillResponse(BaseModel):
    id: int
    bill_number: str
    bill_date: datetime
    patient_id: int
    bill_type: str
    category: str
    doctor_id: int
    discount_type: str
    total_amount: float
    discount_amount: float
    net_amount: float
    created_by: str
    created_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    items: List[OPBillItemResponse]
    
    class Config:
        from_attributes = True

class IPBillCreate(BaseModel):
    patient_id: int
    is_credit: bool = False
    is_insurance: bool = False
    category: str
    doctor_id: int
    discount_type: str = "Percent"
    room: str
    admission_date: date
    insurance_company: Optional[str] = None
    third_party: Optional[str] = None
    service_tax: float = 0
    education_cess: float = 0
    she_education_cess: float = 0
    items: List[IPBillItemCreate]

class IPBillResponse(BaseModel):
    id: int
    bill_number: str
    bill_date: datetime
    patient_id: int
    is_credit: bool
    is_insurance: bool
    category: str
    doctor_id: int
    discount_type: str
    room: str
    admission_date: date
    insurance_company: Optional[str]
    third_party: Optional[str]
    total_amount: float
    service_tax: float
    education_cess: float
    she_education_cess: float
    net_amount: float
    created_by: str
    created_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    items: List[IPBillItemResponse]
    
    class Config:
        from_attributes = True

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_patients_today: int
    total_op_bills_today: int
    total_ip_bills_today: int
    total_revenue_today: float

# Report Schemas
class DailyOPReport(BaseModel):
    bill_number: str
    bill_date: datetime
    patient_name: str
    doctor_name: str
    total_amount: float
    discount_amount: float
    net_amount: float
    
    class Config:
        from_attributes = True

class BillSummary(BaseModel):
    date: date
    op_count: int
    op_total: float
    ip_count: int
    ip_total: float
    total_revenue: float

# Department Schemas (Minimal)
class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Particular Schemas (Minimal)
class ParticularBase(BaseModel):
    name: str
    opdefault: Optional[bool] = False
    ipdefault: Optional[bool] = False
    sortorder: Optional[int] = -1

class ParticularCreate(ParticularBase):
    pass
    
class ParticularUpdate(BaseModel):
    name: Optional[str] = None
    opdefault: Optional[bool] = None
    ipdefault: Optional[bool] = None
    sortorder: Optional[int] = None

class ParticularResponse(ParticularBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Clinic Setting Schemas
class ClinicSettingBase(BaseModel):
    clinic_name: str
    tagline: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None
    currency_symbol: Optional[str] = "₹"
    logo_url: Optional[str] = None
    terms_conditions: Optional[str] = None

class ClinicSettingUpdate(ClinicSettingBase):
    pass

class ClinicSettingResponse(ClinicSettingBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Medicine Schemas
class MedicineBase(BaseModel):
    brand_name: str
    generic_name: Optional[str] = None
    category: str = "Tablet"
    strength: Optional[str] = None
    default_dosage: Optional[str] = "1 tablet"
    default_frequency: Optional[str] = "1-0-1"
    default_duration: Optional[str] = "5 days"
    default_instruction: Optional[str] = "After Food"

class MedicineCreate(MedicineBase):
    pass

class MedicineResponse(MedicineBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Prescription Schemas
class PrescriptionItemCreate(BaseModel):
    medicine_name: str
    dosage: str = "1 tablet"
    frequency: str = "1-0-1"
    duration: str = "5 days"
    instruction: str = "After Food"
    route: str = "Oral"

class PrescriptionItemResponse(PrescriptionItemCreate):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    patient_id: int
    doctor_id: int
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    pulse: Optional[int] = None
    temperature: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    spo2: Optional[int] = None
    blood_sugar: Optional[float] = None
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    clinical_notes: Optional[str] = None
    advice: Optional[str] = None
    investigations_advised: Optional[str] = None
    follow_up_date: Optional[date] = None
    items: List[PrescriptionItemCreate]

class PrescriptionResponse(BaseModel):
    id: int
    prescription_number: str
    patient_id: int
    doctor_id: int
    date: datetime
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    pulse: Optional[int] = None
    temperature: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    spo2: Optional[int] = None
    blood_sugar: Optional[float] = None
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    clinical_notes: Optional[str] = None
    advice: Optional[str] = None
    investigations_advised: Optional[str] = None
    follow_up_date: Optional[date] = None
    created_by: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    patient_age: Optional[str] = None
    patient_gender: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialty: Optional[str] = None
    items: List[PrescriptionItemResponse]
    
    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: Optional[date] = None
    time_slot: Optional[str] = "10:00 AM"
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    appointment_number: str
    patient_id: int
    doctor_id: int
    appointment_date: date
    time_slot: str
    token_number: int
    status: str
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Discharge Summary Schemas
class DischargeSummaryCreate(BaseModel):
    patient_id: int
    doctor_id: int
    admission_date: date
    discharge_date: date
    final_diagnosis: str
    treatment_summary: str
    condition_at_discharge: str = "Stable and Recovered"
    discharge_medications: Optional[str] = None
    follow_up_instructions: Optional[str] = None

class DischargeSummaryResponse(DischargeSummaryCreate):
    id: int
    summary_number: str
    created_by: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Staff Management Schemas
class StaffCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str # doctor, receptionist, nurse, billing
    doctor_id: Optional[int] = None

class StaffResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    doctor_id: Optional[int] = None
    
    class Config:
        from_attributes = True