from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
#Passlib is a Python library for securely hashing passwords.
from jose import jwt, JWTError
#python-jose is used for JWT (JSON Web Token).
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User

#creates a password hashing object -> deprecated auto means if in future i change the scheme old passowrd still works
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def is_setup_complete(db: Session) -> bool:
    return db.query(User).count() > 0


def create_admin(db: Session, username: str, password: str) -> User:
    user = User(
        username=username,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
