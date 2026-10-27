from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_home():
    response = client.get("/")

    assert response.status_code == 200
    assert "message" in response.json()
    assert "instance" in response.json()


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_db_health():
    response = client.get("/db-health")

    assert response.status_code == 200
    assert response.json()["database"] == "connected"

def test_create_item():
    response = client.post(
        "/items",
        json={"name": "pytest-item", "price": 123.45}
    )

    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "pytest-item"
    assert data["price"] == 123.45
    assert "id" in data


def test_get_items():
    response = client.get("/items")

    assert response.status_code == 200

    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)