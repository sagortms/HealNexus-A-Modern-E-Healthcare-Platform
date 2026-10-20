from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- LOCAL XAMPP SETTINGS ---
# root is the default XAMPP user, no password, looking at the 'healnexus' database
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/healnexus_db"

# Create engine (No SSL arguments needed for local)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()