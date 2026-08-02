from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Base
import os

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

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=True  # Set to False in production
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    Base.metadata.create_all(bind=engine)
    
    # Run SaaS migrations
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    
    # Add columns to users if they don't exist
    if 'users' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('users')]
        if 'ad_free' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN ad_free BOOLEAN DEFAULT 0"))
        if 'subscription_tier' not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free'"))
                
    # Add user_id to scoped tables
    scoped_tables = ['doctors', 'patients', 'op_bills', 'ip_bills', 'departments', 'particulars']
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
            print("✅ Default superadmin seeded (superadmin / admin123)")
            
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
            print("✅ Default advertisements seeded successfully")
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