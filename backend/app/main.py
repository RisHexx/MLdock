import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import auth, api_keys, models, predict, dashboard, logs, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and storage directory
    init_db()
    #exist of true means if folder already there do nothing
    os.makedirs(settings.STORAGE_PATH, exist_ok=True)
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Self-hosted AI Model Serving Platform",
    # this call the lifespan function which manages what to do when app starts and close
    # means When starting or stopping, run the lifespan() function.
    lifespan=lifespan,
)


#middleware -> Every request passes through it.

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
#feature of FastAPI -  include_router() is used to split your API into multiple modules instead of putting every endpoint in a single file.
app.include_router(auth.router)
app.include_router(api_keys.router)
app.include_router(models.router)
app.include_router(predict.router)
app.include_router(dashboard.router)
app.include_router(logs.router)
app.include_router(health.router)
