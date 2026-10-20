import sys
sys.path.insert(0, '.')
from sqlalchemy.orm import Session
from core.database import SessionLocal
from core.security import get_password_hash
from models.db_models import User

db: Session = SessionLocal()

doctors = [
    {
        "full_name": "Dr. Hasan Mahmud",
        "email": "hasan.mahmud@example.com",
        "password": "password123",
        "role": "doctor",
        "specialization": "Cardiologist",
        "license_no": "BD-CARD-1001",
        "is_approved": True
    },
    {
        "full_name": "Dr. Nusrat Jahan",
        "email": "nusrat.jahan@example.com",
        "password": "password123",
        "role": "doctor",
        "specialization": "Gynecologist",
        "license_no": "BD-GYN-2002",
        "is_approved": True
    },
    {
        "full_name": "Dr. Farhana Amin",
        "email": "farhana.amin@example.com",
        "password": "password123",
        "role": "doctor",
        "specialization": "Neurologist",
        "license_no": "BD-NEU-3003",
        "is_approved": True
    },
    {
        "full_name": "Dr. Salma Begum",
        "email": "salma.begum@example.com",
        "password": "password123",
        "role": "doctor",
        "specialization": "Pediatrician",
        "license_no": "BD-PED-4004",
        "is_approved": True
    }
]

# Ensure at least one patient
patient = {
    "full_name": "Patient User",
    "email": "patient@example.com",
    "password": "password123",
    "role": "patient",
    "age": 30,
    "gender": "Male"
}

users_to_add = doctors + [patient]

try:
    for user_data in users_to_add:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing_user:
            password = user_data.pop("password")
            user_data["hashed_password"] = get_password_hash(password)
            new_user = User(**user_data)
            db.add(new_user)
            print(f"Created user: {new_user.full_name}")
        else:
            print(f"User {existing_user.full_name} already exists.")
    db.commit()
    print("Database seeded with test users successfully.")
except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
finally:
    db.close()
