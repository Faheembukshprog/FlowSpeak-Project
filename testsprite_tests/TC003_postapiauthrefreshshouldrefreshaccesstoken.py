import requests
import uuid

BASE_URL = "http://localhost:5070"
TIMEOUT = 30

def test_postapiauthrefreshshouldrefreshaccesstoken():
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    refresh_url = f"{BASE_URL}/api/auth/refresh"
    logout_url = f"{BASE_URL}/api/auth/logout"
    username = f"testuser_refresh_{uuid.uuid4().hex[:8]}"
    password = "TestPass123!"
    full_name = "Test User Refresh"

    # Prepare registration payload
    register_payload = {
        "username": username,
        "password": password,
        "fullName": full_name
    }
    headers = {
        "Content-Type": "application/json"
    }

    session = requests.Session()

    try:
        # Register user
        reg_resp = session.post(register_url, json=register_payload, headers=headers, timeout=TIMEOUT)
        assert reg_resp.status_code == 200, f"Unexpected register status: {reg_resp.status_code}, body: {reg_resp.text}"
        reg_body = reg_resp.json()
        assert reg_body.get("success") is True

        # Login user to get cookies
        login_payload = {
            "username": username,
            "password": password
        }
        login_resp = session.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Unexpected login status: {login_resp.status_code}, body: {login_resp.text}"
        login_body = login_resp.json()
        assert login_body.get("success") is True
        assert "user" in login_body
        assert login_body["user"].get("fullName") == full_name

        # Confirm refresh token cookie is set (HttpOnly cookies not accessible via JS, but requests.Session keeps cookies)
        # Attempt refresh with valid refresh token cookie set in session
        refresh_resp = session.post(refresh_url, timeout=TIMEOUT)
        assert refresh_resp.status_code == 200, f"Unexpected refresh status: {refresh_resp.status_code}, body: {refresh_resp.text}"
        refresh_body = refresh_resp.json()
        assert refresh_body.get("success") is True
        assert "Tokens refreshed" in refresh_body.get("message", "")

    finally:
        # Cleanup: Logout user to clear tokens and sessions
        try:
            logout_resp = session.post(logout_url, timeout=TIMEOUT)
            assert logout_resp.status_code == 200, f"Unexpected logout status: {logout_resp.status_code}, body: {logout_resp.text}"
            logout_body = logout_resp.json()
            assert logout_body.get("success") is True
        except Exception:
            pass

test_postapiauthrefreshshouldrefreshaccesstoken()
