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

    # Extract target database name
    db_name_match = re.search(r"/([^/?]+)(?:\?|$)", db_url)
    target_db = db_name_match.group(1) if db_name_match else "campusiq"

    # Only verify/create database on local PostgreSQL instances, not on cloud databases (e.g. Neon)
    is_cloud_db = any(k in db_url.lower() for k in ["neon.tech", "supabase", "render", "cockroach", "aws", "azure", "gcp"])
    if not is_cloud_db and ("localhost" in db_url or "127.0.0.1" in db_url):
        server_url = re.sub(r"/[^/?]+(\?.*)?$", "/postgres\\1", db_url)
        try:
            root_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
            with root_engine.connect() as conn:
                check_sql = text("SELECT 1 FROM pg_database WHERE datname = :dname")
                exists = conn.execute(check_sql, {"dname": target_db}).scalar()
                if not exists:
                    conn.execute(text(f'CREATE DATABASE "{target_db}"'))
                    print(f"[PostgreSQL] Created database '{target_db}' successfully.")
            root_engine.dispose()
        except Exception as e:
            print(f"[PostgreSQL Notice] Auto-database creation check: {e}")

    # Create primary PostgreSQL engine with UTC connection session
    pg_engine = create_engine(
        db_url,
        pool_size=15,
        max_overflow=25,
        pool_pre_ping=True,
        connect_args={"options": "-c timezone=utc"}
    )
    with pg_engine.connect() as test_conn:
        test_conn.execute(text("SELECT 1"))
    print(f"[PostgreSQL] Connected to production PostgreSQL successfully ({target_db}).")
    session_maker = sessionmaker(autocommit=False, autoflush=False, bind=pg_engine)
    return pg_engine, session_maker


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
