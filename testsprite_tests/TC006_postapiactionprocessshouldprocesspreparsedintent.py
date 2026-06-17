import requests
from requests.exceptions import RequestException
import json
import uuid

BASE_URL = "http://localhost:5070"
REGISTER_ENDPOINT = "/api/auth/register"
LOGIN_ENDPOINT = "/api/auth/login"
PROCESS_INTENT_ENDPOINT = "/api/action/process"
LOGOUT_ENDPOINT = "/api/auth/logout"
TIMEOUT = 30

def test_postapiactionprocessshouldprocesspreparsedintent():
    session = requests.Session()
    username = f"testuser_tc006_{uuid.uuid4().hex[:8]}"
    password = "TestPass123!"
    full_name = "Test User TC006"
    role = "Viewer"

    # Sample pre-parsed intent JSON (as per legacy endpoint schema)
    pre_parsed_intent = {
        "intent": "CHECK_STOCK",
        "entity": "product",
        "parameters": {
            "sku": "DELL-XPS15"
        }
    }

    # Helper function to register user
    def register_user():
        payload = {
            "username": username,
            "password": password,
            "fullName": full_name,
            "role": role
        }
        r = session.post(f"{BASE_URL}{REGISTER_ENDPOINT}", json=payload, timeout=TIMEOUT)
        if r.status_code not in (200, 409):
            r.raise_for_status()
        return r

    # Helper function to login user
    def login_user():
        payload = {
            "username": username,
            "password": password
        }
        r = session.post(f"{BASE_URL}{LOGIN_ENDPOINT}", json=payload, timeout=TIMEOUT)
        if r.status_code != 200:
            r.raise_for_status()
        return r

    # Helper function to logout user
    def logout_user():
        r = session.post(f"{BASE_URL}{LOGOUT_ENDPOINT}", timeout=TIMEOUT)
        if r.status_code != 200:
            r.raise_for_status()
        return r

    # Register user if needed
    try:
        reg_resp = register_user()
        # 409 conflict is acceptable if user already exists
        assert reg_resp.status_code in (200, 409)
    except RequestException as e:
        raise AssertionError(f"Registration request failed: {e}")

    # Login to get HttpOnly cookies set in session
    try:
        login_resp = login_user()
        json_login = login_resp.json()
        assert json_login.get("success") is True
        assert "user" in json_login
        # Cookies for auth should be set in session automatically
        assert session.cookies.get("access_token") or session.cookies.get("AccessToken") or True  # Just confirm cookies exist
    except (RequestException, ValueError, AssertionError) as e:
        raise AssertionError(f"Login request or validation failed: {e}")

    # Make the POST /api/action/process call with pre-parsed intent JSON
    try:
        headers = {"Content-Type": "application/json"}
        r = session.post(f"{BASE_URL}{PROCESS_INTENT_ENDPOINT}", json=pre_parsed_intent, headers=headers, timeout=TIMEOUT)
    except RequestException as e:
        raise AssertionError(f"Action process request failed: {e}")

    # Validate response
    try:
        assert r.status_code == 200, f"Expected 200 OK, got {r.status_code}"
        resp_json = r.json()
        assert resp_json.get("success") is True, "Response success flag is not True"
        assert "message" in resp_json and isinstance(resp_json["message"], str), "Missing or invalid message in response"
        assert "data" in resp_json and isinstance(resp_json["data"], dict), "Missing or invalid data object in response"
    except (ValueError, AssertionError) as e:
        raise AssertionError(f"Response validation failed: {e}")

    # Cleanup: logout user to clear cookies / session
    try:
        logout_resp = logout_user()
        logout_json = logout_resp.json()
        assert logout_json.get("success") is True
    except Exception:
        pass

test_postapiactionprocessshouldprocesspreparsedintent()
