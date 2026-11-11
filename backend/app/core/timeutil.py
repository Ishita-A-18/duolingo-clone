from datetime import datetime, timezone


def utcnow() -> datetime:
    """Naive UTC 'now' (SQLite stores datetimes without tz info)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
