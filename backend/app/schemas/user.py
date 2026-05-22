from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    nama: str
    email: EmailStr
    role: UserRole
    nim: Optional[str] = None
    nip: Optional[str] = None
    id_admin: Optional[str] = None
    id_staff: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str

    