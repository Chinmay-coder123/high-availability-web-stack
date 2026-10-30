
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
import mysql.connector
import os
import json
import glob

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

BACKUP_DIR = os.getenv("BACKUP_DIR", "/backups")


@app.get("/backup-status")
def backup_status():
    metadata_path = os.path.join(BACKUP_DIR, "backup_metadata.json")

    existing_backups = sorted(glob.glob(os.path.join(BACKUP_DIR, "webstack_*.sql.gz")))
    has_backup_files = len(existing_backups) > 0
    latest_file_on_disk = os.path.basename(existing_backups[-1]) if has_backup_files else None

    meta = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
        except Exception:
            pass

    latest_op_status = meta.get("latest_operation_status", "success" if has_backup_files else "none")
    latest_op_time = meta.get("latest_operation_timestamp")

    latest_backup_file = meta.get("latest_successful_backup_file") or latest_file_on_disk
    latest_backup_timestamp = meta.get("latest_successful_backup_timestamp")
    if not latest_backup_timestamp and latest_backup_file:
        parts = latest_backup_file.replace("webstack_", "").replace(".sql.gz", "")
        latest_backup_timestamp = parts

    if not latest_op_time:
        latest_op_time = latest_backup_timestamp

    interval_seconds = meta.get("backup_interval_seconds", 21600)
    hours = interval_seconds // 3600

    return {
        "backup_available": has_backup_files,
        "backup_count": len(existing_backups),
        "latest_backup_file": latest_backup_file,
        "latest_backup_timestamp": latest_backup_timestamp,
        "latest_operation_status": latest_op_status,
        "latest_operation_timestamp": latest_op_time,
        "backup_interval_seconds": interval_seconds,
        "configured_interval_human": f"{hours} hours" if interval_seconds % 3600 == 0 else f"{interval_seconds}s",
        "instance": INSTANCE_NAME,
    }

