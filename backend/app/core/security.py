import bcrypt
import os
from cryptography.fernet import Fernet

# Kunci Enkripsi AES-256 (Fernet) untuk Keamanan Informasi (Encryption at Rest)
# Dapat diset via variabel lingkungan (.env) agar lebih aman di produksi.
DEFAULT_KEY = "IGnygt5MOxPU0U9h5YkWM6mVWnbyCg0NSLwhT1WK_YQ="
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", DEFAULT_KEY)

try:
    fernet = Fernet(ENCRYPTION_KEY.encode('utf-8'))
except Exception:
    # Fallback jika kunci ENV tidak valid, gunakan default key
    fernet = Fernet(DEFAULT_KEY.encode('utf-8'))

def encrypt_data(data: str) -> str:
    if not data:
        return data
    try:
        # Mengubah data teks menjadi bytes, enkripsi menggunakan AES-256, lalu decode ke string
        return fernet.encrypt(data.encode('utf-8')).decode('utf-8')
    except Exception:
        return data

def decrypt_data(cipher_text: str) -> str:
    if not cipher_text:
        return cipher_text
    try:
        # Dekripsi ciphertext AES-256 kembali menjadi teks asli
        return fernet.decrypt(cipher_text.encode('utf-8')).decode('utf-8')
    except Exception:
        # Graceful Fallback: Jika data di DB masih berupa teks biasa (data lama),
        # kembalikan teks biasa tersebut tanpa merusak sistem.
        return cipher_text

def get_password_hash(password: str) -> str:
    # Mengubah string password menjadi bytes, lalu di-hash
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Mengembalikan hasil hash dalam bentuk string agar bisa disimpan di DB
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Mengubah password polos dan hash DB menjadi bytes untuk dicocokkan
    plain_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hashed_bytes)