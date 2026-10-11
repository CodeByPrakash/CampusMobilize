import { NextResponse } from "next/server";

const BACKEND_UPLOAD_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/uploads`
  : "http://localhost:8000/api/v1/uploads";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const folder = url.searchParams.get("folder") || "bills";

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "A valid file is required" },
        { status: 400 }
      );
    }

    // Forward multipart to FastAPI backend S3 service
    const targetUrl = `${BACKEND_UPLOAD_URL}?folder=${encodeURIComponent(folder)}`;
    const backendFormData = new FormData();
    backendFormData.append("file", file, (file as File).name || "invoice_document.pdf");

    const response = await fetch(targetUrl, {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upstream S3 upload returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Next.js /api/uploads error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to upload file to S3 storage",
      },
      { status: 500 }
    );
  }
}
