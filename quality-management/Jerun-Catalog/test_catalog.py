"""
RentaTool Quality Management – Catalog Module Automated Test Suite
Course: SE3110: Quality Management in Software Engineering
Assigned Member: Jerun
Module: Catalog, Equipment Management & Maintenance
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
    print(f"[SUITE] RUNNING CATALOG MODULE QUALITY SUITE against {base_url}")
    print("=" * 70)
    
    passed_count = 0
    total_count = 0

    # 1. Public Catalog Retrieval
    total_count += 1
    equipment_items = []
    try:
        res = requests.get(f"{base_url}/equipment", timeout=10)
        data = res.json() if res.status_code == 200 else {}
        equipment_items = data.get("items") or (data if isinstance(data, list) else [])
        p = res.status_code == 200 and len(equipment_items) > 0
        log_test("CAT-TC-01", "Public Equipment Catalog Retrieval", p, f"Status: {res.status_code}, Found: {len(equipment_items)} items")
        if p: passed_count += 1
    except Exception as e:
        log_test("CAT-TC-01", "Public Equipment Catalog Retrieval", False, str(e))

    # 2. Categories Retrieval
    total_count += 1
    category_id = None
    try:
        res = requests.get(f"{base_url}/categories", timeout=10)
        data = res.json() if res.status_code == 200 else []
        categories = data if isinstance(data, list) else data.get("items", [])
        if categories:
            category_id = categories[0].get("id")
        p = res.status_code == 200 and len(categories) > 0
        log_test("CAT-TC-02", "Equipment Categories Retrieval", p, f"Status: {res.status_code}, Categories count: {len(categories)}")
        if p: passed_count += 1
    except Exception as e:
        log_test("CAT-TC-02", "Equipment Categories Retrieval", False, str(e))

    # 3. Keyword Search
    total_count += 1
    try:
        sample_query = "Generator"
        res = requests.get(f"{base_url}/equipment?search={sample_query}", timeout=10)
        data = res.json() if res.status_code == 200 else {}
        filtered_items = data.get("items") or (data if isinstance(data, list) else [])
        p = res.status_code == 200
        log_test("CAT-TC-03", f"Keyword Search Filter ('{sample_query}')", p, f"Status: {res.status_code}, Matches: {len(filtered_items)}")
        if p: passed_count += 1
    except Exception as e:
        log_test("CAT-TC-03", "Keyword Search Filter", False, str(e))

    # 4. Equipment Detail Retrieval
    total_count += 1
    first_item = equipment_items[0] if equipment_items else None
    if first_item and "id" in first_item:
        item_id = first_item["id"]
        try:
            res = requests.get(f"{base_url}/equipment/{item_id}", timeout=10)
            data = res.json() if res.status_code == 200 else {}
            p = res.status_code == 200 and data.get("id") == item_id
            log_test("CAT-TC-05", "Equipment Detail Lookup by ID", p, f"Status: {res.status_code}, Title: {data.get('title')}")
            if p: passed_count += 1
        except Exception as e:
            log_test("CAT-TC-05", "Equipment Detail Lookup by ID", False, str(e))
    else:
        log_test("CAT-TC-05", "Equipment Detail Lookup by ID", False, "Skipped - No catalog items found")

    # 5. Invalid Equipment ID Handling (404)
    total_count += 1
    try:
        fake_id = str(uuid.uuid4())
        res = requests.get(f"{base_url}/equipment/{fake_id}", timeout=10)
        p = res.status_code == 404
        log_test("CAT-TC-06", "Non-Existent Equipment 404 Response", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("CAT-TC-06", "Non-Existent Equipment 404 Response", False, str(e))

    # 6. Owner Trust Metrics & Verification Attributes
    total_count += 1
    if first_item:
        has_owner_props = "ownerTrustScore" in first_item or "ownerIsVerified" in first_item or "ownerName" in first_item
        log_test("CAT-TC-14", "Owner Trust & Verification Properties Present", has_owner_props, f"Owner: {first_item.get('ownerName')}, TrustScore: {first_item.get('ownerTrustScore')}")
        if has_owner_props: passed_count += 1
    else:
        log_test("CAT-TC-14", "Owner Trust & Verification Properties Present", False, "Skipped - No items")

    # 7. Unauthenticated Equipment Mutation Blocked
    total_count += 1
    try:
        res = requests.post(f"{base_url}/equipment", json={"title": "Unauthorized Tool"}, timeout=10)
        p = res.status_code in [400, 401, 403]
        log_test("CAT-TC-13", "Unauthorized/Invalid Equipment Mutation Rejection", p, f"Status: {res.status_code}")
        if p: passed_count += 1
    except Exception as e:
        log_test("CAT-TC-13", "Unauthorized/Invalid Equipment Mutation Rejection", False, str(e))

    print("\n" + "-" * 70)
    print(f"[SUMMARY] {passed_count}/{total_count} Catalog Tests Passed ({(passed_count/total_count)*100:.1f}%)")
    print("-" * 70)
    return passed_count == total_count

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Catalog Module Automated QA Suite")
    parser.add_argument("--url", default="http://18.139.3.242:5000/api/v1", help="Target API Base URL")
    args = parser.parse_args()
    success = run_suite(args.url.rstrip("/"))
    sys.exit(0 if success else 1)
