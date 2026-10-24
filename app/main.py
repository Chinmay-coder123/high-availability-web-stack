from fastapi import FastAPI
import os

app = FastAPI()

INSTANCE_NAME = os.getenv("INSTANCE_NAME" , "app-local")

@app.get("/")
def home():
    return {
        "message": "Welcome to High-Availibility Web Stack!",
        "instance" : INSTANCE_NAME
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "instance": INSTANCE_NAME
    }