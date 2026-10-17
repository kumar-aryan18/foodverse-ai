from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "FoodVerse AI backend is running"}