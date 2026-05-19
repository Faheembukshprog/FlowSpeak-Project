import requests
import json

BASE_URL = "http://localhost:5070"
TIMEOUT = 30

def test_post_api_action_process_should_process_preparsed_intent():
    session = requests.Session()
    username = "testuser_tc006"
    password = "StrongP@ssw0rd!"
    fullName = "Test User TC006"

    try:
        # Register a new user
        register_payload = {
            "username": username,
            "password": password,
            "fullName": fullName
        }
        r = session.post(f"{BASE_URL}/api/auth/register", json=register_payload, timeout=TIMEOUT)
        assert r.status_code in (200, 409), f"Unexpected status code on register: {r.status_code}"
        if r.status_code == 409:
            # User exists, proceed to login
            pass
        else:
            resp_json = r.json()
            assert resp_json.get("success") is True, f"Register failed: {resp_json}"

        # Login to get authentication cookies
        login_payload = {
            "username": username,
            "password": password
        }
        r = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Login failed with status code {r.status_code}"
        resp_json = r.json()
        assert resp_json.get("success") is True, f"Login failed response: {resp_json}"
        assert "user" in resp_json, "User profile missing in login response"

        # Prepare a pre-parsed intent JSON to send to /api/action/process
        # Example intent: CHECK_STOCK for product SKU 12345
        process_payload = {
            "intent": "CHECK_STOCK",
            "entity": "product",
            "parameters": {
                "sku": "12345"
            }
        }
        r = session.post(f"{BASE_URL}/api/action/process", json=process_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Process endpoint failed with status code {r.status_code}"
        resp_json = r.json()
        assert resp_json.get("success") is True, f"Process endpoint unsuccessful: {resp_json}"
        assert "message" in resp_json, "Response missing message key"
        assert "data" in resp_json, "Response missing data key"

    finally:
        # Logout to clear cookies and revoke tokens
        try:
            r = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
            assert r.status_code == 200, f"Logout failed with status {r.status_code}"
            resp_json = r.json()
            assert resp_json.get("success") is True, "Logout response unsuccessful"
        except Exception:
            # Ignore logout failures
            pass

test_post_api_action_process_should_process_preparsed_intent()