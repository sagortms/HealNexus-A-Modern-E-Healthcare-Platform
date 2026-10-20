from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Table
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
from sqlalchemy.sql import func

# --- ASSOCIATION TABLES ---
generic_indication_association = Table(
    'hn_generic_indications',
    Base.metadata,
    Column('generic_id', Integer, ForeignKey('hn_generics.id', ondelete="CASCADE"), primary_key=True),
    Column('indication_id', Integer, ForeignKey('hn_indications.id', ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "hn_users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'patient', 'doctor', 'admin'
    
    # Optional fields based on role
    phone = Column(String(20), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    specialization = Column(String(100), nullable=True)
    license_no = Column(String(50), nullable=True)
    secondary_mobile = Column(String(20), nullable=True) # Non-mandatory field for doctors
    bio = Column(Text, nullable=True) # Professional Bio
    availability = Column(Text, nullable=True) # JSON string for working hours
    theme_preference = Column(String(20), default="light") # light or dark
    application_document_path = Column(String(255), nullable=True) # Path to qualification PDF
    is_approved = Column(Boolean, default=True) # Default True for patients, will be False for doctors in route

    created_at = Column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "hn_appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('hn_users.id', ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey('hn_users.id', ondelete="CASCADE"))
    date_time = Column(DateTime, nullable=True) # Confirmed time
    suggested_time = Column(DateTime, nullable=True) # Alternative time suggested by doctor
    reason = Column(String(255))
    status = Column(String(50), default="Pending") # Pending, Scheduled, Rejected, Negotiating, Ongoing, Completed
    rejection_reason = Column(String(255), nullable=True)
    visit_notes = Column(Text, nullable=True) # Notes taken during the actual visit
    document_path = Column(String(255), nullable=True)
    meet_link = Column(String(255), nullable=True)

class Message(Base):
    __tablename__ = "hn_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey('hn_appointments.id', ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey('hn_users.id'))
    receiver_id = Column(Integer, ForeignKey('hn_users.id'))
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

class Notification(Base):
    __tablename__ = "hn_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('hn_users.id', ondelete="CASCADE"))
    title = Column(String(100))
    message = Column(Text)
    link = Column(String(255), nullable=True) # Optional dashboard tab or route
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class MedicalRecord(Base):
    __tablename__ = "hn_medical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey('hn_users.id', ondelete="CASCADE"))
    record_type = Column(String(50))
    description = Column(Text)
    file_path = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Prescription(Base):
    __tablename__ = "hn_prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("hn_users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("hn_users.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("hn_appointments.id", ondelete="SET NULL"), nullable=True)
    medicines_json = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- NEW PHARMACY & MEDICINE MODELS ---

class Manufacturer(Base):
    __tablename__ = "hn_manufacturers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    medicines = relationship("Medicine", back_populates="manufacturer")

class Generic(Base):
    __tablename__ = "hn_generics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    side_effects = Column(Text, nullable=True)
    
    # Many-to-Many with Indications
    indications = relationship("Indication", secondary=generic_indication_association, back_populates="generics")
    medicines = relationship("Medicine", back_populates="generic")

class DrugClass(Base):
    __tablename__ = "hn_drug_classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    medicines = relationship("Medicine", back_populates="drug_class")

class DosageForm(Base):
    __tablename__ = "hn_dosage_forms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    medicines = relationship("Medicine", back_populates="dosage_form")

class Indication(Base):
    __tablename__ = "hn_indications"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    
    # Many-to-Many with Generics
    generics = relationship("Generic", secondary=generic_indication_association, back_populates="indications")

class Medicine(Base):
    __tablename__ = "hn_medicines"
    id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String(255), index=True, nullable=False)
    strength = Column(String(100), nullable=True)
    price = Column(String(50), nullable=True)
    
    # Foreign Keys
    manufacturer_id = Column(Integer, ForeignKey('hn_manufacturers.id', ondelete="SET NULL"), nullable=True)
    generic_id = Column(Integer, ForeignKey('hn_generics.id', ondelete="SET NULL"), nullable=True)
    drug_class_id = Column(Integer, ForeignKey('hn_drug_classes.id', ondelete="SET NULL"), nullable=True)
    dosage_form_id = Column(Integer, ForeignKey('hn_dosage_forms.id', ondelete="SET NULL"), nullable=True)
    
    # Relationships
    manufacturer = relationship("Manufacturer", back_populates="medicines")
    generic = relationship("Generic", back_populates="medicines")
    drug_class = relationship("DrugClass", back_populates="medicines")
    dosage_form = relationship("DosageForm", back_populates="medicines")
