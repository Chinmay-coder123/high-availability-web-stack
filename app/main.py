
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
import mysql.connector
import os

app = FastAPI()
class Item(BaseModel):
    name: str
    price: float

INSTANCE_NAME = os.getenv("INSTANCE_NAME", "app-local")

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "database": os.getenv("DB_NAME", "webstack"),
    "user": os.getenv("DB_USER", "webuser"),
    "password": os.getenv("DB_PASSWORD", ""),
}


def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)


@app.get("/")
def home():
    return {
        "message": "Welcome to the High-Availability Web Stack!",
        "instance": INSTANCE_NAME
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "instance": INSTANCE_NAME
    }


@app.get("/db-health")
def database_health():
    try:
        connection = get_db_connection()

        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()

        cursor.close()
        connection.close()

        return {
            "database": "connected",
            "instance": INSTANCE_NAME
        }

    except mysql.connector.Error:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed"
        )

@app.post("/items")
def create_item(item: Item):
    connection = get_db_connection()
    cursor = connection.cursor()

    query = "INSERT INTO items (name , price) VALUES(%s , %s)"
    values = (item.name , item.price)

    cursor.execute(query , values)
    connection.commit()

    item_id = cursor.lastrowid

    cursor.close()
    connection.close()

    return {
        "message": "Item created successfully",
        "id": item_id,
        "name": item.name,
        "price": item.price
}

@app.get("/items")
def get_items():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM items")
        items = cursor.fetchall()

        return {
            "items" : items
        }
    except mysql.connector.Error:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve items"
        )
    finally:
        cursor.close()
        connection.close()