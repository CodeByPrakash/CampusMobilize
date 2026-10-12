import os
import uvicorn

if __name__ == "__main__":
    # Render and cloud platforms supply PORT dynamically
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[CampusIQ] Starting backend and binding to {host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port)
