"""
S3 Object Storage Service for CampusIQ (3.4, Evidence & Resolution Proofs)
Uploads complaint photos, resolution evidence, and receipts to Neon S3-compatible storage.
"""

import os
import uuid
import mimetypes
from typing import Optional, Tuple
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from ..config import settings


class S3StorageService:
    def __init__(self):
        self.endpoint_url = settings.AWS_ENDPOINT_URL_S3
        self.access_key = settings.AWS_ACCESS_KEY_ID
        self.secret_key = settings.AWS_SECRET_ACCESS_KEY
        self.region = settings.AWS_REGION
        self.bucket = settings.S3_BUCKET

        self._client = None
        if self.endpoint_url and self.access_key and self.secret_key:
            try:
                self._client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    region_name=self.region,
                    config=Config(signature_version="s3v4")
                )
            except Exception as e:
                print(f"[S3 Notice] Client initialization error: {e}")

    @property
    def is_configured(self) -> bool:
        return bool(self._client and self.bucket)

    def upload_file(
        self,
        file_bytes: bytes,
        filename: str,
        folder: str = "complaints",
        content_type: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Uploads binary file content to S3 and returns (success: bool, url_or_error: str).
        """
        if not self.is_configured:
            return False, "S3 storage service is not configured"

        # Sanitize and unique filename
        ext = os.path.splitext(filename)[1].lower()
        if not content_type:
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

        unique_id = uuid.uuid4().hex[:12]
        clean_name = "".join(c for c in os.path.splitext(filename)[0] if c.isalnum() or c in ("-", "_"))[:30]
        s3_key = f"{folder}/{clean_name}_{unique_id}{ext}"

        try:
            self._client.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type,
            )
            # Generate presigned URL (7 days) for secure object viewing
            try:
                public_url = self._client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.bucket, "Key": s3_key},
                    ExpiresIn=604800
                )
            except Exception:
                public_url = f"{self.endpoint_url.rstrip('/')}/{self.bucket}/{s3_key}"
            return True, public_url
        except ClientError as ce:
            print(f"[S3 Error] ClientError during upload: {ce}")
            return False, str(ce)
        except Exception as e:
            print(f"[S3 Error] Unexpected upload failure: {e}")
            return False, str(e)


# Shared singleton instance
s3_service = S3StorageService()
