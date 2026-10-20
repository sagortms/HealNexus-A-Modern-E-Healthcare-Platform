import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from core.database import get_db
from core.security import get_current_user
from models.db_models import User, Appointment, MedicalRecord, Prescription
from schemas.api_schemas import PrescriptionCreate, ConfirmAppointment, DoctorProfileUpdate, AvailabilityUpdate, RejectAppointment, NegotiateAppointment, VisitNotesUpdate
from sqlalchemy import and_
from api.notification_routes import create_notification
from core.sanitizer import sanitize_html

router = APIRouter()

@router.get("/dashboard")
def get_doctor_dashboard(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access denied. Doctor role required.")

    # --- STATISTICS ---
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)
    day_after_tomorrow = tomorrow_start + timedelta(days=1)

    attended_count = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.status == "Scheduled",
        Appointment.date_time < now
    ).count()

    waiting_today = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.status == "Scheduled",
        Appointment.date_time >= today_start,
        Appointment.date_time < tomorrow_start
    ).count()

    waiting_tomorrow = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.status == "Scheduled",
        Appointment.date_time >= tomorrow_start,
        Appointment.date_time < day_after_tomorrow
    ).count()

    # Optimized Appointment Fetch with Join (Fixes N+1)
    appointments_query = db.query(Appointment, User.full_name).join(
        User, Appointment.patient_id == User.id
    ).filter(Appointment.doctor_id == current_user.id).order_by(Appointment.status.desc(), Appointment.id.desc())
    
    total_apts = appointments_query.count()
    appointments_raw = appointments_query.offset(skip).limit(limit).all()
    
    formatted_apts = []
    for apt, pat_name in appointments_raw:
        formatted_apts.append({
            "id": apt.id,
            "patient_id": apt.patient_id,
            "patient_name": pat_name,
            "time": apt.date_time.strftime("%I:%M %p") if apt.date_time else "N/A",
            "date": apt.date_time.strftime("%Y-%m-%d") if apt.date_time else "N/A",
            "suggested_time": apt.suggested_time,
            "reason": apt.reason,
            "status": apt.status,
            "rejection_reason": apt.rejection_reason,
            "document_path": apt.document_path,
            "meet_link": apt.meet_link
        })

    # --- PATIENT DATABASE (Previously Attended - Paginated) ---
    attended_query = db.query(Appointment.patient_id).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.status == "Scheduled"
    ).distinct()
    
    total_patients = attended_query.count()
    attended_patient_ids_raw = attended_query.offset(skip).limit(limit).all()
    attended_patient_ids = [p[0] for p in attended_patient_ids_raw]

    formatted_patients = []
    for p_id in attended_patient_ids:
        pat = db.query(User).filter(User.id == p_id).first()
        if pat:
            last_visit = db.query(Appointment).filter(
                Appointment.doctor_id == current_user.id,
                Appointment.patient_id == p_id,
                Appointment.status == "Scheduled"
            ).order_by(Appointment.date_time.desc()).first()
            
            formatted_patients.append({
                "id": pat.id,
                "name": pat.full_name,
                "age": pat.age or "N/A",
                "gender": pat.gender or "N/A",
                "last_visit": last_visit.date_time.strftime("%Y-%m-%d") if last_visit else "N/A"
            })

    return {
        "doctor_name": current_user.full_name,
        "specialty": current_user.specialization,
        "bio": current_user.bio,
        "availability": json.loads(current_user.availability) if current_user.availability else None,
        "phone": current_user.phone,
        "license_no": current_user.license_no,
        "stats": {
            "attended": attended_count,
            "waiting_today": waiting_today,
            "waiting_tomorrow": waiting_tomorrow
        },
        "appointments": formatted_apts,
        "total_appointments": total_apts,
        "patients": formatted_patients,
        "total_patients": total_patients,
        "reviews": [ 
            {"id": 1, "patient": "Rahim Uddin", "rating": 5, "comment": "Excellent care and very professional."},
            {"id": 2, "patient": "Karim Mia", "rating": 4, "comment": "Wait time was a bit long but the consultation was great."}
        ]
    }

