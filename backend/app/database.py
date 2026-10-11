"""
SQLAlchemy Database Connection & Session Management (§6)
Primary: PostgreSQL (localhost:5432 or DATABASE_URL).
Automatic Database Creation: creates 'campusiq' database if not existing.
Fallback: SQLite for self-contained testing if PostgreSQL is unavailable.
"""

import re
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

Base = declarative_base()


def get_engine_and_session():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")

    if not is_sqlite:
        # Standardize postgresql protocol for psycopg2
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        elif db_url.startswith("postgresql+psycopg://"):
            db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)

        # Try connecting and creating database if missing
        try:
            # Extract database name
            db_name_match = re.search(r"/([^/?]+)(?:\?|$)", db_url)
            target_db = db_name_match.group(1) if db_name_match else "campusiq"

            # Connect to default 'postgres' database to verify/create target database
            server_url = re.sub(r"/[^/?]+(\?.*)?$", "/postgres\\1", db_url)
            root_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
            with root_engine.connect() as conn:
                check_sql = text("SELECT 1 FROM pg_database WHERE datname = :dname")
                exists = conn.execute(check_sql, {"dname": target_db}).scalar()
                if not exists:
                    conn.execute(text(f'CREATE DATABASE "{target_db}"'))
                    print(f"[PostgreSQL] Created database '{target_db}' successfully.")
            root_engine.dispose()

            pg_engine = create_engine(
                db_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True
            )
            # Test connection
            with pg_engine.connect() as test_conn:
                test_conn.execute(text("SELECT 1"))
            print(f"[PostgreSQL] Connected to PostgreSQL successfully ({target_db}).")
            session_maker = sessionmaker(autocommit=False, autoflush=False, bind=pg_engine)
            return pg_engine, session_maker

        except Exception as e:
            print(f"[PostgreSQL Notice] PostgreSQL connection failed: {e}")
            print("[Database Fallback] Falling back to local SQLite for offline resilience.")
            sqlite_engine = create_engine(
                "sqlite:///./campusiq.db",
                connect_args={"check_same_thread": False}
            )
            session_maker = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)
            return sqlite_engine, session_maker

    sqlite_engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
    session_maker = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)
    return sqlite_engine, session_maker


engine, SessionLocal = get_engine_and_session()


def get_db():
    """Dependency that yields a request-scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates all database tables defined on Base."""
    from . import models
    Base.metadata.create_all(bind=engine)
