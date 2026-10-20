import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
from core.database import engine
from models import db_models

# Import routers
from api import auth_routes, patient_routes, doctor_routes, admin_routes, medical_routes, chat_routes, notification_routes

# This creates the tables in the database if they don't exist yet
# (Note: We already ran the SQL script, but this is a good safety net)
db_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# --- DIRECTORY SETUP ---
# Ensure upload folders exist so the server doesn't crash when saving files
os.makedirs("uploads/medical_records", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- CORS SETTINGS ---
# This is the "permission slip" that allows your React app to talk to this API
origins = [
    "http://localhost:5173",    # Standard Vite port
    "http://127.0.0.1:5173",    # Local IP variation
    "http://localhost:3000",    # Common alternative port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Allows all headers (Authorization, Content-Type, etc.)
)

# --- ROUTER REGISTRATION ---
# The 'prefix' here is crucial. 
# Your signup URL will be: http://127.0.0.1:8000/auth/register
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
app.include_router(patient_routes.router, prefix="/patient", tags=["Patient Dashboard"])
app.include_router(doctor_routes.router, prefix="/doctor", tags=["Doctor Dashboard"])
app.include_router(admin_routes.router, prefix="/admin", tags=["Admin Dashboard"]) 
app.include_router(medical_routes.router, prefix="/medical", tags=["Medical Directory & Search"])
app.include_router(chat_routes.router, prefix="/chat", tags=["Consultation Chat"])
app.include_router(notification_routes.router, prefix="/notifications", tags=["System Notifications"])

# --- HEALTH CHECK ---
@app.get("/", tags=["Health"])
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "database": "connected",
        "message": "HealNexus API is running perfectly."
    }