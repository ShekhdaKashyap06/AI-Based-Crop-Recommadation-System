from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import predict_routes


# ============================================================
# CREATE FASTAPI APP
# ============================================================

app = FastAPI(
    title="AI Crop Recommendation System",
    version="1.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


# ============================================================
# REGISTER ROUTES
# ============================================================

app.include_router(predict_routes.router)
