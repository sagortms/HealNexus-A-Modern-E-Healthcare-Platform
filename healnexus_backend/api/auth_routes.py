import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_password_hash, verify_password, create_access_token, validate_file, get_current_user
from models.db_models import User
from schemas.api_schemas import UserCreate, UserLogin, Token, UserRead, ForgotPassword, ResetPassword
from datetime import timedelta
from jose import jwt, JWTError
from core.security import SECRET_KEY, ALGORITHM

router = APIRouter()

UPLOAD_DIR = "uploads/doctor_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"message": "If this email is registered, a reset link will be sent."}
    
    reset_token = create_access_token(data={"sub": user.email, "type": "reset"}, expires_delta=timedelta(minutes=15))
    return {
        "message": "Reset token generated (simulated email).",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password has been successfully reset."}

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    phone: str = Form(None),
    age: int = Form(None),
    gender: str = Form(None),
    specialization: str = Form(None),
    license_no: str = Form(None),
    secondary_mobile: str = Form(None),
    application_doc: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    doc_path = None
    user_role = role.lower()
    
    if user_role == "doctor":
        if not application_doc:
            raise HTTPException(status_code=400, detail="Qualification PDF is mandatory for doctors.")
        validate_file(application_doc.filename, application_doc.size if hasattr(application_doc, 'size') else 0)
        file_ext = os.path.splitext(application_doc.filename)[1]
        safe_filename = f"doc_{email.replace('@','_')}{file_ext}"
        physical_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(physical_path, "wb") as buffer:
            shutil.copyfileobj(application_doc.file, buffer)
        doc_path = f"{UPLOAD_DIR}/{safe_filename}"

    hashed_pwd = get_password_hash(password)
    auto_approve = True if user_role == "patient" else False

    new_user = User(
        full_name=full_name,
        email=email,
        hashed_password=hashed_pwd,
        role=user_role,
        phone=phone,
        age=age,
        gender=gender,
        specialization=specialization,
        license_no=license_no,
        secondary_mobile=secondary_mobile,
        application_document_path=doc_path,
        is_approved=auto_approve
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "id": new_user.id,
        "full_name": new_user.full_name,
        "message": "Registration successful. Please log in." if auto_approve else "Registration successful. Pending admin approval."
    }

@router.post("/login", response_model=Token)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.", headers={"WWW-Authenticate": "Bearer"})

    if user.role in ["doctor", "admin"] and not user.is_approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending admin approval.")

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "theme": user.theme_preference}

@router.put("/theme")
def save_theme_preference(theme: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if theme not in ["light", "dark"]:
        raise HTTPException(status_code=400, detail="Invalid theme.")
    current_user.theme_preference = theme
    db.commit()
    return {"message": "Theme preference saved."}
