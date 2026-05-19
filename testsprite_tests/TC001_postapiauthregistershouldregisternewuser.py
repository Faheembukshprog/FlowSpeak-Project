import requests
import uuid
import traceback

BASE_URL = "http://localhost:5070"
REGISTER_ENDPOINT = "/api/auth/register"
DELETE_USER_ENDPOINT = "/api/auth/delete"  # Not specified in PRD, so no direct delete endpoint assumed

def test_post_api_auth_register_should_register_new_user():
    """
    Test user registration endpoint with valid username, password, fullName, and optional role
    to ensure successful user creation and appropriate success response.
    """

    # Generate unique username to avoid conflict
    unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "TestPassword123!"
    full_name = "Test User"
    role = "Viewer"  # Optional, can be omitted

    url = BASE_URL + REGISTER_ENDPOINT
    payload = {
        "username": unique_username,
        "password": password,
        "fullName": full_name,
        "role": role
    }
    headers = {
        "Content-Type": "application/json"
    }
    timeout = 30

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=timeout)
        # Assert status code is 200 success
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}, response: {response.text}"

        resp_json = response.json()
        # Assert success is True
        assert "success" in resp_json and resp_json["success"] is True, f"Response success key missing or false: {resp_json}"
        # Assert message exists and is a non-empty string
        assert "message" in resp_json and isinstance(resp_json["message"], str) and resp_json["message"], f"Message missing or empty: {resp_json}"

    except Exception as e:
        traceback.print_exc()
        raise

test_post_api_auth_register_should_register_new_user()