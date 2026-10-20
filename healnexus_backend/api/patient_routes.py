import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from core.database import get_db
from core.security import get_current_user, validate_file
from models.db_models import User, Appointment, MedicalRecord, Prescription
from schemas.api_schemas import AppointmentCreate, RespondNegotiation
from api.notification_routes import create_notification

router = APIRouter()

UPLOAD_DIR = "uploads/medical_records"
os.makedirs(UPLOAD_DIR, exist_ok=True)
from sqlalchemy.orm import Session, joinedload

# --- 1. GET DASHBOARD DATA ---
@router.get("/dashboard")
def get_patient_dashboard(
    skip: int = 0, 
    limit: int = 10,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Access denied. Patient role required.")

    # Optimized Appointment Fetch with Join
    appointments_query = db.query(Appointment, User.full_name).join(
        User, Appointment.doctor_id == User.id
    ).filter(Appointment.patient_id == current_user.id).order_by(Appointment.id.desc())

    appointments_raw = appointments_query.all()
    formatted_apts = []
    for apt, doc_name in appointments_raw:
        formatted_apts.append({
            "id": apt.id,
            "doctor_id": apt.doctor_id,
            "doctor_name": doc_name,
            "date_time": apt.date_time,
            "suggested_time": apt.suggested_time,
            "reason": apt.reason,
            "status": apt.status,
            "rejection_reason": apt.rejection_reason,
            "meet_link": apt.meet_link
        })

    # Fetch Medical Vault Records (Paginated)
    total_records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == current_user.id).count()
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == current_user.id).order_by(MedicalRecord.id.desc()).offset(skip).limit(limit).all()
    
    # Fetch Prescriptions (Paginated)
    total_prescriptions = db.query(Prescription).filter(Prescription.patient_id == current_user.id).count()
    prescriptions = db.query(Prescription).filter(Prescription.patient_id == current_user.id).order_by(Prescription.created_at.desc()).offset(skip).limit(limit).all()
    formatted_rx = []
    for rx in prescriptions:
        doc = db.query(User).filter(User.id == rx.doctor_id).first()
        formatted_rx.append({
            "id": rx.id,
            "doctor_name": doc.full_name if doc else "Unknown Doctor",
            "date": rx.created_at,
            "notes": rx.notes,
            "medicines": json.loads(rx.medicines_json) if rx.medicines_json else []
        })

    # Fetch available Doctors for the Booking Dropdown
    doctors = db.query(User).filter(User.role == "doctor", User.is_approved == True).all()
    available_doctors = [{"id": d.id, "name": d.full_name, "specialty": d.specialization} for d in doctors]
    
    return {
        "patient_name": current_user.full_name,
        "email": current_user.email,
        "appointments": formatted_apts,
        "medical_records": records,
        "total_records": total_records,
        "prescriptions": formatted_rx,
        "total_prescriptions": total_prescriptions,
        "available_doctors": available_doctors
    }

