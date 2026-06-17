import requests
import uuid
import time

BASE_URL = "http://localhost:5070"
REGISTER_ENDPOINT = "/api/auth/register"
LOGIN_ENDPOINT = "/api/auth/login"
DELETE_USER_ENDPOINT = "/api/auth/delete"  # Assuming there is a way to delete user for cleanup - not in PRD, so will skip actual delete

timeout = 30


def test_postapiauthloginshouldauthenticateuserandsetcookies():
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "TestPassword123!"
    fullName = "Test User"

    # Register user payload
    register_payload = {
        "username": username,
        "password": password,
        "fullName": fullName,
        # role omitted to use default Viewer
    }

    # Register the user first so we can log in
    try:
        register_resp = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json=register_payload,
            timeout=timeout,
        )
        assert register_resp.status_code == 200, f"Register failed: {register_resp.status_code} {register_resp.text}"
        register_data = register_resp.json()
        assert register_data.get("success") is True, "Register response success false"
    except Exception as e:
        raise AssertionError(f"User registration setup failed: {e}")

    # Attempt login
    login_payload = {
        "username": username,
        "password": password,
    }
    try:
        login_resp = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=login_payload,
            timeout=timeout,
        )
    except Exception as e:
        raise AssertionError(f"Login request failed: {e}")

    # Validate response status code
    assert login_resp.status_code == 200, f"Login failed with status: {login_resp.status_code}, response: {login_resp.text}"

    # Validate body content
    try:
        login_json = login_resp.json()
    except Exception as e:
        raise AssertionError(f"Login response JSON decode failed: {e}")

    assert login_json.get("success") is True, "Login response success false"
    assert "user" in login_json, "Login response missing user profile"
    user_profile = login_json["user"]
    assert "fullName" in user_profile, "User profile missing fullName"
    assert "role" in user_profile, "User profile missing role"
    assert user_profile["fullName"] == fullName, "User fullName mismatch"

    # Validate HttpOnly cookies for auth
    cookies = login_resp.cookies
    # We expect at least two cookies: access token and refresh token, HttpOnly.
    # Requests cookies do not expose HttpOnly directly, so we check keys presence.
    cookie_names = [c.name for c in cookies]
    # Based on typical JWT cookie names used in JWT auth, often 'accessToken' and 'refreshToken'.
    # But since PRD does not specify cookie names, look for any cookie set.
    assert len(cookie_names) > 0, "No cookies set in login response"

    # Check each Set-Cookie header individually for HttpOnly attribute
    set_cookie_headers = login_resp.raw.headers.get_all("Set-Cookie") if hasattr(login_resp.raw.headers, "get_all") else login_resp.headers.get("Set-Cookie")
    if isinstance(set_cookie_headers, str):
        set_cookie_headers = [set_cookie_headers]
    assert set_cookie_headers is not None, "No Set-Cookie header in login response"
    has_httponly = any("HttpOnly" in header for header in set_cookie_headers)
    assert has_httponly, "No HttpOnly attribute found in Set-Cookie header"

    print("TC002 Passed: User login authenticated successfully with HttpOnly cookies set.")

# Run the test
test_postapiauthloginshouldauthenticateuserandsetcookies()
