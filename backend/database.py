# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker
from app.models.models import Base
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from sqlalchemy.sql.functions import GenericFunction
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.compiler import compiles
# pyrefly: ignore [missing-import]
from sqlalchemy import Date
import os

# Load environment variables from .env file if it exists
load_dotenv()

# Register custom date compiler for PostgreSQL support on func.date()
class date(GenericFunction):
    name = 'date'
    type = Date()
    inherit_cache = True

@compiles(date, 'postgresql')
def compile_date_postgres(element, compiler, **kw):
    # Compiles func.date(col) to CAST(col AS DATE) in PostgreSQL
    return f"CAST({compiler.process(element.clauses, **kw)} AS DATE)"

@compiles(date, 'sqlite')
def compile_date_sqlite(element, compiler, **kw):
    # Compiles func.date(col) to date(col) in SQLite
    return f"date({compiler.process(element.clauses, **kw)})"

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Normalize postgres:// to postgresql:// as required by SQLAlchemy 1.4+
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    connect_args = {}
else:
    # Fallback to local SQLite database
    if "LOCALAPPDATA" in os.environ:
        APP_DATA_DIR = os.path.join(os.environ["LOCALAPPDATA"], "PMSLite")
        OLD_APP_DATA_DIR = os.path.join(os.environ["LOCALAPPDATA"], "HMSLite")
        os.makedirs(APP_DATA_DIR, exist_ok=True)
        db_path = os.path.join(APP_DATA_DIR, "pms_lite.db")
        old_db_path = os.path.join(OLD_APP_DATA_DIR, "hms_lite.db")
        
        # Automatically migrate database file if exists in the old directory
        if not os.path.exists(db_path) and os.path.exists(old_db_path):
            import shutil
            try:
                shutil.copy2(old_db_path, db_path)
                print(f"Migrated database from {old_db_path} to {db_path}")
            except Exception as e:
                print(f"Failed to migrate database: {e}")
    else:
        # Render / Linux deployment fallback
        db_path = os.getenv("DATABASE_PATH", "pms_lite.db")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

    SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    echo=True  # Set to False in production
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    Base.metadata.create_all(bind=engine)
    
    # Run SaaS migrations
    # pyrefly: ignore [missing-import]
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    
    # Add columns to users if they don't exist
    if 'users' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'ad_free' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN ad_free BOOLEAN DEFAULT FALSE"))
        if 'subscription_tier' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free'"))
        if 'parent_user_id' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN parent_user_id INTEGER REFERENCES users(id)"))
        if 'doctor_id' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN doctor_id INTEGER REFERENCES doctors(id)"))

                
    # Add user_id to scoped tables
    scoped_tables = ['doctors', 'patients', 'op_bills', 'ip_bills', 'departments', 'particulars', 'medicines', 'prescriptions', 'appointments', 'discharge_summaries']
    for table in scoped_tables:
        if table in inspector.get_table_names():
            columns = [c['name'] for c in inspector.get_columns(table)]
            if 'user_id' not in columns:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                    
    # Seed default superadmin and advertisements
    db = SessionLocal()
    try:
        # Check if superadmin exists
        from app.models.models import User, Ad
        # pyrefly: ignore [missing-import]
        import bcrypt
        
        superadmin = db.query(User).filter(User.username == "superadmin").first()
        if not superadmin:
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw("admin123".encode('utf-8'), salt).decode('utf-8')
            admin_user = User(
                username="superadmin",
                password=hashed_password,
                full_name="SaaS Super Admin",
                role="superadmin",
                is_active=True,
                ad_free=True,
                subscription_tier="premium"
            )
            db.add(admin_user)
            db.commit()
            print("[OK] Default superadmin seeded (superadmin / admin123)")
            
        # Seed default ads if empty
        ad_count = db.query(Ad).count()
        if ad_count == 0:
            default_ads = [
                Ad(
                    title="Remove Ads - Go Premium",
                    description="Get an ad-free experience, unlimited patient records, priority hospital support and advanced analytical reports.",
                    image_url="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",
                    link_url="/upgrade",
                    is_active=True
                ),
                Ad(
                    title="Stethoscope Prime Series",
                    description="Upgrade your clinical instruments with Littmann Classic III Stethoscopes. Special 15% discount for PMS clinics.",
                    image_url="https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=600&q=80",
                    link_url="https://www.littmann.com",
                    is_active=True
                ),
                Ad(
                    title="Practo Clinic Plus Integration",
                    description="Sync calendar appointments with patients. Get discovered by thousands of active patients in your local neighborhood.",
                    image_url="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
                    link_url="https://www.practo.com",
                    is_active=True
                )
            ]
            db.bulk_save_objects(default_ads)
            db.commit()
            print("[OK] Default advertisements seeded successfully")
            
        # Seed default medicines
        from app.models.models import Medicine
        med_count = db.query(Medicine).count()
        if med_count == 0:
            sample_medicines = [
                Medicine(brand_name="Paracetamol 650", generic_name="Acetaminophen", category="Tablet", strength="650mg", default_dosage="1 tablet", default_frequency="1-0-1", default_duration="3 days", default_instruction="After Food"),
                Medicine(brand_name="Amoxiclav 625", generic_name="Amoxicillin + Clavulanic Acid", category="Tablet", strength="625mg", default_dosage="1 tablet", default_frequency="1-0-1", default_duration="5 days", default_instruction="After Food"),
                Medicine(brand_name="Pantocid 40", generic_name="Pantoprazole", category="Tablet", strength="40mg", default_dosage="1 tablet", default_frequency="1-0-0", default_duration="7 days", default_instruction="Empty Stomach (Before Breakfast)"),
                Medicine(brand_name="Azithral 500", generic_name="Azithromycin", category="Tablet", strength="500mg", default_dosage="1 tablet", default_frequency="1-0-0", default_duration="3 days", default_instruction="After Food"),
                Medicine(brand_name="Montair-LC", generic_name="Montelukast + Levocetirizine", category="Tablet", strength="10mg/5mg", default_dosage="1 tablet", default_frequency="0-0-1", default_duration="5 days", default_instruction="Bedtime"),
                Medicine(brand_name="Combiflam", generic_name="Ibuprofen + Paracetamol", category="Tablet", strength="400mg/325mg", default_dosage="1 tablet", default_frequency="1-0-1", default_duration="3 days", default_instruction="After Food"),
                Medicine(brand_name="Ascoril-D Plus", generic_name="Dextromethorphan + Chlorpheniramine", category="Syrup", strength="100ml", default_dosage="10 ml", default_frequency="1-1-1", default_duration="5 days", default_instruction="After Food"),
                Medicine(brand_name="Ciplox 500", generic_name="Ciprofloxacin", category="Tablet", strength="500mg", default_dosage="1 tablet", default_frequency="1-0-1", default_duration="5 days", default_instruction="After Food"),
                Medicine(brand_name="Omez 20", generic_name="Omeprazole", category="Capsule", strength="20mg", default_dosage="1 capsule", default_frequency="1-0-0", default_duration="7 days", default_instruction="Before Breakfast"),
                Medicine(brand_name="Metrogyl 400", generic_name="Metronidazole", category="Tablet", strength="400mg", default_dosage="1 tablet", default_frequency="1-0-1", default_duration="5 days", default_instruction="After Food"),
            ]
            db.bulk_save_objects(sample_medicines)
            db.commit()
            print("[OK] Default clinical medicines seeded successfully")
    except Exception as e:
        print(f"Failed to seed defaults: {e}")
        db.rollback()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()