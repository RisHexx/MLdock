import secrets
import hashlib
from sqlalchemy.orm import Session
from app.models.api_key import APIKey


def generate_api_key() -> str:
    """Generate a secure random API key."""
    return f"mld_{secrets.token_urlsafe(32)}"



#Strings in Python are Unicode. Hash functions work on bytes, not strings.
#encode() -> string into bytes using UTF-8 encoding.
def hash_key(key: str) -> str:
    """SHA-256 hash of the API key for storage."""
    return hashlib.sha256(key.encode()).hexdigest()

#.hexdigest() converts hash object to a readable hexadecimal string.


def create_api_key(db: Session, name: str) -> tuple[APIKey, str]:
    """Create a new API key. Returns (db_record, full_key)."""
    raw_key = generate_api_key()
    api_key = APIKey(
        name=name,
        key_hash=hash_key(raw_key),
        key_prefix=raw_key[:12],
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key, raw_key


def list_api_keys(db: Session) -> list[APIKey]:
    return db.query(APIKey).order_by(APIKey.created_at.desc()).all()


def revoke_api_key(db: Session, key_id: str) -> bool:
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not api_key:
        return False
    db.delete(api_key)
    db.commit()
    return True


def validate_api_key(db: Session, raw_key: str) -> bool:
    """Validate an API key by hashing it and checking the DB."""
    hashed = hash_key(raw_key)
    api_key = db.query(APIKey).filter(
        APIKey.key_hash == hashed,
        APIKey.is_active == True,
    ).first()
    return api_key is not None
