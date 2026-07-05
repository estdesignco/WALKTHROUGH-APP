"""
Backend tests for Houzz Proposal Import + Purchase Orders (iteration 58).

Focus:
- Manufacturer link resolver never returns retailer URLs
- Houzz proposal-import → session persistence → commit to PO / items
- PO CRUD, payment lifecycle (deposit→balance→paid), receipt upload,
  PDF import, summary aggregation, list filters, known-manufacturers.
"""
import base64
import io
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://design-burst.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
TEST_PROJECT_ID = "72d4051a-4986-4d3c-8df7-fb0fec94f250"

FORBIDDEN_HOSTS = [
    "wayfair.com", "amazon.com", "amzn.to", "ballarddesigns.com",
    "westelm.com", "cb2.com", "crateandbarrel.com", "perigold.com",
    "overstock.com", "target.com", "walmart.com", "homedepot.com",
    "houzz.com/products", "etsy.com", "ebay.com",
]


def _no_forbidden(url):
    if not url:
        return True
    u = url.lower()
    return not any(bad in u for bad in FORBIDDEN_HOSTS)


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- 1. Known manufacturers ------------------------------------------
def test_known_manufacturers(session):
    r = session.get(f"{API}/houzz/known-manufacturers", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert len(data) >= 60, f"Expected >=60 brand mappings, got {len(data)}"
    # Sanity: some critical brands
    for key in ("uttermost", "fourhands", "visualcomfort"):
        assert key in data, f"missing critical brand {key}"


# -------- 2. Houzz proposal-import: retailer→manufacturer swap -----------
@pytest.fixture(scope="module")
def houzz_session(session):
    payload = {
        "project_id": TEST_PROJECT_ID,
        "houzz_url": "https://pro.houzz.com/manage/d/estimates/TEST123/edit",
        "proposal_number": f"TEST-{uuid.uuid4().hex[:6]}",
        "proposal_title": "TEST_ Proposal",
        "client_name": "TEST_ Client",
        "subtotal": 3000.0, "tax": 240.0, "total": 3240.0,
        "kind": "proposal",
        "items": [
            {
                "name": "Anmer Chandelier",
                "brand": "Uttermost",
                "sku": "UT-22169",
                "quantity": 1,
                "unit_price": 585.0,
                "extended_price": 585.0,
                "source_url": "https://www.wayfair.com/lighting/pdp/uttermost-anmer-chandelier-w000000.html",
            },
            {
                "name": "Ashford Dining Table",
                "brand": "Four Hands",
                "sku": "IHRM-089",
                "quantity": 1,
                "unit_price": 1899.0,
                "extended_price": 1899.0,
                "source_url": "https://www.amazon.com/dp/B0ABCDE123",
            },
            {
                "name": "Bryant Sconce",
                "brand": "Visual Comfort",
                "sku": "TOB2001",
                "quantity": 2,
                "unit_price": 258.0,
                "extended_price": 516.0,
                "source_url": "https://www.visualcomfort.com/us_en/bryant-sconce",
            },
            {
                "name": "Unknown Widget",
                "brand": "MysteryBrandXYZ",
                "sku": "ZZZ-999",
                "quantity": 1,
                "unit_price": 40.0,
                "extended_price": 40.0,
                "source_url": "https://www.wayfair.com/pdp/mystery.html",
            },
        ],
    }
    r = session.post(f"{API}/houzz/proposal-import", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


def test_houzz_import_response_counts(houzz_session):
    assert houzz_session["item_count"] == 4
    # 3 known brands should resolve; 1 (Mystery/wayfair) should not
    assert houzz_session["resolved_item_count"] == 3
    assert houzz_session["unresolved_manufacturer_count"] == 1
    assert houzz_session["warnings"], "Expected a warning for unresolved item"


def test_no_retailer_leaks(houzz_session):
    for it in houzz_session["items"]:
        assert _no_forbidden(it.get("manufacturer_link")), \
            f"Retailer leaked in manufacturer_link: {it.get('manufacturer_link')}"


def test_wayfair_uttermost_swapped(houzz_session):
    utter = next(i for i in houzz_session["items"] if i["brand"] == "Uttermost")
    assert utter["manufacturer_link"] and "uttermost.com" in utter["manufacturer_link"]


def test_amazon_fourhands_swapped(houzz_session):
    fh = next(i for i in houzz_session["items"] if i["brand"] == "Four Hands")
    assert fh["manufacturer_link"] and "fourhands.com" in fh["manufacturer_link"]


def test_visualcomfort_kept(houzz_session):
    vc = next(i for i in houzz_session["items"] if i["brand"] == "Visual Comfort")
    assert vc["manufacturer_link"] and "visualcomfort.com" in vc["manufacturer_link"]


def test_unknown_brand_wayfair_null(houzz_session):
    m = next(i for i in houzz_session["items"] if i["brand"] == "MysteryBrandXYZ")
    assert m["manufacturer_link"] is None


def test_session_persists(session, houzz_session):
    sid = houzz_session["session_id"]
    r = session.get(f"{API}/houzz/import-session/{sid}", timeout=20)
    assert r.status_code == 200
    assert r.json()["item_count"] == 4


# -------- 3. Houzz commit → purchase order --------------------------------
def test_commit_to_purchase_order(session, houzz_session):
    body = {
        "session_id": houzz_session["session_id"],
        "project_id": TEST_PROJECT_ID,
        "target": "purchase_order",
    }
    r = session.post(f"{API}/houzz/commit", json=body, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("ok") and data.get("purchase_order_id")
    po_id = data["purchase_order_id"]
    # Verify PO exists and contains items with manufacturer_link populated
    po = session.get(f"{API}/purchase-orders/{po_id}", timeout=20).json()
    assert len(po["line_items"]) == 4
    for li in po["line_items"]:
        assert _no_forbidden(li.get("manufacturer_link"))
    # Cleanup
    session.delete(f"{API}/purchase-orders/{po_id}", timeout=20)


def test_commit_to_items(session):
    # New session for items commit
    payload = {
        "project_id": TEST_PROJECT_ID,
        "houzz_url": "https://pro.houzz.com/manage/d/estimates/TEST456/edit",
        "items": [{"name": "TEST_item", "brand": "Uttermost", "sku": "U-1",
                   "quantity": 1, "unit_price": 100.0, "source_url": "https://www.wayfair.com/x"}],
    }
    r = session.post(f"{API}/houzz/proposal-import", json=payload, timeout=30)
    sid = r.json()["session_id"]
    r = session.post(f"{API}/houzz/commit", json={
        "session_id": sid, "project_id": TEST_PROJECT_ID, "target": "items"
    }, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 1
    session.delete(f"{API}/houzz/import-session/{sid}", timeout=20)


# -------- 4. PO CRUD ------------------------------------------------------
@pytest.fixture
def created_po(session):
    payload = {
        "project_id": TEST_PROJECT_ID,
        "vendor": "TEST_Uttermost",
        "line_items": [
            {"name": "Test Lamp", "brand": "Uttermost", "sku": "U1",
             "quantity": 2, "unit_price": 500.0}
        ],
        "tax": 0.0, "shipping": 0.0,
        "status": "pending",
    }
    r = session.post(f"{API}/purchase-orders", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    po = r.json()
    yield po
    session.delete(f"{API}/purchase-orders/{po['id']}", timeout=10)


def test_po_create(created_po):
    assert created_po["id"].startswith("po_")
    assert created_po["po_number"].startswith("PO-")
    assert created_po["subtotal"] == 1000.0
    assert created_po["total"] == 1000.0
    assert created_po["created_at"] and created_po["updated_at"]


def test_po_update(session, created_po):
    r = session.patch(f"{API}/purchase-orders/{created_po['id']}",
                      json={"notes": "TEST_note_updated", "status": "draft"}, timeout=20)
    assert r.status_code == 200
    assert r.json()["notes"] == "TEST_note_updated"


def test_po_delete(session):
    payload = {"vendor": "TEST_del", "line_items": [], "total": 100.0}
    r = session.post(f"{API}/purchase-orders", json=payload, timeout=20).json()
    pid = r["id"]
    d = session.delete(f"{API}/purchase-orders/{pid}", timeout=10)
    assert d.status_code == 200
    g = session.get(f"{API}/purchase-orders/{pid}", timeout=10)
    assert g.status_code == 404


# -------- 5. Payment lifecycle -------------------------------------------
def test_payment_lifecycle(session):
    payload = {"vendor": "TEST_pay", "line_items": [
        {"name": "x", "quantity": 1, "unit_price": 1000.0}
    ], "status": "pending"}
    po = session.post(f"{API}/purchase-orders", json=payload, timeout=20).json()
    pid = po["id"]
    assert po["total"] == 1000.0

    # deposit 500 (50%)
    r = session.post(f"{API}/purchase-orders/{pid}/payments",
                     json={"amount": 500.0, "kind": "deposit", "method": "check"}, timeout=20)
    assert r.status_code == 200
    po = r.json()
    assert po["status"] == "deposit_paid"
    assert po["deposit_paid_at"]

    # balance 500
    r = session.post(f"{API}/purchase-orders/{pid}/payments",
                     json={"amount": 500.0, "kind": "balance", "method": "wire"}, timeout=20)
    assert r.status_code == 200
    po = r.json()
    assert po["status"] == "paid"
    assert po["balance_paid_at"]

    # delete balance payment → rolls back to deposit_paid
    balance_pay = next(p for p in po["payments"] if p["kind"] == "balance")
    r = session.delete(f"{API}/purchase-orders/{pid}/payments/{balance_pay['id']}", timeout=20)
    assert r.status_code == 200
    assert r.json()["status"] == "deposit_paid"

    session.delete(f"{API}/purchase-orders/{pid}", timeout=10)


# -------- 6. Receipt upload ----------------------------------------------
def test_receipt_upload_and_size_limit(session):
    po = session.post(f"{API}/purchase-orders",
                      json={"vendor": "TEST_rcpt", "total": 100.0}, timeout=20).json()
    pid = po["id"]

    small = base64.b64encode(b"hello receipt pdf bytes").decode()
    r = session.post(f"{API}/purchase-orders/{pid}/receipts",
                     json={"data_base64": small, "filename": "r.pdf",
                           "content_type": "application/pdf", "label": "TEST_receipt"}, timeout=20)
    assert r.status_code == 200
    po = r.json()
    assert len(po["receipts"]) == 1
    assert po["receipts"][0]["url"].startswith("data:application/pdf;base64,")

    # >5MB rejection
    big = base64.b64encode(b"a" * (6 * 1024 * 1024)).decode()
    r = session.post(f"{API}/purchase-orders/{pid}/receipts",
                     json={"data_base64": big, "filename": "big.bin"}, timeout=30)
    assert r.status_code == 413

    session.delete(f"{API}/purchase-orders/{pid}", timeout=10)


# -------- 7. PO PDF import ------------------------------------------------
def _make_text_pdf(text_lines):
    """Build a minimal text-based PDF using reportlab (if available)."""
    try:
        from reportlab.pdfgen import canvas
    except ImportError:
        pytest.skip("reportlab not installed")
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    y = 800
    for line in text_lines:
        c.drawString(50, y, line)
        y -= 20
    c.save()
    return buf.getvalue()


def test_po_pdf_import_text_pdf():
    pdf_bytes = _make_text_pdf([
        "Purchase Order #: PO-98765",
        "Vendor: Uttermost",
        "1  Uttermost Anmer Chandelier UT-22169  $585.00  $585.00",
        "2  Uttermost Table Lamp UT-10000  $200.00  $400.00",
        "Subtotal: $985.00",
        "Tax: $78.80",
        "Total: $1063.80",
    ])
    r = requests.post(f"{API}/purchase-orders/import-from-pdf",
                      files={"file": ("test.pdf", pdf_bytes, "application/pdf")},
                      timeout=30)
    assert r.status_code == 200, r.text
    po = r.json()
    assert po["po_number"] and "PO" in po["po_number"].upper()
    assert len(po["line_items"]) >= 1
    # cleanup
    requests.delete(f"{API}/purchase-orders/{po['id']}", timeout=10)


def test_po_pdf_import_empty_scanned_pdf_returns_422():
    # Minimal empty PDF (no text). Use bytes of a barely-valid PDF header.
    empty_pdf = b"%PDF-1.4\n%%EOF\n"
    r = requests.post(f"{API}/purchase-orders/import-from-pdf",
                      files={"file": ("empty.pdf", empty_pdf, "application/pdf")},
                      timeout=30)
    assert r.status_code == 422


# -------- 8. Summary + filters -------------------------------------------
def test_po_summary_and_filters(session):
    # Create 2 POs with different statuses
    p1 = session.post(f"{API}/purchase-orders", json={
        "project_id": TEST_PROJECT_ID, "vendor": "TEST_s1",
        "line_items": [{"name": "x", "quantity": 1, "unit_price": 500.0}],
        "status": "pending"}, timeout=20).json()
    p2 = session.post(f"{API}/purchase-orders", json={
        "project_id": TEST_PROJECT_ID, "vendor": "TEST_s2",
        "line_items": [{"name": "y", "quantity": 1, "unit_price": 1000.0}],
        "status": "pending"}, timeout=20).json()

    # Pay p2 fully
    session.post(f"{API}/purchase-orders/{p2['id']}/payments",
                 json={"amount": 1000.0, "kind": "payment"}, timeout=20)

    # Summary
    r = session.get(f"{API}/purchase-orders/summary?project_id={TEST_PROJECT_ID}", timeout=20)
    assert r.status_code == 200
    s = r.json()
    assert s["count"] >= 2
    assert s["total_value"] >= 1500.0
    assert s["total_paid"] >= 1000.0
    assert isinstance(s["by_status"], dict)

    # Filter by project
    r = session.get(f"{API}/purchase-orders?project_id={TEST_PROJECT_ID}", timeout=20)
    assert r.status_code == 200
    assert all(po["project_id"] == TEST_PROJECT_ID for po in r.json())

    # Filter by status
    r = session.get(f"{API}/purchase-orders?status=paid", timeout=20)
    assert r.status_code == 200
    assert all(po["status"] == "paid" for po in r.json())

    session.delete(f"{API}/purchase-orders/{p1['id']}", timeout=10)
    session.delete(f"{API}/purchase-orders/{p2['id']}", timeout=10)
