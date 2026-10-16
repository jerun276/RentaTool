"""
Automated API Security Testing Suite
SE3110: Quality Management in Software Engineering
Target: http://18.139.3.242:5000/api/v1
"""

import requests
import json
import time

BASE_URL = "http://18.139.3.242:5000/api/v1"

def print_header(title):
    print(f"\n{'='*70}\n[SECURITY TEST] {title}\n{'='*70}")

def test_security_headers():
    print_header("1. HTTP Security Headers Verification")
    res = requests.get(f"{BASE_URL}/equipment")
    headers = res.headers
    
    expected_headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": ["DENY", "SAMEORIGIN"],
        "Content-Security-Policy": None,
    }
    
    for header, expected in expected_headers.items():
        present = header in headers
        val = headers.get(header, "NOT PRESENT")
        if present:
            print(f"  [PASS] {header}: {val}")
        else:
            print(f"  [WARN] Missing Recommended Header: {header}")

    # Check if Server header leaks detailed version info
    server = headers.get("Server", "Hidden")
    print(f"  [INFO] Server Header: {server}")

def test_unauthenticated_protected_endpoints():
    print_header("2. Authentication & Authorization Enforcement (Broken Object Level Auth)")
    protected_endpoints = [
        ("POST", f"{BASE_URL}/bookings"),
        ("POST", f"{BASE_URL}/escrow/pre-authorize"),
        ("POST", f"{BASE_URL}/claims"),
        ("GET", f"{BASE_URL}/users"),
    ]
    
    for method, url in protected_endpoints:
        if method == "POST":
            res = requests.post(url, json={})
        else:
            res = requests.get(url)
            
        # Expecting 401 Unauthorized or 403 Forbidden
        if res.status_code in [401, 403]:
            print(f"  [PASS] {method} {url} -> {res.status_code} Unauthorized (Protected successfully)")
        elif res.status_code == 400:
            print(f"  [WARN] {method} {url} -> 400 Bad Request (Payload validated before Auth)")
        else:
            print(f"  [FAIL] {method} {url} returned {res.status_code} without authentication token!")

def test_sqli_resilience():
    print_header("3. SQL Injection (SQLi) Probing")
    payloads = [
        "' OR '1'='1",
        "1; DROP TABLE Users;--",
        "' UNION SELECT null, null--",
        "admin'--",
    ]
    
    for payload in payloads:
        # Test search / query param injection
        res = requests.get(f"{BASE_URL}/equipment", params={"search": payload, "category": payload})
        
        # It should return 200 (filtered) or 400 (bad request), never 500 (internal server SQL crash)
        has_sql_error = any(kw in res.text.lower() for kw in ["syntax error", "pg_", "npgsql", "sqlstate", "fatal error"])
        
        if res.status_code == 500 and has_sql_error:
            print(f"  [FAIL] Potential SQLi vulnerability detected with payload: {payload}")
        else:
            print(f"  [PASS] Payload safe: {payload[:20]}... -> HTTP {res.status_code} (No SQL syntax leak)")

def test_xss_input_sanitization():
    print_header("4. Cross-Site Scripting (XSS) / Payload Handling")
    xss_payloads = [
        "<script>alert(1)</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)"
    ]
    
    for payload in xss_payloads:
        # Test endpoint handling XSS payload in query params
        res = requests.get(f"{BASE_URL}/equipment", params={"search": payload})
        
        # Ensure server doesn't execute or return raw unescaped script in response
        if "<script>alert(1)</script>" in res.text:
            print(f"  [WARN] Reflected unescaped script tags detected with: {payload}")
        else:
            print(f"  [PASS] Payload handled safely: {payload} -> HTTP {res.status_code}")

def test_cors_security():
    print_header("5. CORS (Cross-Origin Resource Sharing) Misconfiguration")
    headers = {"Origin": "https://malicious-attacker-website.com"}
    res = requests.get(f"{BASE_URL}/equipment", headers=headers)
    
    allow_origin = res.headers.get("Access-Control-Allow-Origin")
    allow_credentials = res.headers.get("Access-Control-Allow-Credentials")
    
    if allow_origin == "*" and allow_credentials == "true":
        print("  [FAIL] High Risk: CORS allows wildcard origin with credentials!")
    elif allow_origin == "https://malicious-attacker-website.com":
        print(f"  [WARN] Reflected Origin: Allowed arbitrary origin {allow_origin}")
    else:
        print(f"  [PASS] CORS Policy Secure: Access-Control-Allow-Origin = {allow_origin or 'Restricted/None'}")

if __name__ == "__main__":
    print("\nStarting Automated Security Audit for RentaTool Backend API...")
    print(f"Target: {BASE_URL}")
    start_time = time.time()
    
    test_security_headers()
    test_unauthenticated_protected_endpoints()
    test_sqli_resilience()
    test_xss_input_sanitization()
    test_cors_security()
    
    duration = round(time.time() - start_time, 2)
    print(f"\n{'='*70}\n[SECURITY AUDIT COMPLETE] Duration: {duration}s\n{'='*70}\n")
