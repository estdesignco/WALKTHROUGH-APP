"""
E2E backend tests for:
- /api/vendor-portals endpoints (config, credentials, login-status, export/import)
- /api/ai-assist/ingest-pdf and /api/ai-assist/push-items
"""
import base64
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://design-preview-131.preview.emergentagent.com").rstrip("/")
PROJECT_ID = "72d4051a-4986-4d3c-8df7-fb0fec94f250"  # Wheeler Ridge (real id; test_credentials.md had stale id)
ROOM_NAME = "Master Bathroom"
VENDOR_KEY = "loloi"
TEST_USER = "test@example.com"
TEST_PASS = "TestPass123!"
PDF_PATH = "/tmp/diehl.pdf"

EXPECTED_VENDORS = {
    "four_hands", "uttermost", "bernhardt", "rowe", "loloi", "visual_comfort",
    "hvl_group", "gabby", "bassett_mirror", "surya", "safavieh", "regina_andrew", "global_views",
}


# Module-level state to share across tests
_state = {}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# === Test 1: list portals ===
def test_list_vendor_portals(session):
    r = session.get(f"{BASE_URL}/api/vendor-portals", timeout=30)
    assert r.status_code == 200, f"{r.status_code} {r.text[:200]}"
    data = r.json()
    # Tolerant of either shape: list or {vendors: [...]}
    items = data.get("vendors") or data.get("portals") or data if isinstance(data, list) else data.get("vendors", [])
    if isinstance(data, dict) and not items:
        # Try common keys
        for k in ("vendors", "portals", "items", "data"):
            if k in data and isinstance(data[k], list):
                items = data[k]
                break
    keys = set()
    for it in items:
        k = it.get("key") or it.get("vendor_key") or it.get("id") or it.get("slug")
        if k:
            keys.add(k)
    missing = EXPECTED_VENDORS - keys
    assert not missing, f"Missing vendor keys: {missing}. Got: {keys}"
    assert len(keys) >= 13


# === Test 2: save credential + verify encryption ===
def test_save_credentials_and_encryption(session):
    r = session.post(
        f"{BASE_URL}/api/vendor-portals/{VENDOR_KEY}/credentials",
        json={"username": TEST_USER, "password": TEST_PASS},
        timeout=30,
    )
    assert r.status_code == 200, f"{r.status_code} {r.text[:300]}"
    _state["save_response"] = r.json()

    # Verify via saved-credentials list
    r2 = session.get(f"{BASE_URL}/api/vendor-portals/saved-credentials", timeout=30)
    assert r2.status_code == 200
    saved = r2.json()
    items = saved if isinstance(saved, list) else (saved.get("credentials") or saved.get("vendors") or saved.get("saved") or [])
    found = False
    for it in items:
        k = it.get("vendor_key") or it.get("key")
        if k == VENDOR_KEY:
            found = True
            # Ensure plaintext password NOT returned
            for field in ("password", "plaintext", "password_plain"):
                assert field not in it or not it.get(field), f"Plaintext leak: {it}"
            break
    assert found, f"Saved {VENDOR_KEY} not found in saved-credentials: {saved}"

    # Verify Fernet encryption directly in MongoDB
    try:
        from pymongo import MongoClient
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "interior_design_db")
        client = MongoClient(mongo_url)
        doc = client[db_name].vendor_credentials.find_one({"vendor_key": VENDOR_KEY})
        assert doc is not None, "Doc missing in vendor_credentials"
        enc = doc.get("password_encrypted") or doc.get("encrypted_password") or ""
        assert enc.startswith("gAAAAA"), f"Not Fernet-encrypted: {enc[:20]}"
    except ImportError:
        pytest.skip("pymongo not available")


# === Test 3: login-status payload ===
def test_login_status(session):
    r = session.get(f"{BASE_URL}/api/vendor-portals/login-status", timeout=30)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    assert "success" in data
    assert "vendors" in data
    assert "logged_in_count" in data
    assert isinstance(data["vendors"], list)


# === Test 5: export/import (idempotent) ===
def test_export_import_credentials(session):
    r = session.get(f"{BASE_URL}/api/vendor-portals/credentials/export", timeout=30)
    assert r.status_code == 200, r.text[:300]
    payload = r.json()
    assert "fingerprint" in payload, f"No fingerprint: {payload}"
    _state["export"] = payload

    r2 = session.post(
        f"{BASE_URL}/api/vendor-portals/credentials/import",
        json={**payload, "overwrite": True},
        timeout=30,
    )
    assert r2.status_code == 200, r2.text[:300]


# === Test 6: ai-assist ingest-pdf ===
@pytest.mark.timeout(240)
def test_ai_assist_ingest_pdf(session):
    with open(PDF_PATH, "rb") as f:
        pdf_b64 = base64.b64encode(f.read()).decode()

    body = {
        "project_id": PROJECT_ID,
        "room_name": ROOM_NAME,
        "sheet_type": "checklist",
        "pdf_base64": pdf_b64,
        "filename": "diehl.pdf",
    }
    r = session.post(f"{BASE_URL}/api/ai-assist/ingest-pdf", json=body, timeout=300)
    assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
    data = r.json()
    # Required fields
    for key in ("room_name", "sheet_type", "detected_items"):
        assert key in data, f"Missing {key}: keys={list(data.keys())}"
    # Tolerant - some may be optional
    assert isinstance(data.get("detected_items"), list)
    assert len(data["detected_items"]) > 0, f"No items detected: {data}"
    _state["detected_items"] = data["detected_items"]
    print(f"DETECTED {len(data['detected_items'])} items")


# === Test 7: push-items ===
def test_push_items(session):
    items = _state.get("detected_items")
    if not items:
        pytest.skip("No detected items from previous test")
    body = {
        "project_id": PROJECT_ID,
        "room_name": ROOM_NAME,
        "sheet_type": "checklist",
        "items": items,
    }
    r = session.post(f"{BASE_URL}/api/ai-assist/push-items", json=body, timeout=120)
    assert r.status_code == 200, f"{r.status_code} {r.text[:500]}"
    data = r.json()
    # Expect some indication of created/exists
    results = data.get("results") or data.get("items") or []
    text = str(data).lower()
    assert ("created" in text) or ("exists" in text) or len(results) > 0, f"No created/exists: {data}"


# === Test 4: DELETE credential (run LAST to clean up) ===
def test_zz_delete_credentials(session):
    r = session.delete(f"{BASE_URL}/api/vendor-portals/{VENDOR_KEY}/credentials", timeout=30)
    assert r.status_code in (200, 204), f"{r.status_code} {r.text[:200]}"

    r2 = session.get(f"{BASE_URL}/api/vendor-portals/saved-credentials", timeout=30)
    assert r2.status_code == 200
    saved = r2.json()
    items = saved if isinstance(saved, list) else (saved.get("credentials") or saved.get("vendors") or saved.get("saved") or [])
    for it in items:
        k = it.get("vendor_key") or it.get("key")
        assert k != VENDOR_KEY, f"Credential still present after delete: {it}"
