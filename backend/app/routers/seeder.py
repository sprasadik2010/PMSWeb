import random
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from database import SessionLocal, get_db
from ..models.models import Doctor, Patient, OPBill, OPBillItem, IPBill, IPBillItem

router = APIRouter(prefix="/seed", tags=["Data Seeder"])

# Constants
DEPARTMENTS = [
    "General Medicine", "Cardiology", "Pediatrics", "Orthopedics",
    "Dermatology", "Neurology", "ENT", "Ophthalmology",
    "Dentistry", "General", "Hospital", "OPD"
]

PARTICULAR_ITEMS = [
    "Consultation", "Review", "Procedure", "Medicine", "Test",
    "X-Ray", "ECG", "Ultrasound", "Injection", "Dressing", "Other"
]

IP_PARTICULAR_ITEMS = [
    "Room Charges", "Doctor Fees", "Water Bill",
    "Professional Fee", "Consultation", "Review",
    "Procedure", "Medicine", "Test", "X-Ray",
    "ECG", "Ultrasound", "Injection", "Dressing", "Other"
]

DOCTORS_DATA = [
    {
        "code": "DOC-LON-001",
        "name": "Dr John Smith",
        "address": "221B Baker Street, London",
        "qualification": "MBBS, MD",
        "phone": "07123456701",
        "email": "john.smith@londonclinic.co.uk",
        "specialty": "Cardiology",
        "department": "Cardiology",
        "op_validity": 30,
        "booking_code": "CAR-JS",
        "max_tokens": 50,
        "doctor_amount": 800,
        "hospital_amount": 200,
        "doctor_revisit": 400,
        "hospital_revisit": 100,
        "from_time": "09:00",
        "to_time": "13:00"
    },
    {
        "code": "DOC-LON-002",
        "name": "Dr Emily Brown",
        "address": "10 Downing Street, London",
        "qualification": "MBBS, DGO",
        "phone": "07123456702",
        "email": "emily.brown@londonclinic.co.uk",
        "specialty": "Gynecology",
        "department": "Gynecology",
        "op_validity": 30,
        "booking_code": "GYN-EB",
        "max_tokens": 50,
        "doctor_amount": 700,
        "hospital_amount": 200,
        "doctor_revisit": 350,
        "hospital_revisit": 100,
        "from_time": "10:00",
        "to_time": "14:00"
    },
    {
        "code": "DOC-LON-003",
        "name": "Dr Michael Green",
        "address": "Oxford Street, London",
        "qualification": "MBBS, MS",
        "phone": "07123456703",
        "email": "michael.green@londonclinic.co.uk",
        "specialty": "Orthopedics",
        "department": "Orthopedics",
        "op_validity": 30,
        "booking_code": "ORT-MG",
        "max_tokens": 50,
        "doctor_amount": 900,
        "hospital_amount": 300,
        "doctor_revisit": 450,
        "hospital_revisit": 150,
        "from_time": "11:00",
        "to_time": "16:00"
    },
    {
        "code": "DOC-LON-004",
        "name": "Dr Sarah Wilson",
        "address": "Canary Wharf, London",
        "qualification": "MBBS, MD",
        "phone": "07123456704",
        "email": "sarah.wilson@londonclinic.co.uk",
        "specialty": "Dermatology",
        "department": "Dermatology",
        "op_validity": 30,
        "booking_code": "DER-SW",
        "max_tokens": 50,
        "doctor_amount": 600,
        "hospital_amount": 150,
        "doctor_revisit": 300,
        "hospital_revisit": 80,
        "from_time": "09:30",
        "to_time": "12:30"
    },
    {
        "code": "DOC-LON-005",
        "name": "Dr David Miller",
        "address": "Camden Town, London",
        "qualification": "MBBS, DM",
        "phone": "07123456705",
        "email": "david.miller@londonclinic.co.uk",
        "specialty": "Neurology",
        "department": "Neurology",
        "op_validity": 30,
        "booking_code": "NEU-DM",
        "max_tokens": 50,
        "doctor_amount": 1000,
        "hospital_amount": 300,
        "doctor_revisit": 500,
        "hospital_revisit": 150,
        "from_time": "14:00",
        "to_time": "18:00"
    },
    {
        "code": "DOC-LON-006",
        "name": "Dr Olivia Taylor",
        "address": "Greenwich, London",
        "qualification": "MBBS, MD",
        "phone": "07123456706",
        "email": "olivia.taylor@londonclinic.co.uk",
        "specialty": "Pediatrics",
        "department": "Pediatrics",
        "op_validity": 30,
        "booking_code": "PED-OT",
        "max_tokens": 50,
        "doctor_amount": 500,
        "hospital_amount": 150,
        "doctor_revisit": 250,
        "hospital_revisit": 75,
        "from_time": "08:30",
        "to_time": "12:00"
    },
    {
        "code": "DOC-LON-007",
        "name": "Dr James Anderson",
        "address": "Soho, London",
        "qualification": "MBBS, MD",
        "phone": "07123456707",
        "email": "james.anderson@londonclinic.co.uk",
        "specialty": "ENT",
        "department": "ENT",
        "op_validity": 30,
        "booking_code": "ENT-JA",
        "max_tokens": 50,
        "doctor_amount": 550,
        "hospital_amount": 150,
        "doctor_revisit": 275,
        "hospital_revisit": 75,
        "from_time": "13:00",
        "to_time": "17:00"
    },
    {
        "code": "DOC-LON-008",
        "name": "Dr Sophia Lee",
        "address": "Wembley, London",
        "qualification": "MBBS, MD",
        "phone": "07123456708",
        "email": "sophia.lee@londonclinic.co.uk",
        "specialty": "Psychiatry",
        "department": "Psychiatry",
        "op_validity": 30,
        "booking_code": "PSY-SL",
        "max_tokens": 50,
        "doctor_amount": 750,
        "hospital_amount": 200,
        "doctor_revisit": 375,
        "hospital_revisit": 100,
        "from_time": "10:00",
        "to_time": "15:00"
    },
    {
        "code": "DOC-LON-009",
        "name": "Dr Daniel Harris",
        "address": "Paddington, London",
        "qualification": "MBBS, MD",
        "phone": "07123456709",
        "email": "daniel.harris@londonclinic.co.uk",
        "specialty": "General Medicine",
        "department": "General Medicine",
        "op_validity": 30,
        "booking_code": "GEN-DH",
        "max_tokens": 50,
        "doctor_amount": 400,
        "hospital_amount": 100,
        "doctor_revisit": 200,
        "hospital_revisit": 50,
        "from_time": "09:00",
        "to_time": "17:00"
    },
    {
        "code": "DOC-LON-010",
        "name": "Dr Emma Clark",
        "address": "King's Cross, London",
        "qualification": "MBBS, MS",
        "phone": "07123456710",
        "email": "emma.clark@londonclinic.co.uk",
        "specialty": "Ophthalmology",
        "department": "Ophthalmology",
        "op_validity": 30,
        "booking_code": "OPH-EC",
        "max_tokens": 50,
        "doctor_amount": 650,
        "hospital_amount": 180,
        "doctor_revisit": 325,
        "hospital_revisit": 90,
        "from_time": "11:00",
        "to_time": "15:30"
    }
]

