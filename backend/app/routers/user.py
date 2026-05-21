from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, UserCreate # Pastikan UserCreate ada di sini
from app.crud import user as crud_user
from app.core.security import get_password_hash

router = APIRouter(
    prefix="/auth", # Prefix ini akan membuat endpoint menjadi /auth/register, /auth/login, dll.
    tags=["Autentikasi & User"]
)

# --- FUNGSI AUTH ---
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

# --- FUNGSI PENGOLAHAN DATA ADMIN ---
# Tips: Menggunakan prefix /auth juga, jadi aksesnya adalah /auth/users
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.post("/users", response_model=UserResponse)
async def create_user_by_admin(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Cek duplikasi email
    query = select(User).where(User.email == user_in.email)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email sudah terdaftar di sistem")
    
    new_user = User(
        nama=user_in.nama,
        email=user_in.email,
        password=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user