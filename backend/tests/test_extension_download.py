"""Tests for Chrome Extension download endpoints (P0 fix for scraper visibility)."""
import os
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to reading from frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

MANIFEST_PATH = "/app/chrome-extension-scraper/manifest.json"


def _manifest_version():
    with open(MANIFEST_PATH) as f:
        return json.load(f)["version"]


class TestExtensionVersion:
    def test_version_endpoint_matches_manifest(self):
        r = requests.get(f"{BASE_URL}/api/extension/version", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        expected_version = _manifest_version()
        assert data["version"] == expected_version, f"expected {expected_version}, got {data}"
        assert data["download_url"] == "/api/download/chrome-extension"
        assert "filename" in data and expected_version in data["filename"]
        assert "description" in data

    def test_version_in_sync_with_manifest_edit(self):
        """Edit manifest to temp value, hit endpoint, then restore."""
        with open(MANIFEST_PATH) as f:
            original = f.read()
        try:
            mutated = json.loads(original)
            original_v = mutated["version"]
            mutated["version"] = "9.99.9"
            with open(MANIFEST_PATH, "w") as f:
                json.dump(mutated, f, indent=2)
            r = requests.get(f"{BASE_URL}/api/extension/version", timeout=30)
            assert r.status_code == 200
            assert r.json()["version"] == "9.99.9", "endpoint must reflect manifest changes"
        finally:
            with open(MANIFEST_PATH, "w") as f:
                f.write(original)
            # sanity restore
            r = requests.get(f"{BASE_URL}/api/extension/version", timeout=30)
            assert r.json()["version"] == original_v


class TestExtensionDownload:
    def test_download_chrome_extension(self):
        r = requests.get(f"{BASE_URL}/api/download/chrome-extension", timeout=60)
        assert r.status_code == 200
        assert "application/zip" in r.headers.get("Content-Type", "").lower()
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd.lower(), f"missing attachment in {cd}"
        assert "v7.47" in cd, f"missing v7.47 in filename: {cd}"
        # ~54700 bytes expected
        assert len(r.content) > 10_000, f"zip too small: {len(r.content)}"
        # zip magic
        assert r.content[:2] == b"PK", "not a valid zip"

    def test_legacy_download_scraper_alias(self):
        r = requests.get(f"{BASE_URL}/api/download-scraper", timeout=60)
        assert r.status_code == 200
        assert "application/zip" in r.headers.get("Content-Type", "").lower()
        assert r.content[:2] == b"PK"


class TestRegression:
    def test_projects_list(self):
        r = requests.get(f"{BASE_URL}/api/projects", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_purchase_orders_summary_unknown_project(self):
        r = requests.get(
            f"{BASE_URL}/api/purchase-orders/summary",
            params={"project_id": "00000000-0000-0000-0000-000000000000"},
            timeout=30,
        )
        # Must not 500; may return empty dict / 200 / 404
        assert r.status_code != 500, r.text
