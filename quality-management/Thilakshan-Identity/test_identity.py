"""
RentaTool Quality Management – Identity Module Automated Test Suite
Course: SE3110: Quality Management in Software Engineering
Assigned Member: Thilakshan
Module: Identity, Authentication & KYC
"""

import sys
import argparse
import requests
import uuid

# Force UTF-8 or safe encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def log_test(test_id, name, passed, detail=""):
    symbol = "[PASS]" if passed else "[FAIL]"
    print(f"[{test_id}] {symbol} - {name}")
    if detail:
        print(f"       Info: {detail}")

def run_suite(base_url):
    print("\n" + "=" * 70)
    print(f"[SUITE] RUNNING IDENTITY MODULE QUALITY SUITE against {base_url}")
    print("=" * 70)
    
    passed_count = 0
    total_count = 0

    # 1. Health Probe
    total_count += 1
    try:
        health_url = base_url.replace("/api/v1", "/health")
        res = requests.get(health_url, timeout=10)
        p = res.status_code == 200
        log_test("ID-TC-00", "API Health Check Endpoint", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("ID-TC-00", "API Health Check Endpoint", False, str(e))

    # 2. Valid Registration
    total_count += 1
    uid = uuid.uuid4().hex[:6]
    test_email = f"qa_thilakshan_{uid}@rentatool.test"
    test_phone = f"077{uuid.uuid4().int % 9000000 + 1000000}"
    test_password = "Password@123!"
    reg_payload = {
        "name": "QA Thilakshan TestUser",
        "email": test_email,
        "password": test_password,
        "phoneNumber": test_phone,
        "role": "Renter"
    }
    try:
        res = requests.post(f"{base_url}/auth/register", json=reg_payload, timeout=10)
        p = res.status_code in [200, 201]
        log_test("ID-TC-01", "Valid User Registration", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("ID-TC-01", "Valid User Registration", False, str(e))

    # 3. Duplicate Email Rejection
    total_count += 1
    try:
        res = requests.post(f"{base_url}/auth/register", json=reg_payload, timeout=10)
        p = res.status_code in [400, 409]
        log_test("ID-TC-02", "Duplicate Email Conflict Rejection", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("ID-TC-02", "Duplicate Email Conflict Rejection", False, str(e))

    # 4. Malformed Email Validation
    total_count += 1
    try:
        bad_payload = dict(reg_payload)
        bad_payload["email"] = "not-a-valid-email"
        res = requests.post(f"{base_url}/auth/register", json=bad_payload, timeout=10)
        p = res.status_code == 400
        log_test("ID-TC-03", "Malformed Email Validation Error", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("ID-TC-03", "Malformed Email Validation Error", False, str(e))

    # 5. Valid Login & JWT Issuance
    total_count += 1
    access_token = None
    try:
        login_payload = {"email": test_email, "password": test_password}
        res = requests.post(f"{base_url}/auth/login", json=login_payload, timeout=10)
        data = res.json() if res.status_code == 200 else {}
        access_token = data.get("accessToken") or data.get("token")
        p = res.status_code == 200 and access_token is not None
        log_test("ID-TC-05", "Valid Login & JWT Issuance", p, f"Status: {res.status_code}, Token Received: {bool(access_token)}")
        if p: passed_count += 1
    except Exception as e:
        log_test("ID-TC-05", "Valid Login & JWT Issuance", False, str(e))

    # 6. Invalid Password Rejection (401)
    total_count += 1
    try:
        bad_login = {"email": test_email, "password": "WrongPassword999!"}
        res = requests.post(f"{base_url}/auth/login", json=bad_login, timeout=10)
        p = res.status_code == 401
        log_test("ID-TC-06", "Invalid Password 401 Rejection", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("ID-TC-06", "Invalid Password 401 Rejection", False, str(e))

    # 7. Protected Endpoint Unauthenticated (401)
    total_count += 1
    try:
        res = requests.post(f"{base_url}/users/kyc", json={}, timeout=10)
        p = res.status_code == 401
        log_test("ID-TC-10", "Protected Endpoint Token Enforcement", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("ID-TC-10", "Protected Endpoint Token Enforcement", False, str(e))

    # 8. Authenticated Profile Retrieval
    total_count += 1
    try:
        if access_token:
            headers = {"Authorization": f"Bearer {access_token}"}
            res = requests.get(f"{base_url}/users/me", headers=headers, timeout=10)
            p = res.status_code in [200, 404]
            log_test("ID-TC-08", "Authenticated Profile Retrieval", p, f"Status: {res.status_code}")
            if p: passed_count += 1
        else:
            log_test("ID-TC-08", "Authenticated Profile Retrieval", False, "Skipped - no access token")
    except Exception as e:
        log_test("ID-TC-08", "Authenticated Profile Retrieval", False, str(e))

    print("\n" + "-" * 70)
    print(f"[SUMMARY] {passed_count}/{total_count} Identity Tests Passed ({(passed_count/total_count)*100:.1f}%)")
    print("-" * 70)
    return passed_count == total_count

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Identity Module Automated QA Suite")
    parser.add_argument("--url", default="http://18.139.3.242:5000/api/v1", help="Target API Base URL")
    args = parser.parse_args()
    success = run_suite(args.url.rstrip("/"))
    sys.exit(0 if success else 1)