@router.put("/profile")
def update_profile(data: DoctorProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update their profile.")
    
    if data.specialization: current_user.specialization = sanitize_html(data.specialization)
    if data.bio: current_user.bio = sanitize_html(data.bio)
    if data.phone: current_user.phone = sanitize_html(data.phone)
    
    db.commit()
    return {"message": "Profile updated successfully."}

@router.put("/availability")
def update_availability(data: AvailabilityUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can set availability.")
    
    current_user.availability = data.availability # Should be a JSON string from frontend
    db.commit()
    return {"message": "Availability schedule updated."}

@router.put("/appointments/{apt_id}/confirm")
def confirm_appointment(apt_id: int, data: ConfirmAppointment, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can confirm appointments.")

    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.doctor_id == current_user.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    apt.date_time = data.date_time
    apt.suggested_time = None
    apt.status = "Scheduled"
    if data.meet_link:
        apt.meet_link = data.meet_link
    db.commit()

    create_notification(db, user_id=apt.patient_id, title="Appointment Confirmed", message=f"Dr. {current_user.full_name} has confirmed your visit for {apt.date_time.strftime('%Y-%m-%d %I:%M %p')}.", link="overview")
    return {"message": "Appointment confirmed."}

@router.put("/appointments/{apt_id}/reject")
def reject_appointment(apt_id: int, data: RejectAppointment, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can reject appointments.")

    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.doctor_id == current_user.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    apt.status = "Rejected"
    apt.rejection_reason = sanitize_html(data.rejection_reason)
    db.commit()

    create_notification(db, user_id=apt.patient_id, title="Appointment Declined", message=f"Dr. {current_user.full_name} declined your request. Reason: {apt.rejection_reason}", link="overview")
    return {"message": "Appointment rejected."}

@router.put("/appointments/{apt_id}/negotiate")
def negotiate_appointment(apt_id: int, data: NegotiateAppointment, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can negotiate times.")

    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.doctor_id == current_user.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    apt.status = "Negotiating"
    apt.suggested_time = data.suggested_time
    db.commit()

    create_notification(db, user_id=apt.patient_id, title="Alternative Time Suggested", message=f"Dr. {current_user.full_name} suggested a different time for your visit.", link="overview")
    return {"message": "Alternative time suggested to patient."}

@router.post("/prescriptions", status_code=status.HTTP_201_CREATED)
def write_prescription(prescription_data: PrescriptionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can write prescriptions.")

    # Convert the list of medicine dictionaries into a JSON string for storage
    medicines_json_str = json.dumps([med.dict() for med in prescription_data.medicines])

    new_prescription = Prescription(
        patient_id=prescription_data.patient_id,
        doctor_id=current_user.id,
        appointment_id=prescription_data.appointment_id,
        medicines_json=medicines_json_str,
        notes=prescription_data.notes
    )

    db.add(new_prescription)
    db.commit()

    create_notification(db, user_id=prescription_data.patient_id, title="New e-Prescription", message=f"Dr. {current_user.full_name} has sent a new digital prescription to your vault.", link="prescriptions")
    return {"message": "Prescription securely sent to patient's vault."}

# --- 5. VIEW PATIENT CLINICAL HISTORY ---
@router.get("/patients/{patient_id}/history")
def get_patient_history(patient_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access denied.")
    
    # Check if doctor has ever had a scheduled appointment with this patient
    has_attended = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id,
        Appointment.patient_id == patient_id,
        Appointment.status == "Scheduled"
    ).first()
    
    if not has_attended:
        raise HTTPException(status_code=403, detail="You can only view history of patients you have attended.")
    
    # Fetch Prescriptions
    prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient_id).order_by(Prescription.created_at.desc()).all()
    formatted_rx = []
    for rx in prescriptions:
        doc = db.query(User).filter(User.id == rx.doctor_id).first()
        formatted_rx.append({
            "id": rx.id,
            "doctor_name": doc.full_name if doc else "Unknown",
            "date": rx.created_at,
            "notes": rx.notes,
            "medicines": json.loads(rx.medicines_json) if rx.medicines_json else []
        })

    # Fetch Medical Records
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).order_by(MedicalRecord.uploaded_at.desc()).all()
    
    return {
        "prescriptions": formatted_rx,
        "medical_records": records
    }

# --- 6. VISIT CONTROL ENGINE ---
@router.put("/appointments/{apt_id}/start")
def start_visit(apt_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access denied.")
    
    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.doctor_id == current_user.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    
    apt.status = "Ongoing"
    db.commit()

    create_notification(db, user_id=apt.patient_id, title="Consultation Started", message=f"Dr. {current_user.full_name} has started your live consultation session.", link="overview")
    return {"message": "Visit started. Status is now Ongoing."}

@router.put("/appointments/{apt_id}/end")
def end_visit(apt_id: int, data: VisitNotesUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Access denied.")
    
    apt = db.query(Appointment).filter(Appointment.id == apt_id, Appointment.doctor_id == current_user.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    
    apt.status = "Completed"
    apt.visit_notes = sanitize_html(data.visit_notes)
    db.commit()

    create_notification(db, user_id=apt.patient_id, title="Consultation Completed", message=f"Your visit with Dr. {current_user.full_name} has concluded. Check your vault for notes or e-Rx.", link="overview")
    return {"message": "Visit completed and notes saved."}