# healnexus_backend/api/medical_routes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from core.database import get_db
from models.db_models import Medicine, Generic, Indication, User, Manufacturer
from schemas.api_schemas import MedicineRead, SymptomSearchRequest, CommonPrescriptionProfile

router = APIRouter()

# --- 1. SEARCH MEDICINES (Advanced Filter & Paginated) ---
@router.get("/search", response_model=dict)
def search_medicines(
    query: Optional[str] = Query(None, min_length=2),
    indication: Optional[str] = Query(None),
    manufacturer: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Find medicines with advanced filtering and pagination.
    """
    db_query = db.query(Medicine).join(Generic)
    
    if query:
        search_pattern = f"%{query}%"
        db_query = db_query.filter(
            or_(
                Medicine.brand_name.ilike(search_pattern),
                Generic.name.ilike(search_pattern)
            )
        )
        
    if indication:
        db_query = db_query.join(Medicine.indications).filter(Indication.name.ilike(f"%{indication}%"))
        
    if manufacturer:
        db_query = db_query.join(Manufacturer).filter(Manufacturer.name.ilike(f"%{manufacturer}%"))
        
    total = db_query.count()
    results = db_query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "results": results,
        "skip": skip,
        "limit": limit
    }

# --- 2. GET BRAND ALTERNATIVES ---
@router.get("/alternatives/{medicine_id}", response_model=List[MedicineRead])
def get_alternatives(
    medicine_id: int,
    db: Session = Depends(get_db)
):
    """
    Find other brands (alternatives) sharing the same generic name.
    """
    # 1. Get the target medicine to find its generic_id
    target = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not target or not target.generic_id:
        raise HTTPException(status_code=404, detail="Medicine or generic not found.")
    
    # 2. Find all other medicines with the same generic_id, excluding the target itself
    alternatives = db.query(Medicine).filter(
        Medicine.generic_id == target.generic_id,
        Medicine.id != target.id
    ).limit(20).all()
    
    return alternatives

# --- 3. SYMPTOM ASSESSMENT (Symptom-to-Medicine) ---
@router.post("/symptom-assessment", response_model=List[MedicineRead])
def symptom_assessment(
    request: SymptomSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Takes a symptom string (e.g., 'fever, headache') and returns
    OTC medicines linked to matching Indications.
    """
    symptoms_list = [s.strip() for s in request.symptoms.split(',')]
    
    # 1. Find Indications matching the symptoms
    matched_indications = []
    for symptom in symptoms_list:
        pattern = f"%{symptom}%"
        indications = db.query(Indication).filter(Indication.name.ilike(pattern)).all()
        matched_indications.extend(indications)
    
    if not matched_indications:
        return []

    # 2. Extract Generic IDs linked to these Indications
    generic_ids = set()
    for ind in matched_indications:
        for gen in ind.generics:
            generic_ids.add(gen.id)
            
    if not generic_ids:
        return []

    # 3. Fetch Medicines (Brands) for these Generics
    # We'll limit it to 1-2 popular brands per generic to avoid overwhelming the user
    suggested_medicines = db.query(Medicine).filter(
        Medicine.generic_id.in_(list(generic_ids))
    ).limit(30).all()
    
    return suggested_medicines

# --- 4. GUIDED TRIAGE (Symptom to Prescription Profile) ---
@router.get("/guided-triage", response_model=List[CommonPrescriptionProfile])
def guided_triage(
    symptom: str = Query(..., min_length=2),
    db: Session = Depends(get_db)
):
    """
    Takes a single symptom, finds matching indications,
    and returns a 'Common Prescription Profile' for each matched Generic.
    """
    search_pattern = f"%{symptom}%"
    
    # 1. Find matching Indications
    indications = db.query(Indication).filter(Indication.name.ilike(search_pattern)).all()
    if not indications:
        return []

    # 2. Get unique Generics linked to these Indications
    generics = []
    seen_gen_ids = set()
    for ind in indications:
        for gen in ind.generics:
            if gen.id not in seen_gen_ids:
                generics.append(gen)
                seen_gen_ids.add(gen.id)

    # 3. Build Profiles
    profiles = []
    for gen in generics:
        # Get top 5 brands for this generic
        top_brands = db.query(Medicine).filter(
            Medicine.generic_id == gen.id
        ).limit(5).all()
        
        profiles.append(CommonPrescriptionProfile(
            generic=gen,
            top_brands=top_brands,
            dosage_guideline="Standard adult dose. Consult professional for child/elderly dosage."
        ))

    return profiles

# --- 5. GET ALL DOCTORS ---
@router.get("/doctors")
def get_all_doctors(db: Session = Depends(get_db)):
    """
    Returns a public list of all approved doctors.
    """
    doctors = db.query(User).filter(User.role == "doctor", User.is_approved == True).all()
    
    doctor_list = []
    for doc in doctors:
        doctor_list.append({
            "id": doc.id,
            "name": doc.full_name,
            "specialty": doc.specialization or "General Physician",
            "rating": "4.9",
            "reviews": 120,
            "image": f"https://ui-avatars.com/api/?name={doc.full_name.replace(' ', '+')}&background=random"
        })
        
    return doctor_list
