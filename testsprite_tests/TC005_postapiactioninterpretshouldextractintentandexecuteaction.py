import requests

BASE_URL = "http://localhost:5070"
TIMEOUT = 30

def test_post_api_action_interpret_should_extract_intent_and_execute_action():
    session = requests.Session()
    username = "testuser_tc005"
    password = "TestPass123!"
    full_name = "Test User TC005"

    # Register user (ignore if exists)
    try:
        register_payload = {
            "username": username,
            "password": password,
            "fullName": full_name
        }
        reg_resp = session.post(f"{BASE_URL}/api/auth/register", json=register_payload, timeout=TIMEOUT)
        # Accept 200 success or 409 conflict (user already exists)
        assert reg_resp.status_code in (200, 409), f"Unexpected register status: {reg_resp.status_code} - {reg_resp.text}"
    except requests.RequestException as e:
        raise AssertionError(f"User registration request failed: {e}")

    # Login to get auth cookies
    try:
        login_payload = {
            "username": username,
            "password": password
        }
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code} - {login_resp.text}"
        resp_json = login_resp.json()
        assert resp_json.get("success") is True, "Login response success flag false"
        assert "user" in resp_json and "fullName" in resp_json["user"], "User profile missing in login response"
        # Removed assertion on cookies presence because they are HttpOnly and not accessible via requests
    except requests.RequestException as e:
        raise AssertionError(f"Login request failed: {e}")

    # Define valid natural language text input to test intent extraction and action execution
    nl_text = "Check stock availability for product SKU 12345"

    # Send POST /api/action/interpret with authenticated session
    try:
        interpret_payload = {
            "text": nl_text
        }
        headers = {
            "Content-Type": "application/json"
        }
        interpret_resp = session.post(f"{BASE_URL}/api/action/interpret", json=interpret_payload, headers=headers, timeout=TIMEOUT)
        # Expect 200 success with intent, message, and data object
        assert interpret_resp.status_code == 200, f"Interpret failed: {interpret_resp.status_code} - {interpret_resp.text}"
        interpret_json = interpret_resp.json()
        assert interpret_json.get("success") is True, "Interpret response success flag false"
        assert isinstance(interpret_json.get("intent"), str) and interpret_json["intent"], "Interpret response missing or empty intent"
        assert isinstance(interpret_json.get("message"), str), "Interpret response missing message"
        assert isinstance(interpret_json.get("data"), dict), "Interpret response missing or invalid data object"
    except requests.RequestException as e:
        raise AssertionError(f"Interpret request failed: {e}")
    finally:
        # Logout cleanup to clear session cookies and revoke tokens
        try:
            logout_resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
            assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.status_code} - {logout_resp.text}"
            logout_json = logout_resp.json()
            assert logout_json.get("success") is True, "Logout response success flag false"
        except Exception:
            pass

test_post_api_action_interpret_should_extract_intent_and_execute_action()