PATIENTS_DATA = [
    {
        "name": "Oliver Johnson",
        "age": "34",
        "gender": "Male",
        "complaint": "Chest pain",
        "house": "12A",
        "street": "Baker Street",
        "place": "London",
        "phone": "07900000001",
        "referred_by": "Self",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Amelia Brown",
        "age": "28",
        "gender": "Female",
        "complaint": "Irregular periods",
        "house": "45",
        "street": "Oxford Street",
        "place": "London",
        "phone": "07900000002",
        "referred_by": "Friend",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Harry Wilson",
        "age": "41",
        "gender": "Male",
        "complaint": "Knee pain",
        "house": "89",
        "street": "Camden Road",
        "place": "London",
        "phone": "07900000003",
        "referred_by": "GP",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Isla Taylor",
        "age": "6",
        "gender": "Female",
        "complaint": "Fever and cough",
        "house": "7",
        "street": "Greenwich High Road",
        "place": "London",
        "phone": "07900000004",
        "referred_by": "Parent",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Noah Anderson",
        "age": "52",
        "gender": "Male",
        "complaint": "Headache",
        "house": "101",
        "street": "Canary Wharf",
        "place": "London",
        "phone": "07900000005",
        "referred_by": "Self",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Sophia Martin",
        "age": "37",
        "gender": "Female",
        "complaint": "Skin rash",
        "house": "22",
        "street": "Soho Street",
        "place": "London",
        "phone": "07900000006",
        "referred_by": "Derm Clinic",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Jack Thompson",
        "age": "60",
        "gender": "Male",
        "complaint": "Memory loss",
        "house": "18",
        "street": "Paddington Road",
        "place": "London",
        "phone": "07900000007",
        "referred_by": "Neurologist",
        "room": "Ward 2",
        "is_ip": True
    },
    {
        "name": "Mia White",
        "age": "24",
        "gender": "Female",
        "complaint": "Anxiety",
        "house": "55",
        "street": "Wembley Park",
        "place": "London",
        "phone": "07900000008",
        "referred_by": "Counsellor",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Leo Harris",
        "age": "45",
        "gender": "Male",
        "complaint": "Diabetes review",
        "house": "9",
        "street": "King's Cross Road",
        "place": "London",
        "phone": "07900000009",
        "referred_by": "GP",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Lily Walker",
        "age": "31",
        "gender": "Female",
        "complaint": "Eye irritation",
        "house": "33",
        "street": "Victoria Street",
        "place": "London",
        "phone": "07900000010",
        "referred_by": "Self",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Ethan Hall",
        "age": "14",
        "gender": "Male",
        "complaint": "Ear pain",
        "house": "66",
        "street": "Croydon Road",
        "place": "London",
        "phone": "07900000011",
        "referred_by": "Parent",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Ava Young",
        "age": "48",
        "gender": "Female",
        "complaint": "Back pain",
        "house": "90",
        "street": "Hammersmith Road",
        "place": "London",
        "phone": "07900000012",
        "referred_by": "Physio",
        "room": "Ward 1",
        "is_ip": True
    },
    {
        "name": "William King",
        "age": "55",
        "gender": "Male",
        "complaint": "Hypertension",
        "house": "14",
        "street": "Strand",
        "place": "London",
        "phone": "07900000013",
        "referred_by": "GP",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Freya Scott",
        "age": "19",
        "gender": "Female",
        "complaint": "Acne",
        "house": "71",
        "street": "Brixton Road",
        "place": "London",
        "phone": "07900000014",
        "referred_by": "Self",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "James Moore",
        "age": "63",
        "gender": "Male",
        "complaint": "Vision problem",
        "house": "5",
        "street": "Ealing Broadway",
        "place": "London",
        "phone": "07900000015",
        "referred_by": "Optician",
        "room": "Ward 3",
        "is_ip": True
    },
    {
        "name": "Grace Lewis",
        "age": "27",
        "gender": "Female",
        "complaint": "Migraine",
        "house": "39",
        "street": "Tower Bridge Road",
        "place": "London",
        "phone": "07900000016",
        "referred_by": "Self",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Benjamin Clark",
        "age": "8",
        "gender": "Male",
        "complaint": "Cold and fever",
        "house": "88",
        "street": "Lewisham High Street",
        "place": "London",
        "phone": "07900000017",
        "referred_by": "Parent",
        "room": "OPD",
        "is_ip": False
    },
    {
        "name": "Chloe Adams",
        "age": "42",
        "gender": "Female",
        "complaint": "Thyroid check",
        "house": "27",
        "street": "Richmond Road",
        "place": "London",
        "phone": "07900000018",
        "referred_by": "GP",
        "room": "OPD",
        "is_ip": False
    }
]

