import requests
from requests.exceptions import RequestException
import traceback
import uuid

BASE_URL = "http://localhost:5070"
REGISTER_PATH = "/api/auth/register"
LOGIN_PATH = "/api/auth/login"
LOGOUT_PATH = "/api/auth/logout"
TIMEOUT = 30

def test_postapiauthlogoutshouldclearcookiesandrevoke():
    session = requests.Session()
    test_username = f"testuser_tc004_{uuid.uuid4().hex[:8]}"
    test_password = "TestPass123!"
    test_fullName = "Test User TC004"

    # Register user payload
    register_payload = {
        "username": test_username,
        "password": test_password,
        "fullName": test_fullName
    }

    try:
        # Register the user
        reg_response = session.post(
            BASE_URL + REGISTER_PATH,
            json=register_payload,
            timeout=TIMEOUT
        )
        # If user already exists, still try to login
        assert reg_response.status_code in (200, 409), f"Unexpected register status code: {reg_response.status_code}"
        if reg_response.status_code == 200:
            reg_json = reg_response.json()
            assert reg_json.get("success") is True
            assert "message" in reg_json and isinstance(reg_json["message"], str)

        # Login user
        login_payload = {
            "username": test_username,
            "password": test_password
        }
        login_response = session.post(
            BASE_URL + LOGIN_PATH,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
        login_json = login_response.json()
        assert login_json.get("success") is True
        assert "user" in login_json and isinstance(login_json["user"], dict)
        # Validate user profile fields
        user_profile = login_json["user"]
        assert user_profile.get("fullName") == test_fullName
        assert isinstance(user_profile.get("role"), str)
        # Verify cookies set: we expect HttpOnly JWT cookies like access and refresh token
        cookies = session.cookies
        cookie_names = [c.name for c in cookies]
        assert any("access" in name.lower() for name in cookie_names), "Access token cookie not set"
        assert any("refresh" in name.lower() for name in cookie_names), "Refresh token cookie not set"

        # Perform logout
        logout_response = session.post(
            BASE_URL + LOGOUT_PATH,
            timeout=TIMEOUT
        )
        assert logout_response.status_code == 200, f"Logout failed with status code {logout_response.status_code}"
        logout_json = logout_response.json()
        assert logout_json.get("success") is True
        assert "message" in logout_json and "Logged out" in logout_json["message"]

        # After logout, cookies for access and refresh tokens should be cleared or expired
        # Check cookie expiration or absence
        post_logout_cookies = session.cookies
        # It's possible that cookies are cleared client side, or expired by server with Set-Cookie headers
        # So confirm absence or that cookie values are empty or expired
        expired_or_absent = True
        for name in cookie_names:
            c = post_logout_cookies.get(name)
            if c:
                # If any auth cookie still present and non-empty, fail
                expired_or_absent = False
                break
        assert expired_or_absent, "Authentication cookies were not cleared after logout"

    except (AssertionError, RequestException) as e:
        print(f"Test TC004 failed: {str(e)}")
        traceback.print_exc()
        raise
    finally:
        # Cleanup: delete the created user if API supported it, no endpoint described in PRD.
        # So no explicit delete, test user may remain.
        pass

test_postapiauthlogoutshouldclearcookiesandrevoke()
