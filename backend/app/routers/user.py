from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, UserResponse
from app.crud import user as crud_user

router = APIRouter(
    prefix="/auth",
    tags=["Autentikasi & User"]
)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    return await crud_user.register_user(db=db, user_data=user_data)

@router.post("/login")
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await crud_user.authenticate_user(db=db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "message": "Login berhasil!",
        "user": {
            "id": user.id,
            "nama": user.nama,
            "email": user.email,
            "role": user.role
        }
    }