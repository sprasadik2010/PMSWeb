from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User, Doctor
from auth import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_user = User(
                username="admin",
                password=get_password_hash("admin123"),
                full_name="System Administrator",
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("Admin user created: admin/admin123")
        
        # Create sample doctors
        doctors = [
            Doctor(
                code="DR001",
                name="John Smith",
                address="123 Medical Center, City",
                qualification="MBBS, MD",
                phone="9876543210",
                email="john.smith@hospital.com",
                specialty="General Physician",
                department="General Medicine",
                op_validity=30,
                booking_code="GP01",
                max_tokens=50,
                doctor_amount=300,
                hospital_amount=100,
                doctor_revisit=200,
                hospital_revisit=50,
                from_time="09:00",
                to_time="17:00"
            ),
            Doctor(
                code="DR002",
                name="Sarah Johnson",
                address="456 Health Street, Town",
                qualification="MBBS, MS",
                phone="9876543211",
                email="sarah.j@hospital.com",
                specialty="Cardiologist",
                department="Cardiology",
                op_validity=30,
                booking_code="CD01",
                max_tokens=30,
                doctor_amount=500,
                hospital_amount=150,
                doctor_revisit=350,
                hospital_revisit=75,
                from_time="10:00",
                to_time="16:00"
            ),
            Doctor(
                code="DR003",
                name="Michael Brown",
                address="789 Care Avenue, Village",
                qualification="MBBS, DCH",
                phone="9876543212",
                email="michael.b@hospital.com",
                specialty="Pediatrician",
                department="Pediatrics",
                op_validity=30,
                booking_code="PD01",
                max_tokens=40,
                doctor_amount=400,
                hospital_amount=120,
                doctor_revisit=250,
                hospital_revisit=60,
                from_time="09:30",
                to_time="17:30"
            )
        ]
        
        for doctor in doctors:
            existing = db.query(Doctor).filter(Doctor.code == doctor.code).first()
            if not existing:
                db.add(doctor)
        
        db.commit()
        print("Sample doctors created")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Create admin user and sample data
    create_admin_user()