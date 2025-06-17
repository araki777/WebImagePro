from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.connection import get_database_url

engine = create_engine(get_database_url())
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
