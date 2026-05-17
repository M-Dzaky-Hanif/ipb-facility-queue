from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models.user import User
from app.schemas.user import UserRegister
from app.core.security import get_password_hash, verify_password

async def get_user_by_email(db: AsyncSession, email: str):
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def register_user(db: AsyncSession, user_data: UserRegister):
    # Cek apakah email sudah terdaftar
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah digunakan oleh akun lain!")
    
    # Ambil data dan hash password-nya
    data = user_data.model_dump()
    data["password"] = get_password_hash(data["password"])
    
    db_user = User(**data)
    db.add(db_user)
    
    try:
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal mendaftarkan user: {str(e)}")

async def authenticate_user(db: AsyncSession, email: str, password: str):
    db_user = await get_user_by_email(db, email)
    if not db_user:
        return False
    if not verify_password(password, db_user.password):
        return False
    return db_user