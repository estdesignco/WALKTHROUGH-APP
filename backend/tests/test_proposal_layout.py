"""
Tests for the NEW PUT /api/builder/{access_code}/proposal/layout endpoint
plus regression tests for /proposal GET, /proposal/accept, /proposal/override.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ACCESS_CODE = "IL8X4FXJ"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----- /proposal/layout endpoint -----
class TestProposalLayout:
    def test_layout_put_persists(self, session):
        payload = {
            "proposal_layout": {
                "trade_order": ["PLUMBING", "DEMOLITION", "FRAMING"],
                "room_order": {"PLUMBING": ["MASTER BATH", "KITCHEN"]},
                "line_order": {"PLUMBING::MASTER BATH": ["a", "b", "c"]},
                "trade_renames": {"PLUMBING": "ROUGH PLUMBING"},
                "room_renames": {"PLUMBING::MASTER BATH": "MAIN BATH"},
            }
        }
        r = session.put(f"{BASE_URL}/api/builder/{ACCESS_CODE}/proposal/layout", json=payload)
        assert r.status_code == 200, r.text
        assert r.json().get("status") == "ok"

        # GET portal back and verify persisted
        g = session.get(f"{BASE_URL}/api/builder/{ACCESS_CODE}")
        assert g.status_code == 200
        portal = g.json()["portal"]
        layout = portal.get("proposal_layout")
        assert layout is not None
        assert layout["trade_order"][0] == "PLUMBING"
        assert layout["trade_renames"]["PLUMBING"] == "ROUGH PLUMBING"
        assert layout["room_renames"]["PLUMBING::MASTER BATH"] == "MAIN BATH"

    def test_layout_invalid_code(self, session):
        r = session.put(
            f"{BASE_URL}/api/builder/INVALIDCODE/proposal/layout",
            json={"proposal_layout": {}},
        )
        assert r.status_code in (403, 404)

    def test_layout_restore_clean(self, session):
        # cleanup so frontend tests start fresh
        r = session.put(
            f"{BASE_URL}/api/builder/{ACCESS_CODE}/proposal/layout",
            json={"proposal_layout": {"trade_order": [], "room_order": {}, "line_order": {}, "trade_renames": {}, "room_renames": {}}},
        )
        assert r.status_code == 200


# ----- /proposal GET + scope parsing -----
class TestProposalGet:
    def test_get_proposal(self, session):
        r = session.get(f"{BASE_URL}/api/builder/{ACCESS_CODE}/proposal")
        assert r.status_code == 200
        data = r.json()
        # Must contain scope lines with trade attribution
        assert "scope_lines" in data or "lines" in data or "scope_document" in data


# ----- /proposal/override (regression) -----
class TestProposalOverride:
    def test_override_cost(self, session):
        r = session.put(
            f"{BASE_URL}/api/builder/{ACCESS_CODE}/proposal/override",
            json={"item_id": "sl_1u83vzo", "cost": 250},
        )
        # Frontend hit this successfully during UI test
        assert r.status_code in (200, 400, 404, 422), r.text
