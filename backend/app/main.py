from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import os

from database import create_tables
from .routers import auth, patients, doctors, bills, dashboard, reports, seeder, settings, ads, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    create_tables()
    yield

app = FastAPI(
    title="Patient Management System - Lite",
    description="Basic Patient Management System with OP/IP support",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",      # React dev
#         "https://citynh.onrender.com", # Deploy
#         "tauri://localhost",          # Tauri desktop
#         "app://localhost",
#         "app://-",                    # Some webview runtimes
#         "http://127.0.0.1:5173",
#         "http://localhost",
#         "http://127.0.0.1",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
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