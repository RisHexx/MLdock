from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.prediction_log import PredictionLog
from app.schemas.log import LogEntry, LogListResponse

router = APIRouter(prefix="/logs", tags=["Logs"])


@router.get("", response_model=LogListResponse)
def get_logs(
    model_name: str | None = Query(None, description="Filter by model name"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get prediction logs with optional filtering and pagination."""
    query = db.query(PredictionLog)

    if model_name:
        query = query.filter(PredictionLog.model_name == model_name)

    total = query.count()
    logs = (
        query
        .order_by(PredictionLog.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return LogListResponse(
        logs=[
            LogEntry(
                id=str(log.id),
                model_name=log.model_name,
                status_code=log.status_code,
                latency_ms=log.latency_ms,
                created_at=log.created_at,
            )
            for log in logs
        ],
        total=total,
    )
