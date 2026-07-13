from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings


#Creates a creates a connection object.
#The engine is just prepared for future use.
engine = create_engine(settings.DATABASE_URL)

#it creates a factory that can produce sessions whenever needed.
# autocommit - false -> Changes are not automatically saved.
# You must write db.commit()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Creates the base class that all ORM models inherit from.
#without it SQLAlchemy would not recognize the class as a database table.
Base = declarative_base()


# It provides a database session to API endpoints.
def get_db():
    """Creates a new session."""
    db = SessionLocal()
    try:
        # Why yield instead of return? Because FastAPI treats this as a dependency.
        yield db
    finally:
        # After the API finishes, the database connection is closed.
        #finnay because even endpoint raises exception or not the close should always happen
        db.close()

#This function creates database tables when the application starts.
def init_db():
    """Create all tables on startup"""
    #When imported, SQLAlchemy registers the table, thats why.
    from app.models import user, api_key, ml_model, prediction_log
    #It does not recreate tables every time.
    Base.metadata.create_all(bind=engine)
