import requests
import uuid

BASE_URL = "http://localhost:5070"
TIMEOUT = 30

def test_post_api_auth_login_should_authenticate_user_and_set_cookies():
    session = requests.Session()
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    test_username = f"testuser_{uuid.uuid4().hex[:8]}"
    test_password = "TestPassword123!"
    test_fullname = "Test User"
    try:
        # Register a new user
        register_payload = {
            "username": test_username,
            "password": test_password,
            "fullName": test_fullname
        }
        register_resp = session.post(register_url, json=register_payload, timeout=TIMEOUT)
        assert register_resp.status_code == 200, f"Registration failed: {register_resp.status_code} {register_resp.text}"
        reg_json = register_resp.json()
        assert reg_json.get("success") is True, f"Registration response success false: {reg_json}"
        # Login with valid credentials
        login_payload = {
            "username": test_username,
            "password": test_password
        }
        login_resp = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code} {login_resp.text}"
        login_json = login_resp.json()
        assert login_json.get("success") is True, f"Login response success false: {login_json}"
        # Validate user profile in response
        user_profile = login_json.get("user")
        assert user_profile is not None, "User profile missing in login response"
        assert "fullName" in user_profile and user_profile["fullName"] == test_fullname, "Full name mismatch in user profile"
        assert "role" in user_profile and isinstance(user_profile["role"], str), "Role missing or invalid in user profile"
        # Validate HttpOnly authentication cookies are set
        cookies = session.cookies
        # We expect at least access token and refresh token cookies, typically named access_token, refresh_token or similar
        cookie_names = [c.name for c in cookies]
        assert cookie_names, "No cookies set in login response"
        # Check for cookies that have HttpOnly attribute (requests does not expose HttpOnly directly, so we manually check Set-Cookie header)
        set_cookie_headers = login_resp.headers.getlist('Set-Cookie') if hasattr(login_resp.headers, 'getlist') else []
        if not set_cookie_headers:
            # fallback: parse Set-Cookie header manually if present
            set_cookie_headers = [login_resp.headers.get('Set-Cookie')] if login_resp.headers.get('Set-Cookie') else []
        assert set_cookie_headers, "No Set-Cookie headers present in login response"
        http_only_cookies_found = any('httponly' in sc.lower() for sc in set_cookie_headers)
        assert http_only_cookies_found, "No HttpOnly cookies set in login response"
    finally:
        # Cleanup: delete the test user if supported (not specified in PRD), so ignore here
        pass

test_post_api_auth_login_should_authenticate_user_and_set_cookies()