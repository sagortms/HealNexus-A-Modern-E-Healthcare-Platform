# healnexus_backend/schemas/api_schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- TOKEN SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    id: Optional[int] = None
    role: Optional[str] = None

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    specialization: Optional[str] = None
    license_no: Optional[str] = None

class UserCreate(UserBase):
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

# ---> THE MISSING LOGIN SCHEMA <---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(UserBase):
    id: int
    is_approved: bool # Changed from is_active to match model
    created_at: datetime

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy database objects

class DoctorProfileUpdate(BaseModel):
    specialization: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

class AvailabilityUpdate(BaseModel):
    availability: str # JSON string

# --- APPOINTMENT SCHEMAS ---
class AppointmentCreate(BaseModel):
    doctor_id: int
    date_time: datetime
    reason: str

class AppointmentRead(AppointmentCreate):
    id: int
    patient_id: int
    status: str

    class Config:
        from_attributes = True

class ConfirmAppointment(BaseModel):
    date_time: datetime
    meet_link: Optional[str] = None

class RejectAppointment(BaseModel):
    rejection_reason: str

class NegotiateAppointment(BaseModel):
    suggested_time: datetime

class RespondNegotiation(BaseModel):
    accept: bool # True to confirm suggested_time, False to reject

class VisitNotesUpdate(BaseModel):
    visit_notes: str

# --- PRESCRIPTION SCHEMAS ---
class MedicineItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str

class PrescriptionCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    medicines: List[MedicineItem]
    notes: Optional[str] = None


class PrescriptionRead(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    medicines_json: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- NEW PHARMACY & MEDICINE SCHEMAS (RESPONSE & REQUEST) ---

class IndicationRead(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class ManufacturerRead(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class GenericRead(BaseModel):
    id: int
    name: str
    side_effects: Optional[str] = None
    indications: List[IndicationRead] = []
    class Config:
        from_attributes = True

class DrugClassRead(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class DosageFormRead(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class MedicineRead(BaseModel):
    id: int
    brand_name: str
    strength: Optional[str] = None
    price: Optional[str] = None
    manufacturer: Optional[ManufacturerRead] = None
    generic: Optional[GenericRead] = None
    drug_class: Optional[DrugClassRead] = None
    dosage_form: Optional[DosageFormRead] = None

    class Config:
        from_attributes = True

class SymptomSearchRequest(BaseModel):
    symptoms: str

class CommonPrescriptionProfile(BaseModel):
    generic: GenericRead
    top_brands: List[MedicineRead]
    dosage_guideline: str = "Consult a pharmacist or doctor for exact dosage."

    class Config:
        from_attributes = True
