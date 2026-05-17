import bcrypt

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