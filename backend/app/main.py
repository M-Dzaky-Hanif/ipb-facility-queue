from fastapi import FastAPI

app = FastAPI(title="IPB Facility Queue API")

@app.get("/")
async def root():
    return {"message": "Selamat datang di API Sistem Antrean Fasilitas IPB!"}