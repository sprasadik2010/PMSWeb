from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import os

from database import create_tables
from .routers import (
    auth, patients, doctors, bills, dashboard, reports, 
    seeder, settings, ads, admin, prescriptions, 
    medicines, appointments, clinic_settings, 
    discharge_summaries, staff
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    create_tables()
    yield

app = FastAPI(
    title="Patient Management System - Pro SaaS",
    description="Comprehensive Clinic & Hospital Management System with EMR, Billing, Appointments, and Multi-Tenancy",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8000"
    ],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(bills.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(seeder.router)
app.include_router(settings.router)
app.include_router(ads.router)
app.include_router(admin.router)
app.include_router(prescriptions.router)
app.include_router(medicines.router)
app.include_router(appointments.router)
app.include_router(clinic_settings.router)
app.include_router(discharge_summaries.router)
app.include_router(staff.router)

@app.get("/")
async def root():
    return {
        "message": "Patient Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "modules": ["OP/IP Registration", "Billing", "Doctor Master", "Reports"]
    }

# ✅ ADD THIS HEALTH ENDPOINT FOR GITHUB ACTIONS
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "City Patient Management System API",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)