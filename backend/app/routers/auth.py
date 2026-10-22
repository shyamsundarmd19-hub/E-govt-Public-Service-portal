from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    VerifyOTPRequest,
    UserResponse,
    TokenResponse
)
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new citizen, clerk, or officer."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Allowed self-registration roles (default: citizen)
    role = user_in.role.lower() if user_in.role else "citizen"
    if role not in ["citizen", "clerk", "officer", "admin"]:
        role = "citizen"

    user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        role=role,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    record_audit_log(
        db=db,
        action="USER_REGISTER",
        user_id=user.id,
        details={"email": user.email, "role": user.role}
    )
    db.commit()

    return user


@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access token."""
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "name": user.name}
    )

    record_audit_log(
        db=db,
        action="USER_LOGIN",
        user_id=user.id,
        details={"role": user.role}
    )
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/verify-otp")
def verify_otp(otp_in: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Mocked 2FA / Aadhaar OTP verification endpoint.
    Accepts 6-digit OTP (e.g. 123456 or matching test pattern).
    """
    user = db.query(User).filter(User.email == otp_in.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found for provided email."
        )

    # Mock OTP rule: any 6-digit number or demo code 123456
    if len(otp_in.otp) != 6 or not otp_in.otp.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP format. Must be a 6-digit numeric code."
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "name": user.name, "2fa": True}
    )

    return {
        "verified": True,
        "message": "OTP verification successful.",
        "access_token": access_token,
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns profile information for the authenticated user."""
    return current_user
