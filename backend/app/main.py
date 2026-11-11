"""FastAPI application entrypoint.

    uvicorn app.main:app --reload
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import dev, learn, me
from app.core.config import settings
from app.core.errors import DomainError
from app.seed.run import init_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_database(seed_if_empty=settings.seed_on_startup)
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(_request: Request, exc: DomainError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


app.include_router(me.router, prefix="/api")
app.include_router(learn.router, prefix="/api")
if settings.enable_dev_tools:
    app.include_router(dev.router, prefix="/api")


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
