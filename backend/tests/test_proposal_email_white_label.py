"""Backend tests for the new white-label proposal email + customer accept flow.

Covers:
 - Company profile EMAIL SETUP save/load encryption (smtp_password_enc not exposed,
   smtp_password_set flag returned).
 - POST /test-email with fake SMTP creds returns a clean 502 (not 500).
 - POST /send-email with fake SMTP creds returns a clean 502 (not 500).
 - GET /customer-proposal/{code}/{bad_token} → 403.
 - GET /customer-proposal/{code}/{valid_token} → 200 with payload.
 - POST /customer-proposal/{code}/{valid_token}/accept → portal flagged customer_accepted=True.

Performs full cleanup at the end so the JXQ8EYEQ portal is restored to original shape.
"""
import os
import base64
import pytest
import requests
import asyncio
import motor.motor_asyncio

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://design-burst.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
CODE = "JXQ8EYEQ"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "interior_design_db")

TEST_TOKEN = "TESTTOKEN_PYTEST"

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s

@pytest.fixture(scope="module")
def loop():
    return asyncio.new_event_loop()

@pytest.fixture(scope="module")
def db(loop):
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


async def _set_token(db, token):
    await db.builder_portals.update_one(
        {"access_code": CODE},
        {"$set": {"customer_accept_token": token}},
    )

async def _cleanup(db):
    unset = {
        "customer_accept_token": "",
        "customer_accept_sent_to": "",
        "customer_accept_sent_at": "",
        "customer_accepted": "",
        "customer_accepted_at": "",
        "customer_accepted_signature": "",
        "customer_accepted_email": "",
    }
    await db.builder_portals.update_one({"access_code": CODE}, {"$unset": unset})
    await db.company_profiles.update_one(
        {"access_code": CODE},
        {"$unset": {
            "email_provider": "", "email_from_name": "", "email_from_address": "",
            "email_reply_to": "", "resend_api_key_enc": "",
            "smtp_host": "", "smtp_port": "", "smtp_username": "",
            "smtp_password_enc": "", "smtp_use_tls": "",
        }}
    )


# ------------------------------------------------------------------
# Tests
# ------------------------------------------------------------------
class TestCompanyEmailConfig:
    def test_portal_exists(self, session):
        r = session.get(f"{API}/builder/{CODE}")
        assert r.status_code == 200, r.text
        portal = r.json().get("portal") or {}
        assert portal.get("access_code") == CODE

    def test_save_email_config(self, session):
        payload = {
            "company_name": "Wheeler",
            "email_provider": "gmail",
            "email_from_name": "Test Builder",
            "email_from_address": "test@example.com",
            "email_reply_to": "",
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_username": "test@example.com",
            "smtp_password_enc": "fake-app-password",   # plaintext on the way in; encrypted on server
            "smtp_use_tls": True,
        }
        r = session.put(f"{API}/builder/{CODE}/company", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("smtp_password_set") is True
        # Plaintext / ciphertext MUST NOT leak.
        assert "smtp_password_enc" not in data
        assert data.get("email_provider") == "gmail"
        assert data.get("smtp_host") == "smtp.gmail.com"

    def test_get_company_profile_hides_cipher(self, session):
        r = session.get(f"{API}/builder/{CODE}/company")
        assert r.status_code == 200
        data = r.json()
        assert "smtp_password_enc" not in data
        assert data.get("smtp_password_set") is True


class TestEmailSendingFailsGracefully:
    def test_test_email_clean_error(self, session):
        r = session.post(
            f"{API}/builder/{CODE}/proposal/test-email",
            json={"to_email": "me@test.example"},
        )
        # Should be a clean 502 (mapped) — NEVER a 500 with stack trace.
        assert r.status_code in (400, 502), r.text
        body = r.json()
        # FastAPI default error key is `detail`.
        msg = (body.get("detail") or body.get("message") or "").lower()
        assert "smtp" in msg or "auth" in msg or "credentials" in msg or "failed" in msg, body

    def test_send_email_clean_error(self, session):
        # Minimal valid base64 PDF stub.
        fake_pdf_b64 = base64.b64encode(b"%PDF-1.4 stub").decode()
        r = session.post(
            f"{API}/builder/{CODE}/proposal/send-email",
            json={
                "to_email": "demo@test.com",
                "to_name": "Demo Client",
                "cc_emails": [],
                "subject": "Your proposal for Wheeler Ridge Residence",
                "message": "Please review.",
                "pdf_base64": fake_pdf_b64,
                "pdf_filename": "proposal.pdf",
                "include_accept_link": True,
            },
        )
        assert r.status_code in (400, 502), r.text
        body = r.json()
        msg = (body.get("detail") or body.get("message") or "").lower()
        assert any(k in msg for k in ("smtp", "auth", "credentials", "failed")), body


class TestCustomerProposalPage:
    def test_bad_token_403(self, session):
        r = session.get(f"{API}/customer-proposal/{CODE}/INVALIDTOKEN")
        assert r.status_code == 403, r.text

    def test_valid_token_returns_payload(self, session, db, loop):
        loop.run_until_complete(_set_token(db, TEST_TOKEN))
        r = session.get(f"{API}/customer-proposal/{CODE}/{TEST_TOKEN}")
        assert r.status_code == 200, r.text
        data = r.json()
        # The proposal payload shape — must contain a portal/project hint.
        assert "company" in data or "portal" in data or "project" in data
        # Ensure credentials are stripped from the company section.
        company = data.get("company") or {}
        assert "smtp_password_enc" not in company
        assert "resend_api_key_enc" not in company

    def test_accept_without_signature_rejected(self, session):
        r = session.post(
            f"{API}/customer-proposal/{CODE}/{TEST_TOKEN}/accept",
            json={"signature": "   "},
        )
        assert r.status_code == 400, r.text

    def test_accept_with_signature_persists(self, session, db, loop):
        r = session.post(
            f"{API}/customer-proposal/{CODE}/{TEST_TOKEN}/accept",
            json={"signature": "Jane Homeowner", "accepted_by_email": "jane@test.example"},
        )
        assert r.status_code == 200, r.text
        # Verify persistence directly in Mongo.
        doc = loop.run_until_complete(
            db.builder_portals.find_one({"access_code": CODE}, {"_id": 0})
        )
        assert doc.get("customer_accepted") is True
        assert doc.get("customer_accepted_signature") == "Jane Homeowner"


# ------------------------------------------------------------------
# Module-scope teardown — wipe all test pollution.
# ------------------------------------------------------------------
@pytest.fixture(scope="module", autouse=True)
def _final_cleanup(db, loop):
    yield
    loop.run_until_complete(_cleanup(db))