@router.post("/appointments", status_code=status.HTTP_201_CREATED)
def book_appointment(
    doctor_id: int = Form(...),
    reason: str = Form(...),
    file: Optional[UploadFile] = File(None), # Optional new file attachment
    existing_record_id: Optional[int] = Form(None), # New: Refer from Vault
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments.")

    doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    file_path_for_db = None

    # Scenario A: User uploaded a NEW file
    if file:
        # Validate file
        validate_file(file.filename, file.size if hasattr(file, 'size') else 0)
        
        safe_filename = f"apt_{current_user.id}_{file.filename}"
        physical_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        with open(physical_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_path_for_db = f"{UPLOAD_DIR}/{safe_filename}" 

        # Synchronize with Medical Vault
        new_vault_record = MedicalRecord(
            patient_id=current_user.id,
            record_type="Appointment Attachment",
            description=f"Document shared for visit with Dr. {doctor.full_name} regarding: {reason}",
            file_path=file_path_for_db 
        )
        db.add(new_vault_record)

    # Scenario B: User referred an EXISTING record from their vault
    elif existing_record_id:
        record = db.query(MedicalRecord).filter(
            MedicalRecord.id == existing_record_id, 
            MedicalRecord.patient_id == current_user.id
        ).first()
        if not record:
            raise HTTPException(status_code=404, detail="Selected vault record not found.")
        file_path_for_db = record.file_path

    # Create the appointment
    new_appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=doctor_id,
        date_time=None, 
        reason=reason,
        status="Pending",
        document_path=file_path_for_db 
    )
    
    db.add(new_appointment)
    db.commit()

    # Trigger Notification for Doctor
    create_notification(
        db, 
        user_id=doctor_id, 
        title="New Appointment Request", 
        message=f"Patient {current_user.full_name} has requested an appointment regarding: {reason}",
        link="home"
    )

    return {"message": "Appointment request sent! Wait for doctor to set the time."}


# --- 3. UPLOAD MEDICAL RECORD DIRECTLY ---
@router.post("/records", status_code=status.HTTP_201_CREATED)
def upload_medical_record(
    record_type: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can upload records.")

    # Validate file
    validate_file(file.filename, file.size if hasattr(file, 'size') else 0)

    # 1. Generate a safe file name
    safe_filename = f"patient_{current_user.id}_{file.filename}"
    
    # 2. Force a Web-Safe Forward Slash (/) instead of os.path.join
    file_path = f"{UPLOAD_DIR}/{safe_filename}"
    
    # 3. Create the physical path for Windows to save the file
    physical_path = os.path.join(UPLOAD_DIR, safe_filename)

    # 4. Save the physical file to the server folder
    with open(physical_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 5. Save the WEB-SAFE path to the database
    new_record = MedicalRecord(
        patient_id=current_user.id,
        record_type=record_type,
        description=description,
        file_path=file_path 
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {"message": "Record uploaded successfully!", "record_id": new_record.id}

# --- 4. DELETE MEDICAL RECORD ---
@router.delete("/records/{record_id}", status_code=status.HTTP_200_OK)
def delete_medical_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can delete records.")

    # 1. Find the record
    record = db.query(MedicalRecord).filter(
        MedicalRecord.id == record_id,
        MedicalRecord.patient_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found.")

    # 2. Try to remove the file from the filesystem
    try:
        # Extract filename from the web path to find physical path
        if record.file_path:
            filename = record.file_path.split('/')[-1]
            physical_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.exists(physical_path):
                os.remove(physical_path)
    except Exception as e:
        print(f"Error deleting file {record.file_path}: {e}")
        # Even if file deletion fails, we still want to remove the DB record

    # 3. Delete from database
    db.delete(record)
    db.commit()

    return {"message": "Medical record deleted successfully!"}

# --- 5. RESPOND TO TIME NEGOTIATION ---
@router.put("/appointments/{apt_id}/respond-negotiation")
def respond_to_negotiation(apt_id: int, data: RespondNegotiation, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can respond to negotiations.")

    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.patient_id == current_user.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if apt.status != "Negotiating":
        raise HTTPException(status_code=400, detail="This appointment is not in negotiation.")

    if data.accept:
        apt.date_time = apt.suggested_time
        apt.suggested_time = None
        apt.status = "Scheduled"
        db.commit()

        create_notification(db, user_id=apt.doctor_id, title="Negotiation Accepted", message=f"Patient {current_user.full_name} accepted your suggested time.", link="schedule")
        return {"message": "Appointment confirmed for the suggested time!"}
    else:
        apt.status = "Rejected"
        apt.rejection_reason = "Patient declined the alternative suggested time."
        db.commit()

        create_notification(db, user_id=apt.doctor_id, title="Negotiation Declined", message=f"Patient {current_user.full_name} declined your suggested time.", link="home")
        return {"message": "Alternative time declined."}
