import pytest
from app.db.database import init_db, create_user, authenticate_user, authenticate_google_user, list_users

def test_database_init_and_default_commander():
    init_db()
    users = list_users()
    assert len(users) >= 1
    # Check that commander exists
    commander = next((u for u in users if u["email"] == "commander@floodsight.org"), None)
    assert commander is not None
    assert commander["role"] == "commander"

def test_user_signup_and_login():
    init_db()
    test_email = "gis_lead_test@floodsight.org"
    try:
        user = create_user(
            email=test_email,
            name="Test GIS Analyst",
            password="StrongPassword2026!",
            role="analyst"
        )
        assert user["email"] == test_email
        assert user["role"] == "analyst"
    except ValueError:
        # User already exists from previous run
        pass

    auth = authenticate_user(test_email, "StrongPassword2026!")
    assert auth is not None
    assert auth["email"] == test_email

    # Test bad password
    bad_auth = authenticate_user(test_email, "WrongPassword!")
    assert bad_auth is None

def test_google_auth_sync():
    init_db()
    g_user = authenticate_google_user(
        email="google_operator@floodsight.org",
        name="Google Drone Operator",
        role="rescuer"
    )
    assert g_user["email"] == "google_operator@floodsight.org"
    assert g_user["name"] == "Google Drone Operator"
