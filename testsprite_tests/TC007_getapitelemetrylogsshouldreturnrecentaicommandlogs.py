import requests
import time

BASE_URL = "http://localhost:5070"
TIMEOUT = 30

def test_get_api_telemetry_logs_should_return_recent_ai_command_logs():
    url = f"{BASE_URL}/api/telemetry/logs"

    try:
        resp = requests.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

    assert resp.status_code == 200, f"Expected status code 200, got {resp.status_code}"

    try:
        logs = resp.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(logs, list), f"Expected response to be a list, got {type(logs)}"

    # If no logs, ensure empty list
    if len(logs) == 0:
        return  # Empty log scenario valid

    # Check max 50 logs returned
    assert len(logs) <= 50, f"Expected at most 50 logs, got {len(logs)}"

    # Each log should have expected keys (at minimum)
    required_keys = {"processingTime"}
    for idx, log in enumerate(logs):
        assert isinstance(log, dict), f"Log at index {idx} is not a dict"
        assert required_keys.issubset(log.keys()), f"Log at index {idx} missing keys {required_keys - log.keys()}"

    # Check logs are ordered descending by processingTime
    times = []
    for log in logs:
        pt = log.get("processingTime")
        # Acceptable processingTime types: int or float or string date-time?
        # Try numeric first
        if isinstance(pt, (int, float)):
            times.append(pt)
        elif isinstance(pt, str):
            # Attempt parse timestamp or iso8601 string; fallback treat non-parsable as error
            try:
                # try parsing ISO8601 string to timestamp for comparison
                # fallback just store string for comparison
                from datetime import datetime
                dt = datetime.fromisoformat(pt.replace("Z", "+00:00"))
                ts = dt.timestamp()
                times.append(ts)
            except Exception:
                # cannot parse string timestamp, fail
                assert False, f"Log processingTime '{pt}' not parseable ISO8601 string"
        else:
            assert False, f"Log processingTime has unexpected type: {type(pt)}"

    # Check descending order
    for i in range(len(times)-1):
        assert times[i] >= times[i+1], "Logs are not ordered descending by processingTime"

test_get_api_telemetry_logs_should_return_recent_ai_command_logs()