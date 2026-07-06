"""Test Houzz reparse + commit (checklist + purchase_order) for iteration 60."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://design-burst.preview.emergentagent.com").rstrip("/")
PROJECT_ID = "650e5a59-b510-400a-b271-4d85baae3be3"
SESSION_ESTIMATE = "hz_cgtfil6xyf"  # 7 items estimate
SESSION_FABRIC = "hz_gzl1npa1v3"  # 5 fabric items
APPROVED_DOMAINS_HINT = "visualcomfort"
RETAIL_BLOCKLIST = ["wayfair", "amazon", "houzz.com/product", "target.com", "overstock"]


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Reparse estimate ----------------
def test_reparse_estimate_session(api):
    r = api.post(f"{BASE_URL}/api/houzz/reparse/{SESSION_ESTIMATE}", timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    print("ESTIMATE keys:", list(data.keys()))
    items = data.get("items") or data.get("parsed_items") or []
    assert len(items) == 7, f"Expected 7 items, got {len(items)}: {items}"

    # Locate Milton Road Pendant
    milton = next((i for i in items if "Milton Road" in (i.get("name") or "")), None)
    assert milton, f"Milton Road Pendant missing. Items: {[i.get('name') for i in items]}"
    assert milton.get("sku") == "TOB5158", milton
    assert (milton.get("brand") or "").lower().startswith("visual comfort"), milton
    mlink = milton.get("manufacturer_link") or ""
    assert "visualcomfort" in mlink.lower(), f"link={mlink}"

    # Medium Pendant qty=2, unit=2599
    med = next((i for i in items if "Medium Pendant" in (i.get("name") or "")), None)
    assert med, "Medium Pendant missing"
    assert float(med.get("quantity")) == 2.0, med
    assert float(med.get("unit_price") or med.get("unit_cost") or 0) == 2599.0, med

    # Swivel Chair qty=8
    sw = next((i for i in items if "Swivel Chair" in (i.get("name") or "")), None)
    assert sw, "Swivel Chair missing"
    assert float(sw.get("quantity")) == 8.0, sw

    # rooms include SCULLERY and MAN CAVE
    rooms = {(i.get("room_name") or "").upper() for i in items}
    assert "SCULLERY" in rooms, rooms
    assert "MAN CAVE" in rooms, rooms

    # proposal metadata
    proposal_no = data.get("proposal_number") or data.get("proposal", {}).get("number")
    assert proposal_no == "ES-400220", data

    # totals - accept via items or summary
    subtotal = data.get("subtotal") or data.get("proposal", {}).get("subtotal")
    total = data.get("total") or data.get("proposal", {}).get("total")
    assert abs(float(subtotal) - 116563.06) < 0.5, subtotal
    assert abs(float(total) - 124722.46) < 0.5, total


# ---------------- Reparse fabric (unapproved brand) ----------------
def test_reparse_fabric_session_kasmir_no_retail(api):
    r = api.post(f"{BASE_URL}/api/houzz/reparse/{SESSION_FABRIC}", timeout=90)
    assert r.status_code == 200, r.text
    data = r.json()
    items = data.get("items") or data.get("parsed_items") or []
    assert len(items) == 5, f"Expected 5 items, got {len(items)}"

    qtys = [float(i.get("quantity") or 0) for i in items]
    assert sorted(qtys) == sorted([7.0, 26.0, 11.0, 11.0, 17.0]), qtys

    for it in items:
        brand = (it.get("brand") or "").lower()
        assert "kasmir" in brand, it
        link = (it.get("manufacturer_link") or "").lower()
        assert link in ("", "none", "null") or link is None, f"unapproved brand should have blank link, got {link}"
        for bad in RETAIL_BLOCKLIST:
            assert bad not in link, f"Retail URL found: {link}"

    rooms = {(i.get("room_name") or "").upper() for i in items}
    for r_name in ["LIVING ROOM", "BAR", "DINING ROOM", "PRIMARY BEDROOM", "LADIES TV ROOM"]:
        assert r_name in rooms, f"Missing room {r_name} in {rooms}"


# ---------------- Commit to checklist + cleanup ----------------
def test_commit_checklist_and_cleanup(api):
    # Ensure re-parsed first
    api.post(f"{BASE_URL}/api/houzz/reparse/{SESSION_FABRIC}", timeout=90)

    commit = api.post(f"{BASE_URL}/api/houzz/commit", json={
        "session_id": SESSION_FABRIC,
        "project_id": PROJECT_ID,
        "target": "checklist",
    }, timeout=90)
    assert commit.status_code == 200, commit.text
    cdata = commit.json()
    assert cdata.get("ok") is True, cdata
    assert cdata.get("count") == 5, cdata
    rooms = cdata.get("rooms") or []
    assert len(rooms) == 5, cdata

    # Verify checklist sheet
    proj = api.get(f"{BASE_URL}/api/projects/{PROJECT_ID}?sheet_type=checklist", timeout=60)
    assert proj.status_code == 200, proj.text
    pdata = proj.json()

    # find HOUZZ IMPORT subcategory with items
    found_items = []
    for room in pdata.get("rooms", []):
        for cat in room.get("categories", []):
            if (cat.get("name") or "").upper() == "FF&E":
                for sub in cat.get("subcategories", []):
                    if (sub.get("name") or "").upper() == "HOUZZ IMPORT":
                        for it in sub.get("items", []):
                            found_items.append((room.get("name"), it))
    assert len(found_items) >= 5, f"Expected checklist items, found {len(found_items)}"

    # Verify no retail URL in link fields
    for rn, it in found_items:
        link = (it.get("link") or "").lower()
        for bad in RETAIL_BLOCKLIST:
            assert bad not in link, f"Retail URL in checklist item {it}"
        assert it.get("vendor") or it.get("brand"), it
        assert it.get("quantity") is not None, it

    # CLEANUP via cleanup endpoint if exists, else manual via mongo shell
    cleanup = api.post(f"{BASE_URL}/api/houzz/cleanup", json={
        "session_id": SESSION_FABRIC,
        "project_id": PROJECT_ID,
        "target": "checklist",
    }, timeout=60)
    print("cleanup response:", cleanup.status_code, cleanup.text[:200])


# ---------------- Commit to PO + cleanup ----------------
def test_commit_po_and_cleanup(api):
    api.post(f"{BASE_URL}/api/houzz/reparse/{SESSION_ESTIMATE}", timeout=90)
    commit = api.post(f"{BASE_URL}/api/houzz/commit", json={
        "session_id": SESSION_ESTIMATE,
        "project_id": PROJECT_ID,
        "target": "purchase_order",
    }, timeout=90)
    assert commit.status_code == 200, commit.text
    cdata = commit.json()
    assert cdata.get("ok") is True, cdata

    pos = api.get(f"{BASE_URL}/api/purchase-orders", timeout=60)
    assert pos.status_code == 200
    po_list = pos.json() if isinstance(pos.json(), list) else pos.json().get("purchase_orders", [])
    matching = [p for p in po_list if (p.get("po_number") or "") == "ES-400220"]
    assert matching, f"PO ES-400220 not found among {len(po_list)} POs"
    po = matching[0]
    line_items = po.get("line_items") or po.get("items") or []
    assert len(line_items) == 7, f"Expected 7 line items, got {len(line_items)}"

    # cleanup
    cleanup = api.post(f"{BASE_URL}/api/houzz/cleanup", json={
        "session_id": SESSION_ESTIMATE,
        "project_id": PROJECT_ID,
        "target": "purchase_order",
    }, timeout=60)
    print("PO cleanup:", cleanup.status_code, cleanup.text[:200])


# ---------------- Regression ----------------
def test_extension_download(api):
    r = api.get(f"{BASE_URL}/api/download/chrome-extension", timeout=60)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("application/zip") or "zip" in r.headers.get("content-type", "").lower()


def test_extension_version(api):
    r = api.get(f"{BASE_URL}/api/extension/version", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data.get("version") == "7.47.0", data


def test_purchase_orders_list(api):
    r = api.get(f"{BASE_URL}/api/purchase-orders", timeout=30)
    assert r.status_code == 200
