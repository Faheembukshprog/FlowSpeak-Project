import requests
import json

BASE_URL = "http://localhost:5070"
TIMEOUT = 30

def test_postapiauthlogoutshouldclearcookiesandrevoke():
    session = requests.Session()
    try:
        # Step 1: Register a new user to have valid credentials
        register_payload = {
            "username": "testuser_logout_tc004",
            "password": "TestPass123!",
            "fullName": "Test User Logout",
            "role": "Viewer"
        }
        register_resp = session.post(f"{BASE_URL}/api/auth/register", json=register_payload, timeout=TIMEOUT)
        assert register_resp.status_code == 200, f"Register failed with status {register_resp.status_code}: {register_resp.text}"
        reg_json = register_resp.json()
        assert reg_json.get("success") is True, f"Register success flag false: {reg_json}"

        # Step 2: Login to receive authentication cookies
        login_payload = {
            "username": register_payload["username"],
            "password": register_payload["password"]
        }
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}: {login_resp.text}"
        login_json = login_resp.json()
        assert login_json.get("success") is True, f"Login success flag false: {login_json}"
        assert "user" in login_json, f"No user object in login response: {login_json}"
        # Confirm cookies set (access & refresh tokens)
        cookie_names = [cookie.name for cookie in session.cookies]
        assert any("access" in name.lower() for name in cookie_names), f"Access cookie not set: {cookie_names}"
        assert any("refresh" in name.lower() for name in cookie_names), f"Refresh cookie not set: {cookie_names}"

        # Step 3: Call logout endpoint to clear auth cookies and revoke tokens
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
        assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}: {logout_resp.text}"
        logout_json = logout_resp.json()
        assert logout_json.get("success") is True, f"Logout success flag false: {logout_json}"
        assert "logged out" in logout_json.get("message", "").lower(), f"Logout message missing 'logged out': {logout_json.get('message')}"

        # Step 4: Validate that authentication cookies are cleared in the session
        # After logout, session cookies should no longer include the access and refresh tokens
        cookie_names_after = [cookie.name for cookie in session.cookies]
        assert not any("access" in name.lower() for name in cookie_names_after), f"Access cookie still present after logout: {cookie_names_after}"
        assert not any("refresh" in name.lower() for name in cookie_names_after), f"Refresh cookie still present after logout: {cookie_names_after}"

        # Step 5: Attempt to refresh tokens using the now invalidated cookie to verify revocation
        refresh_resp = session.post(f"{BASE_URL}/api/auth/refresh", timeout=TIMEOUT)
        # Should return 401 unauthorized because tokens revoked and cookies cleared
        assert refresh_resp.status_code == 401, f"Refresh did not fail as expected after logout, status: {refresh_resp.status_code}, body: {refresh_resp.text}"

    finally:
        # Cleanup - attempt to delete the test user if API supported it
        # The PRD does not describe a delete user API, so we ignore cleanup here
        pass

test_postapiauthlogoutshouldclearcookiesandrevoke()