from fastapi import Depends
from .auth import get_current_user

@router.post("/all", summary="Insert all dummy data")
async def insert_all_dummy_data(
    db: SessionLocal = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Insert dummy data for:
    1. Doctors (10 records)
    2. Patients (18 records)
    3. OP Bills (25 records)
    4. IP Bills (25 records)
    
    This endpoint combines all 4 scripts into one call.
    """
    try:
        # Step 2: Insert Doctors
        print("Inserting doctors...")
        doctors_objects = []
        for doc_data in DOCTORS_DATA:
            doctor = Doctor(**doc_data, user_id=current_user.id)
            doctors_objects.append(doctor)
        
        db.bulk_save_objects(doctors_objects)
        db.commit()
        print("✅ 10 doctors inserted successfully")
        
        # Step 3: Get doctor IDs for patient assignment
        doctor_ids = [d.id for d in db.query(Doctor.id).filter(Doctor.user_id == current_user.id).all()]
        if not doctor_ids:
            raise HTTPException(status_code=500, detail="No doctors found after insertion")
        
        # Step 4: Insert Patients
        print("Inserting patients...")
        patients_objects = []
        for patient_data in PATIENTS_DATA:
            patient = Patient(
                **patient_data,
                doctor_id=random.choice(doctor_ids),
                user_id=current_user.id
            )
            patients_objects.append(patient)
        
        db.bulk_save_objects(patients_objects)
        db.commit()
        print("✅ 18 patients inserted successfully")
        
        # Step 5: Get patient and doctor IDs for bills
        all_patients = db.query(Patient).filter(Patient.user_id == current_user.id).all()
        op_patients = [p for p in all_patients if not p.is_ip]
        ip_patients = [p for p in all_patients if p.is_ip]
        all_doctors = db.query(Doctor).filter(Doctor.user_id == current_user.id).all()
        
        if not op_patients:
            raise HTTPException(status_code=500, detail="No OP patients found")
        if not ip_patients:
            raise HTTPException(status_code=500, detail="No IP patients found")
        if not all_doctors:
            raise HTTPException(status_code=500, detail="No doctors found")
        
        # Step 6: Insert OP Bills
        print("Inserting OP bills...")
        start_date = date(2025, 12, 1)
        
        for i in range(25):
            patient = op_patients[i % len(op_patients)]
            doctor = random.choice(all_doctors)
            bill_date = start_date + timedelta(days=i)
            
            bill = OPBill(
                patient_id=patient.id,
                bill_type="OP",
                category="Consultation",
                doctor_id=doctor.id,
                discount_type="Percent",
                bill_date=bill_date,
                user_id=current_user.id
            )
            
            db.add(bill)
            db.flush()
            
            for _ in range(random.randint(1, 3)):
                item = OPBillItem(
                    bill_id=bill.id,
                    particular=random.choice(PARTICULAR_ITEMS),
                    doctor=doctor.booking_code,
                    department=random.choice(DEPARTMENTS),
                    unit=1,
                    rate=random.choice([200, 300, 400, 500]),
                    discount_percent=random.choice([0, 5, 10])
                )
                db.add(item)
        
        print("✅ 25 OP bills inserted")
        
        # Step 7: Insert IP Bills
        print("Inserting IP bills...")
        
        for i in range(25):
            patient = ip_patients[i % len(ip_patients)]
            doctor = random.choice(all_doctors)
            admission_date = start_date + timedelta(days=i)
            
            bill = IPBill(
                patient_id=patient.id,
                is_credit=False,
                is_insurance=False,
                category="IP",
                doctor_id=doctor.id,
                discount_type="Percent",
                room=random.choice(["Ward 1", "Ward 2", "Ward 3", "ICU", "Deluxe"]),
                admission_date=admission_date,
                insurance_company="",
                third_party="",
                service_tax=0,
                education_cess=0,
                she_education_cess=0,
                user_id=current_user.id
            )
            
            db.add(bill)
            db.flush()
            
            for _ in range(random.randint(2, 5)):
                item = IPBillItem(
                    bill_id=bill.id,
                    particular=random.choice(IP_PARTICULAR_ITEMS),
                    # doctor=doctor.booking_code,
                    department=random.choice(DEPARTMENTS),
                    amount=random.choice([500, 1000, 1500, 2000, 3000]),
                    discount_percent=random.choice([0, 5, 10]),
                    doctor_id=doctor.id
                )
                db.add(item)
        
        db.commit()
        print("✅ 25 IP bills inserted")
        
        # Final summary
        total_doctors = db.query(Doctor).filter(Doctor.user_id == current_user.id).count()
        total_patients = db.query(Patient).filter(Patient.user_id == current_user.id).count()
        total_op_bills = db.query(OPBill).filter(OPBill.user_id == current_user.id).count()
        total_ip_bills = db.query(IPBill).filter(IPBill.user_id == current_user.id).count()
        
        return {
            "message": "✅ All dummy data inserted successfully",
            "summary": {
                "doctors": total_doctors,
                "patients": total_patients,
                "op_bills": total_op_bills,
                "ip_bills": total_ip_bills
            }
        }
        
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/doctors", summary="Insert dummy doctors only")
async def insert_doctors_only(
    db: SessionLocal = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Insert only the 10 dummy doctors."""
    try:
        doctors_objects = []
        for doc_data in DOCTORS_DATA:
            doctor = Doctor(**doc_data, user_id=current_user.id)
            doctors_objects.append(doctor)
        
        db.bulk_save_objects(doctors_objects)
        db.commit()
        
        total = db.query(Doctor).filter(Doctor.user_id == current_user.id).count()
        return {
            "message": f"✅ {total} doctors inserted successfully",
            "count": total
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/patients", summary="Insert dummy patients only")
async def insert_patients_only(
    db: SessionLocal = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Insert only the 18 dummy patients (requires doctors to exist)."""
    try:
        doctor_ids = [d.id for d in db.query(Doctor.id).filter(Doctor.user_id == current_user.id).all()]
        if not doctor_ids:
            raise HTTPException(status_code=400, detail="No doctors found. Insert doctors first.")
        
        patients_objects = []
        for patient_data in PATIENTS_DATA:
            patient = Patient(
                **patient_data,
                doctor_id=random.choice(doctor_ids),
                user_id=current_user.id
            )
            patients_objects.append(patient)
        
        db.bulk_save_objects(patients_objects)
        db.commit()
        
        total = db.query(Patient).filter(Patient.user_id == current_user.id).count()
        return {
            "message": f"✅ {total} patients inserted successfully",
            "count": total
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/clear-all", summary="Clear all data (DANGER)")
async def clear_all_data(
    db: SessionLocal = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """⚠️ WARNING: Deletes ALL data from all tables for CURRENT tenant."""
    try:
        # Get patient IDs for current user to clear IP/OP bills properly
        patient_ids = [p.id for p in db.query(Patient.id).filter(Patient.user_id == current_user.id).all()]
        
        # Delete billing items for this user
        if patient_ids:
            db.query(IPBillItem).filter(IPBillItem.bill_id.in_(
                db.query(IPBill.id).filter(IPBill.patient_id.in_(patient_ids))
            )).delete(synchronize_session=False)
            
            db.query(OPBillItem).filter(OPBillItem.bill_id.in_(
                db.query(OPBill.id).filter(OPBill.patient_id.in_(patient_ids))
            )).delete(synchronize_session=False)
            
        db.query(IPBill).filter(IPBill.user_id == current_user.id).delete(synchronize_session=False)
        db.query(OPBill).filter(OPBill.user_id == current_user.id).delete(synchronize_session=False)
        db.query(Patient).filter(Patient.user_id == current_user.id).delete(synchronize_session=False)
        db.query(Doctor).filter(Doctor.user_id == current_user.id).delete(synchronize_session=False)
        db.commit()
        
        return {
            "message": "✅ Your tenant data cleared successfully",
            "warning": "This operation cannot be undone!"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")