import requests
import uuid

BASE_URL = "http://localhost:5070"
TIMEOUT = 30

def test_post_api_action_interpret_should_extract_intent_and_execute_action():
    session = requests.Session()
    try:
        # Step 1: Register a new user
        username = f"testuser_{uuid.uuid4().hex[:8]}"
        password = "TestPass123!"
        register_payload = {
            "username": username,
            "password": password,
            "fullName": "Test User"
        }
        reg_resp = session.post(
            f"{BASE_URL}/api/auth/register",
            json=register_payload,
            timeout=TIMEOUT
        )
        assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"
        reg_json = reg_resp.json()
        assert reg_json.get("success") is True

        # Step 2: Login with the new user to obtain auth cookies
        login_payload = {
            "username": username,
            "password": password
        }
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_json = login_resp.json()
        assert login_json.get("success") is True
        assert "user" in login_json
        assert "fullName" in login_json["user"]
        assert "role" in login_json["user"]

        # Step 3: Call /api/action/interpret with valid natural language text
        interpret_payload = {
            "text": "Check stock for product SKU DELL-XPS15"
        }
        interpret_resp = session.post(
            f"{BASE_URL}/api/action/interpret",
            json=interpret_payload,
            timeout=TIMEOUT
        )
        assert interpret_resp.status_code == 200, f"Interpret endpoint failed: {interpret_resp.text}"
        interpret_json = interpret_resp.json()
        # success could be True or False depending on product availability
        assert "success" in interpret_json, "Interpret response missing success field"

        if interpret_json["success"]:
            # Successful intent extraction and action execution
            assert "intent" in interpret_json, "Interpret response missing intent field"
            assert isinstance(interpret_json["intent"], str), "Intent field should be a string"
            assert "message" in interpret_json, "Interpret response missing message field"
            assert "data" in interpret_json, "Interpret response missing data field"
        else:
            # Intent dispatch failed but still a valid response with success=false
            assert "intent" in interpret_json, "Interpret failure response missing intent field"
            assert isinstance(interpret_json["intent"], str), "Intent field should be a string in failure"
            assert "message" in interpret_json, "Interpret failure response missing message field"
            # data can be null on failure as per observed response
            assert "errorCode" in interpret_json, "Interpret failure response missing errorCode field"

    finally:
        # Cleanup - logout the user to clear cookies / session.
        try:
            logout_resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
            assert logout_resp.status_code == 200
            logout_json = logout_resp.json()
            assert logout_json.get("success") is True
        except Exception:
            # Ignore exceptions in cleanup
            pass

test_post_api_action_interpret_should_extract_intent_and_execute_action()
