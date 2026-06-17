import requests
from operator import itemgetter

BASE_URL = "http://localhost:5070"
TIMEOUT = 30


def test_get_api_telemetry_logs_should_return_recent_ai_command_logs():
    url = f"{BASE_URL}/api/telemetry/logs"
    try:
        response = requests.get(url, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

        logs = response.json()
        assert isinstance(logs, list), "Response should be a JSON array."

        # If logs are empty, that is valid, just confirm empty list
        if logs:
            # Confirm does not exceed 50 entries
            assert len(logs) <= 50, f"Returned logs exceed 50 entries: {len(logs)}"

            # Check ordering by processing time descending (most recent first)
            # Check if 'processingTime' key present and parseable
            # We assume processingTime exists in each log and is comparable (string or number)
            # We'll compare that the list is sorted descending by processingTime
            processing_times = []
            for idx, log in enumerate(logs):
                assert 'processingTime' in log, f"log entry at index {idx} missing 'processingTime'"
                processing_times.append(log['processingTime'])
            # Verify descending order
            assert processing_times == sorted(processing_times, reverse=True), "Logs are not ordered by processingTime descending"

    except requests.RequestException as e:
        assert False, f"Request to /api/telemetry/logs failed: {e}"


test_get_api_telemetry_logs_should_return_recent_ai_command_logs()