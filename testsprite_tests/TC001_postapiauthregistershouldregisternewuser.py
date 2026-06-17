import requests
import uuid

BASE_URL = "http://localhost:5070"
REGISTER_ENDPOINT = "/api/auth/register"
TIMEOUT = 30

def test_post_api_auth_register_should_register_new_user():
    unique_suffix = uuid.uuid4().hex[:8]
    username = f"testuser_{unique_suffix}"
    password = "ComplexPass123!"
    full_name = "Test User"
    role = "Viewer"

    url = BASE_URL + REGISTER_ENDPOINT
    headers = {"Content-Type": "application/json"}
    payload = {
        "username": username,
        "password": password,
        "fullName": full_name,
        "role": role
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    assert resp.status_code == 200, f"Expected status 200, got {resp.status_code}"
    json_resp = resp.json()
    assert isinstance(json_resp, dict), "Response is not a JSON object"
    assert "success" in json_resp, "'success' field missing in response"
    assert json_resp["success"] is True, "'success' field is not True"
    assert "message" in json_resp, "'message' field missing in response"
    assert isinstance(json_resp["message"], str) and len(json_resp["message"]) > 0, "'message' field is empty or not string"

test_post_api_auth_register_should_register_new_user()