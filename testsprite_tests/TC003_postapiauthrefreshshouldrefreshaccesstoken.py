import requests
import json
import uuid

BASE_URL = "http://localhost:5070"
TIMEOUT = 30

def test_post_api_auth_refresh_should_refresh_access_token():
    session = requests.Session()
    unique_suffix = str(uuid.uuid4())[:8]
    try:
        # Step 1: Register a new user
        register_payload = {
            "username": f"testuser_refresh_{unique_suffix}",
            "password": "TestPassword123!",
            "fullName": "Test User Refresh"
        }
        r_register = session.post(
            f"{BASE_URL}/api/auth/register",
            json=register_payload,
            timeout=TIMEOUT
        )
        assert r_register.status_code == 200, f"Register failed: {r_register.text}"
        reg_resp = r_register.json()
        assert reg_resp.get("success") is True, "Register success flag is not True"

        # Step 2: Login to get cookies (access and refresh tokens)
        login_payload = {
            "username": register_payload["username"],
            "password": register_payload["password"]
        }
        r_login = session.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload,
            timeout=TIMEOUT
        )
        assert r_login.status_code == 200, f"Login failed: {r_login.text}"
        login_resp = r_login.json()
        assert login_resp.get("success") is True, "Login success flag is not True"
        assert "user" in login_resp, "Login response missing user profile"

        # Step 3: Call refresh endpoint using the session cookies (includes refresh token cookie automatically)
        r_refresh = session.post(
            f"{BASE_URL}/api/auth/refresh",
            timeout=TIMEOUT
        )
        assert r_refresh.status_code == 200, f"Refresh failed: {r_refresh.text}"
        refresh_resp = r_refresh.json()
        assert refresh_resp.get("success") is True, "Refresh success flag is not True"
        assert "Tokens refreshed" in refresh_resp.get("message", ""), "Unexpected refresh message"

    finally:
        try:
            session.post(
                f"{BASE_URL}/api/auth/logout",
                timeout=TIMEOUT
            )
        except Exception:
            pass

test_post_api_auth_refresh_should_refresh_access_token()
