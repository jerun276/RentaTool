"""
RentaTool Quality Management – Booking Module Automated Test Suite
Course: SE3110: Quality Management in Software Engineering
Assigned Member: Nirojan
Module: Booking, Availability & QR Handover
"""

import sys
import argparse
import requests
import uuid
from datetime import datetime, timedelta, timezone

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
    print(f"[SUITE] RUNNING BOOKING MODULE QUALITY SUITE against {base_url}")
    print("=" * 70)
    
    passed_count = 0
    total_count = 0

    # 1. Booking List Query
    total_count += 1
    try:
        res = requests.get(f"{base_url}/bookings", timeout=10)
        p = res.status_code == 200
        data = res.json() if p else []
        items_count = len(data) if isinstance(data, list) else len(data.get("items", []))
        log_test("BKG-TC-09", "Bookings Query & List Retrieval", p, f"Status: {res.status_code}, Bookings found: {items_count}")
        if p: passed_count += 1
    except Exception as e:
        log_test("BKG-TC-09", "Bookings Query & List Retrieval", False, str(e))

    # 2. Register/Login a Test Renter
    uid = uuid.uuid4().hex[:6]
    renter_email = f"qa_renter_{uid}@rentatool.test"
    renter_phone = f"077{uuid.uuid4().int % 9000000 + 1000000}"
    renter_token = None
    try:
        reg_payload = {
            "name": "QA Renter TestUser",
            "email": renter_email,
            "password": "Password@123!",
            "phoneNumber": renter_phone,
            "role": "Renter"
        }
        res = requests.post(f"{base_url}/auth/register", json=reg_payload, timeout=10)
        login_res = requests.post(f"{base_url}/auth/login", json={"email": renter_email, "password": "Password@123!"}, timeout=10)
        if login_res.status_code == 200:
            data = login_res.json()
            renter_token = data.get("accessToken") or data.get("token")
    except Exception:
        pass

    # 3. Authenticated Renter Bookings Retrieval
    total_count += 1
    headers = {"Authorization": f"Bearer {renter_token}"} if renter_token else {}
    try:
        res = requests.get(f"{base_url}/bookings", headers=headers, timeout=10)
        p = res.status_code == 200
        log_test("BKG-TC-01", "Authenticated Booking Feed Access", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("BKG-TC-01", "Authenticated Booking Feed Access", False, str(e))

    # 4. End Date Before Start Date Rejection (400)
    total_count += 1
    try:
        now = datetime.now(timezone.utc)
        bad_booking = {
            "equipmentId": str(uuid.uuid4()),
            "startDate": (now + timedelta(days=5)).isoformat(),
            "endDate": (now + timedelta(days=2)).isoformat() # Invalid: end before start
        }
        res = requests.post(f"{base_url}/bookings", json=bad_booking, headers=headers, timeout=10)
        p = res.status_code in [400, 422]
        log_test("BKG-TC-02", "End Date Before Start Date Rejection (400)", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("BKG-TC-02", "End Date Before Start Date Rejection", False, str(e))

    # 5. Non-Existent Booking Detail Lookup (404)
    total_count += 1
    try:
        fake_bkg_id = str(uuid.uuid4())
        res = requests.get(f"{base_url}/bookings/{fake_bkg_id}", headers=headers, timeout=10)
        p = res.status_code in [404, 403]
        log_test("BKG-SEC-01", "Non-Existent/Isolated Booking IDOR Guard", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("BKG-SEC-01", "Non-Existent/Isolated Booking IDOR Guard", False, str(e))

    # 6. QR Handover Verification Endpoint Validation
    total_count += 1
    try:
        fake_bkg_id = str(uuid.uuid4())
        res = requests.post(
            f"{base_url}/bookings/{fake_bkg_id}/verify-handover",
            json={"handoverToken": "INVALID_TOKEN_12345"},
            headers=headers,
            timeout=10
        )
        p = res.status_code in [400, 404]
        log_test("BKG-TC-11", "QR Handover Verification Guard", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("BKG-TC-11", "QR Handover Verification Guard", False, str(e))

    print("\n" + "-" * 70)
    print(f"[SUMMARY] {passed_count}/{total_count} Booking Tests Passed ({(passed_count/total_count)*100:.1f}%)")
    print("-" * 70)
    return passed_count == total_count

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Booking Module Automated QA Suite")
    parser.add_argument("--url", default="http://18.139.3.242:5000/api/v1", help="Target API Base URL")
    args = parser.parse_args()
    success = run_suite(args.url.rstrip("/"))
    sys.exit(0 if success else 1)
