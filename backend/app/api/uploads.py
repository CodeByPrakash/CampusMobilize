"""
Uploads & S3 Object Storage Endpoints (3.4, Evidence & Resolution Proofs)
Integrates directly with Neon S3-compatible bucket ('evidences').
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Header
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Complaint, ComplaintMedia, User
from ..services.s3_service import s3_service

router = APIRouter(prefix="/uploads", tags=["Uploads & S3 Storage"])


@router.post("", status_code=201)
async def upload_file_to_s3(
    file: UploadFile = File(...),
    folder: str = Query("complaints", description="Target folder in bucket: complaints|proofs|audits")
) -> Dict[str, Any]:
    """
    Direct multipart/form-data upload to S3 bucket 'evidences'.
    Returns the permanent public URL and object metadata.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Max 25MB limit
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 25MB limit")

    success, result_url = s3_service.upload_file(
        file_bytes=content,
        filename=file.filename,
        folder=folder,
        content_type=file.content_type
    )

    if not success:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {result_url}")

    return {
        "success": True,
        "url": result_url,
        "filename": file.filename,
        "folder": folder,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "bucket": s3_service.bucket
    }


@router.post("/complaint/{id_or_ticket}", status_code=201)
async def upload_complaint_photo(
    id_or_ticket: str,
    file: UploadFile = File(...),
    kind: str = Query("resolution", description="initial|resolution|spot_check"),
    x_actor_id: Optional[str] = Header(None, alias="X-Actor-Id"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Uploads an image evidence directly for a specific complaint ticket,
    persisting the URL to Complaint.resolution_photo_url and ComplaintMedia.
    """
    complaint = db.query(Complaint).filter(
        (Complaint.id == id_or_ticket) | (Complaint.ticket_no == id_or_ticket)
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    folder = "proofs" if kind == "resolution" else "complaints"
    success, result_url = s3_service.upload_file(
        file_bytes=content,
        filename=file.filename,
        folder=folder,
        content_type=file.content_type
    )

    if not success:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {result_url}")

    # If it's a resolution proof, save to complaint.resolution_photo_url
    if kind == "resolution":
        complaint.resolution_photo_url = result_url

    # Save to media gallery table
    media = ComplaintMedia(
        complaint_id=complaint.id,
        file_url=result_url,
        file_kind=kind,
        uploaded_by=x_actor_id
    )
    db.add(media)
    db.commit()
    db.refresh(complaint)

    return {
        "success": True,
        "ticket_no": complaint.ticket_no,
        "kind": kind,
        "url": result_url,
        "media_id": media.id
    }
