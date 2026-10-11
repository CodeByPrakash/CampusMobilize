from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from .config import settings
from .database import init_db, SessionLocal
from .seed import seed_database
from .models import Hostel
from .api import meta, ai, complaints, sla, utilities, events, performance, reports, uploads



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes tables and seeds canonical personas and hostels if empty."""
    try:
        init_db()
    except Exception as e:
        print(f"[Database Notice] Schema initialization notice: {e}")

    try:
        with SessionLocal() as session:
            hostel_count = session.query(Hostel).count()
            if hostel_count == 0:
                seed_database(session)
    except Exception as e:
        print(f"[Database Notice] Seed verification notice: {e}")
    yield


app = FastAPI(
    title="CampusIQ — Campus Edition (NIT Rourkela)",
    description="Autonomous Facility-Intelligence and Complaint-Operations Platform for NIT Rourkela",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", tags=["System"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "HEALTHY",
        "service": "campusiq-backend",
        "campus": "NIT Rourkela",
        "env": settings.APP_ENV,
        "offline_mode": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Include Routers
app.include_router(meta.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(complaints.router, prefix="/api/v1")
app.include_router(sla.router, prefix="/api/v1")
app.include_router(utilities.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(performance.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")




