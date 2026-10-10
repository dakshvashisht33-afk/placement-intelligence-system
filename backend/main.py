from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.placement import router as placement_router


app = FastAPI(
    title="University Placement Intelligence API",
    description="AI-powered university placement intelligence system",
    version="1.0.0"
)


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://placement-intelligence-system-ylff813sv-dot-a353.vercel.app"
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(placement_router)


@app.get("/")
def root():
    return {
        "message": "Placement Intelligence Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }