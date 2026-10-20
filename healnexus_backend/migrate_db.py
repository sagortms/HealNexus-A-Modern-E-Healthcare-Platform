from core.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        # Add new columns to hn_users
        try:
            conn.execute(text("ALTER TABLE hn_users ADD COLUMN bio TEXT DEFAULT NULL;"))
            print("Added 'bio' to hn_users")
        except Exception as e:
            print("Skipped 'bio':", e)
            
        try:
            conn.execute(text("ALTER TABLE hn_users ADD COLUMN availability TEXT DEFAULT NULL;"))
            print("Added 'availability' to hn_users")
        except Exception as e:
            print("Skipped 'availability':", e)
            
        try:
            conn.execute(text("ALTER TABLE hn_users ADD COLUMN application_document_path VARCHAR(255) DEFAULT NULL;"))
            print("Added 'application_document_path' to hn_users")
        except Exception as e:
            print("Skipped 'application_document_path':", e)

        try:
            conn.execute(text("ALTER TABLE hn_users ADD COLUMN secondary_mobile VARCHAR(20) DEFAULT NULL;"))
            print("Added 'secondary_mobile' to hn_users")
        except Exception as e:
            print("Skipped 'secondary_mobile':", e)

        try:
            conn.execute(text("ALTER TABLE hn_users ADD COLUMN theme_preference VARCHAR(20) DEFAULT 'light';"))
            print("Added 'theme_preference' to hn_users")
        except Exception as e:
            print("Skipped 'theme_preference':", e)

        # Add new columns to hn_appointments
        try:
            conn.execute(text("ALTER TABLE hn_appointments ADD COLUMN visit_notes TEXT DEFAULT NULL;"))
            print("Added 'visit_notes' to hn_appointments")
        except Exception as e:
            print("Skipped 'visit_notes':", e)

        try:
            conn.execute(text("ALTER TABLE hn_appointments ADD COLUMN suggested_time DATETIME DEFAULT NULL;"))
            print("Added 'suggested_time' to hn_appointments")
        except Exception as e:
            print("Skipped 'suggested_time':", e)

        try:
            conn.execute(text("ALTER TABLE hn_appointments ADD COLUMN rejection_reason VARCHAR(255) DEFAULT NULL;"))
            print("Added 'rejection_reason' to hn_appointments")
        except Exception as e:
            print("Skipped 'rejection_reason':", e)

        # Add new columns to hn_prescriptions
        try:
            conn.execute(text("ALTER TABLE hn_prescriptions ADD COLUMN appointment_id INTEGER DEFAULT NULL;"))
            print("Added 'appointment_id' to hn_prescriptions")
        except Exception as e:
            print("Skipped 'appointment_id':", e)
            
        conn.commit()

if __name__ == "__main__":
    run_migration()
