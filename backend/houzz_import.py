"""
Houzz Proposal / Estimate Importer
==================================

Endpoints for pulling Houzz Pro proposals and estimates INTO the app.

Because Houzz Pro dashboards are auth-walled (`pro.houzz.com/manage/d/...`),
our Python backend can't fetch them directly. Instead we:
    1. Frontend triggers the Chrome Extension to open the Houzz URL in a
       coordinator window (extension runs inside the user's logged-in tab).
    2. Extension scrapes the line items and POSTs them here.
    3. This router de-dupes, resolves manufacturer links, and either creates
       items in a project or a Purchase Order.

Fallback path: user uploads a Houzz proposal PDF, we parse text with PyPDF2 /
pdfplumber, extract structured line items.
"""

from __future__ import annotations

import io
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from manufacturer_resolver import resolve_manufacturer_link, is_known_manufacturer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/houzz", tags=["Houzz Import"])

# Shared DB handle. server.py calls `set_db(db)` after startup.
_db: Optional[AsyncIOMotorDatabase] = None


def set_db(db: AsyncIOMotorDatabase) -> None:
    global _db
    _db = db


def _get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise HTTPException(status_code=500, detail="Houzz importer DB not initialized")
    return _db


# ============================================================================
# MODELS
# ============================================================================
class HouzzLineItem(BaseModel):
    """One line item scraped from a Houzz proposal/estimate row."""
    name: Optional[str] = None
    brand: Optional[str] = None            # aka manufacturer as printed on Houzz
    sku: Optional[str] = None              # manufacturer SKU / model #
    description: Optional[str] = None
    category: Optional[str] = None         # eg "Lighting", "Rug"
    quantity: Optional[float] = 1
    unit_cost: Optional[float] = None      # our cost from vendor
    unit_price: Optional[float] = None     # client-facing price
    extended_price: Optional[float] = None
    dimensions: Optional[str] = None
    finish_color: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None       # link as shown on Houzz (may be retailer)
    houzz_item_id: Optional[str] = None    # dom-scraped stable id if available
    notes: Optional[str] = None
    # Houzz vt-table structure fields
    room_name: Optional[str] = None        # from group header row OR "Room:" extra-info OR Add Room input
    unit_type: Optional[str] = None        # "Yards", "Each", …
    materials: Optional[str] = None        # "100% Polyester, …"
    row_number: Optional[str] = None       # Houzz auto-number, eg "1.4"
    parent_name: Optional[str] = None      # parent line name when this row is a component (eg drape spec)


class HouzzProposalPayload(BaseModel):
    """Payload posted by the Chrome extension after scraping a Houzz page."""
    project_id: Optional[str] = None       # if provided, items go straight into this project
    houzz_url: str                         # the estimate/proposal URL
    proposal_number: Optional[str] = None
    proposal_title: Optional[str] = None
    client_name: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    items: List[HouzzLineItem] = Field(default_factory=list)
    # Extension flags
    kind: str = "proposal"                 # "proposal" | "estimate" | "po"
    scraped_at: Optional[str] = None
    session_id: Optional[str] = None       # for polling


class HouzzImportSessionResponse(BaseModel):
    session_id: str
    kind: str
    houzz_url: str
    item_count: int
    resolved_item_count: int
    unresolved_manufacturer_count: int
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    proposal_number: Optional[str] = None
    proposal_title: Optional[str] = None
    client_name: Optional[str] = None
    items: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    created_at: str


# ============================================================================
# HELPERS
# ============================================================================
def _price_from_text(txt: Optional[str]) -> Optional[float]:
    if not txt:
        return None
    m = re.search(r"[-+]?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)", str(txt))
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", ""))
    except ValueError:
        return None


def _dedupe_and_validate(items: List["HouzzLineItem"]) -> List["HouzzLineItem"]:
    """Backend safety net: drop placeholder / totals / truly-empty / duplicate rows.

    IMPORTANT: we deliberately do NOT drop rows because qty * unit_price
    doesn't equal extended_price. Houzz line items frequently have a
    material-cost unit (eg 7 Yards @ $33 material cost -> $231 line total)
    where the math is intentionally different. The old math check silently
    deleted the user's real items.
    """
    def fill_count(it: "HouzzLineItem") -> int:
        return sum(1 for v in it.model_dump().values() if v not in (None, "", 0))

    placeholder_re = re.compile(r"^\s*item(?:\s+\d+)?\s*$", re.I)
    totals_re = re.compile(
        r"^\s*(subtotal|total|tax|shipping|grand\s*total|deposit|balance|amount\s*due|amount\s*paid|balance\s*due)\s*$",
        re.I,
    )

    seen: Dict[str, "HouzzLineItem"] = {}
    for it in items:
        name = (it.name or "").strip()
        if name and placeholder_re.match(name):
            continue
        if name and totals_re.match(name):
            continue
        # Truly empty row (Houzz "add new row" stub at the bottom of edit views)
        if not name and not it.sku and not it.brand and not (it.extended_price or 0):
            continue

        q = float(it.quantity or 0)
        u = float(it.unit_price or 0)
        e = float(it.extended_price or 0)

        key = "|".join([
            re.sub(r"\s+", " ", name.lower()),
            (it.sku or "").lower(),
            (it.room_name or "").lower(),
            f"{q:.2f}", f"{u:.2f}", f"{e:.2f}",
        ])
        if key not in seen:
            seen[key] = it
        else:
            if fill_count(it) > fill_count(seen[key]):
                seen[key] = it
    return list(seen.values())


def _resolve_line(item: HouzzLineItem) -> Dict[str, Any]:
    """Attach manufacturer_link + resolution reason to a raw line item."""
    manuf_url, reason = resolve_manufacturer_link(
        source_url=item.source_url,
        brand=item.brand,
        sku=item.sku,
        name=item.name,
    )
    return {
        **item.dict(),
        "manufacturer_link": manuf_url,
        "manufacturer_link_reason": reason,
        "manufacturer_known": is_known_manufacturer(item.brand),
    }


def _parse_proposal_pdf_text(text: str) -> Dict[str, Any]:
    """
    Best-effort line-item extraction from Houzz Pro proposal PDFs.

    Houzz proposal PDFs are semi-tabular. We use several regexes to catch:
      - "Qty  Description  ...  Unit  Total"
      - Item lines like: "2  Uttermost Anmer Chandelier UT-22169  $585.00  $1,170.00"
      - Brand + SKU tokens.
    """
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    items: List[Dict[str, Any]] = []

    proposal_number = None
    client_name = None
    total = None
    tax = None
    subtotal = None

    for ln in lines:
        m = re.search(r"(?:estimate|proposal|invoice|quote)\s*#?\s*([A-Z0-9\-]+)", ln, re.I)
        if m and not proposal_number:
            proposal_number = m.group(1)
        m = re.search(r"^(?:client|customer|billed\s*to|for)[:\s]+(.+)$", ln, re.I)
        if m and not client_name:
            client_name = m.group(1).strip()
        m = re.search(r"^subtotal[:\s]+\$?([0-9,\.]+)", ln, re.I)
        if m and subtotal is None:
            subtotal = _price_from_text(m.group(1))
        m = re.search(r"^tax[:\s]+\$?([0-9,\.]+)", ln, re.I)
        if m and tax is None:
            tax = _price_from_text(m.group(1))
        m = re.search(r"^total[:\s]+\$?([0-9,\.]+)", ln, re.I)
        if m and total is None:
            total = _price_from_text(m.group(1))

    # Simple line pattern:  qty  ... $unit  $ext
    line_re = re.compile(
        r"^\s*(\d+(?:\.\d+)?)\s+(.+?)\s+\$?([0-9,]+(?:\.[0-9]+)?)\s+\$?([0-9,]+(?:\.[0-9]+)?)\s*$"
    )
    for ln in lines:
        m = line_re.match(ln)
        if not m:
            continue
        qty, desc, unit, ext = m.groups()
        qty_f = float(qty)
        unit_f = _price_from_text(unit)
        ext_f = _price_from_text(ext)
        # Skip totals-of-totals rows (they usually don't have a description word)
        if not re.search(r"[A-Za-z]{3,}", desc):
            continue
        # Try to extract SKU from description
        sku_m = re.search(r"\b([A-Z0-9]{2,}[-][A-Z0-9]{2,}|\b[A-Z]{2,}[0-9]{3,}\b)", desc)
        sku = sku_m.group(1) if sku_m else None
        # Brand = first capitalized token(s), rough heuristic
        brand_m = re.match(r"([A-Z][A-Za-z&\.']+(?:\s+[A-Z][A-Za-z&\.']+)?)", desc.strip())
        brand = brand_m.group(1) if brand_m else None
        items.append(dict(
            name=desc.strip(),
            brand=brand,
            sku=sku,
            quantity=qty_f,
            unit_price=unit_f,
            extended_price=ext_f,
        ))

    return dict(
        proposal_number=proposal_number,
        client_name=client_name,
        subtotal=subtotal,
        tax=tax,
        total=total,
        items=items,
    )


async def _save_session(payload: HouzzProposalPayload, resolved_items: List[Dict[str, Any]]) -> str:
    """Persist the import session so the frontend can poll / review before commit."""
    db = _get_db()
    sid = payload.session_id or f"hz_{uuid.uuid4().hex[:12]}"
    doc = {
        "session_id": sid,
        "project_id": payload.project_id,
        "houzz_url": payload.houzz_url,
        "kind": payload.kind,
        "proposal_number": payload.proposal_number,
        "proposal_title": payload.proposal_title,
        "client_name": payload.client_name,
        "subtotal": payload.subtotal,
        "tax": payload.tax,
        "total": payload.total,
        "items": resolved_items,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "scraped_at": payload.scraped_at,
        "committed": False,
    }
    await db.houzz_import_sessions.replace_one(
        {"session_id": sid}, doc, upsert=True
    )
    return sid


def _build_response(session_doc: Dict[str, Any]) -> HouzzImportSessionResponse:
    items = session_doc.get("items", [])
    unresolved = sum(1 for it in items if not it.get("manufacturer_link"))
    warnings: List[str] = []
    if unresolved:
        warnings.append(
            f"{unresolved} item(s) could not be linked to a manufacturer site — "
            "brand may be unknown or SKU missing."
        )
    return HouzzImportSessionResponse(
        session_id=session_doc["session_id"],
        kind=session_doc.get("kind", "proposal"),
        houzz_url=session_doc["houzz_url"],
        item_count=len(items),
        resolved_item_count=sum(1 for it in items if it.get("manufacturer_link")),
        unresolved_manufacturer_count=unresolved,
        subtotal=session_doc.get("subtotal"),
        tax=session_doc.get("tax"),
        total=session_doc.get("total"),
        proposal_number=session_doc.get("proposal_number"),
        proposal_title=session_doc.get("proposal_title"),
        client_name=session_doc.get("client_name"),
        items=items,
        warnings=warnings,
        created_at=session_doc.get("created_at") or "",
    )


# ============================================================================
# SERVER-SIDE HTML PARSER FOR HOUZZ PRO PAGES
# ============================================================================
# The extension posts the raw outerHTML of the main content region. We use
# BeautifulSoup to find the line-item table/rows and extract fields. Because
# Houzz frequently changes their React class names, we go by STRUCTURE
# (semantic tags + $-price patterns) instead of class names.

class HouzzRawCapture(BaseModel):
    session_id: Optional[str] = None
    project_id: Optional[str] = None
    houzz_url: str
    kind: str = "proposal"
    html: str
    scraped_at: Optional[str] = None
    extension_version: Optional[str] = None


def _parse_money(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    m = re.search(r"\$?\s*(-?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?)", str(s))
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", ""))
    except ValueError:
        return None


def _parse_qty(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    m = re.search(r"(\d+(?:\.\d+)?)", str(s))
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def _text(el) -> str:
    if el is None:
        return ""
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip()


def _first_a(el, external_only: bool = True) -> Optional[str]:
    if el is None:
        return None
    for a in el.find_all("a", href=True):
        href = a["href"]
        if not href.startswith("http"):
            continue
        if external_only and "houzz.com" in href:
            continue
        return href
    return None


def _first_img(el) -> Optional[str]:
    if el is None:
        return None
    img = el.find("img")
    if img:
        return img.get("src") or img.get("data-src") or None
    return None


def _extract_headers(header_row) -> Dict[str, int]:
    """Given a header row element, map column name -> index."""
    if header_row is None:
        return {}
    cells = header_row.find_all(["th", "td"])
    if not cells:
        cells = header_row.find_all(recursive=False)
    idx: Dict[str, int] = {}
    for i, c in enumerate(cells):
        label = _text(c).lower()
        if not label:
            continue
        # normalize typical column names
        if re.search(r"\b(qty|quantity)\b", label): idx["qty"] = i
        elif re.search(r"\b(item|product|description|name)\b", label) and "unit" not in label: idx.setdefault("name", i)
        elif re.search(r"\b(unit|each|price\s*each|cost)\b", label): idx["unit"] = i
        elif re.search(r"\b(total|extended|amount|line\s*total|subtotal)\b", label): idx["total"] = i
        elif re.search(r"\b(sku|item\s*#|model|mpn)\b", label): idx["sku"] = i
        elif re.search(r"\b(brand|manufacturer|vendor)\b", label): idx["brand"] = i
        elif re.search(r"\b(dim|size)\b", label): idx["dim"] = i
        elif re.search(r"\b(finish|color)\b", label): idx["finish"] = i
    return idx


def _extract_from_table(table) -> List[Dict[str, Any]]:
    """Extract line items from a semantic <table> element."""
    rows = table.find_all("tr")
    if len(rows) < 2:
        return []
    # Detect header
    header_row = rows[0]
    header_map = _extract_headers(header_row)
    items: List[Dict[str, Any]] = []
    for tr in rows[1:]:
        cells = tr.find_all(["td", "th"])
        if not cells:
            continue
        text_all = _text(tr)
        # skip totals rows
        if re.match(r"^\s*(subtotal|total|tax|shipping|grand\s*total|deposit|balance|amount\s*(due|paid))\b", text_all, re.I):
            continue
        cell_texts = [_text(c) for c in cells]
        # Skip empty rows
        if not any(t for t in cell_texts):
            continue

        def cell(key):
            i = header_map.get(key)
            return cells[i] if i is not None and i < len(cells) else None

        name_cell = cell("name")
        item = {
            "name": _text(name_cell) if name_cell is not None else None,
            "sku": _text(cell("sku")) if cell("sku") is not None else None,
            "brand": _text(cell("brand")) if cell("brand") is not None else None,
            "dimensions": _text(cell("dim")) if cell("dim") is not None else None,
            "finish_color": _text(cell("finish")) if cell("finish") is not None else None,
            "quantity": _parse_qty(_text(cell("qty"))),
            "unit_price": _parse_money(_text(cell("unit"))),
            "extended_price": _parse_money(_text(cell("total"))),
            "image_url": _first_img(name_cell if name_cell is not None else tr),
            "source_url": _first_a(name_cell if name_cell is not None else tr),
        }
        # Positional fallback when there was no clear header row
        if not header_map:
            money_cells = [(i, _parse_money(t)) for i, t in enumerate(cell_texts)]
            money_cells = [(i, v) for i, v in money_cells if v is not None]
            if len(money_cells) >= 2:
                item["unit_price"] = money_cells[-2][1] if item["unit_price"] is None else item["unit_price"]
                item["extended_price"] = money_cells[-1][1] if item["extended_price"] is None else item["extended_price"]
            if item["quantity"] is None:
                for t in cell_texts:
                    q = _parse_qty(t)
                    if q is not None and 0 < q < 1000 and "$" not in t:
                        item["quantity"] = q; break
            if not item["name"]:
                # pick the longest text cell that isn't a money value
                cand = [t for t in cell_texts if t and "$" not in t and not re.match(r"^\d+(\.\d+)?$", t)]
                if cand:
                    item["name"] = max(cand, key=len)[:200]

        # Skip if we have nothing meaningful
        if not any([item.get("name"), item.get("sku"), item.get("brand")]):
            continue
        if item.get("name") and re.match(r"^\s*item(?:\s*\d+)?\s*$", item["name"], re.I):
            continue

        # Try to extract brand from name if not already set (e.g. "Uttermost Anmer …")
        if not item.get("brand") and item.get("name"):
            for candidate in ["Uttermost", "Four Hands", "Bernhardt", "Rowe", "Loloi",
                              "Visual Comfort", "HVL", "Hudson Valley", "Gabby", "Bassett",
                              "Surya", "Safavieh", "Regina Andrew", "Global Views", "V and H",
                              "Flow Decor", "Crestview", "Eichholtz", "MOH", "Phillip Jeffries",
                              "York", "Classic Home"]:
                if candidate.lower() in item["name"].lower():
                    item["brand"] = candidate
                    break

        items.append(item)
    return items


def _extract_from_grid_divs(soup) -> List[Dict[str, Any]]:
    """
    Fallback when Houzz doesn't render an actual <table>: look for repeated
    div structures with role='row'. Also try 'ul > li' patterns commonly used
    by Houzz to render line items.
    """
    candidates = []
    # role=row
    role_rows = soup.select('[role="row"]')
    if role_rows and len(role_rows) >= 2:
        candidates.append(role_rows)
    # ul > li line items
    for ul in soup.find_all("ul"):
        lis = [li for li in ul.find_all("li", recursive=False) if _parse_money(_text(li))]
        if len(lis) >= 2:
            candidates.append(lis)
    # repeated sibling divs each holding a $ amount
    for parent in soup.find_all(["div", "section"]):
        kids = [c for c in parent.find_all("div", recursive=False)]
        moneyed = [c for c in kids if _parse_money(_text(c))]
        if len(moneyed) >= 2 and len(moneyed) == len(kids):
            candidates.append(moneyed)

    # Pick the candidate group with 2-25 items (typical proposal size)
    candidates = [c for c in candidates if 2 <= len(c) <= 40]
    if not candidates:
        return []
    # Prefer the group closest to size 5-15 (usually the real line items)
    candidates.sort(key=lambda c: abs(len(c) - 8))
    rows = candidates[0]

    items: List[Dict[str, Any]] = []
    for r in rows:
        t = _text(r)
        if re.match(r"^\s*(subtotal|total|tax|shipping|grand\s*total|deposit|balance)\b", t, re.I):
            continue
        moneys = re.findall(r"\$\s?[\d,]+(?:\.\d+)?", t)
        prices = [_parse_money(m) for m in moneys if _parse_money(m) is not None]
        # Quantity: first bare integer/float NOT inside a $
        qty_m = re.search(r"(?<!\$)(?<!\d)(\d{1,3}(?:\.\d+)?)\b(?!\s*%)", t.replace("$", " $ "))
        qty = float(qty_m.group(1)) if qty_m else None
        # Name: strip prices + qty + trailing whitespace
        stripped = re.sub(r"\$\s?[\d,]+(?:\.\d+)?", " ", t)
        stripped = re.sub(r"\s+", " ", stripped).strip()
        name = stripped[:200]
        item = {
            "name": name,
            "quantity": qty,
            "unit_price": prices[0] if len(prices) >= 1 else None,
            "extended_price": prices[-1] if len(prices) >= 2 else (prices[0] if prices else None),
            "image_url": _first_img(r),
            "source_url": _first_a(r),
        }
        # Extract brand mention
        for candidate in ["Uttermost", "Four Hands", "Bernhardt", "Rowe", "Loloi",
                          "Visual Comfort", "HVL", "Hudson Valley", "Gabby", "Bassett",
                          "Surya", "Safavieh", "Regina Andrew", "Global Views", "V and H",
                          "Flow Decor", "Crestview", "Eichholtz", "MOH", "Phillip Jeffries",
                          "York", "Classic Home"]:
            if candidate.lower() in name.lower():
                item["brand"] = candidate
                break
        if not item.get("name") and not item.get("extended_price"):
            continue
        items.append(item)
    return items


_KNOWN_BRANDS = ["Uttermost", "Four Hands", "Bernhardt", "Rowe", "Loloi",
                 "Visual Comfort", "HVL", "Hudson Valley", "Gabby", "Bassett",
                 "Surya", "Safavieh", "Regina Andrew", "Global Views", "V and H",
                 "Flow Decor", "Crestview", "Eichholtz", "MOH", "Phillip Jeffries",
                 "York", "Classic Home", "Kasmir"]


def _brand_from_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    low = text.lower()
    for candidate in _KNOWN_BRANDS:
        if candidate.lower() in low:
            return candidate
    return None


def _sku_from_text(text: Optional[str]) -> Optional[str]:
    """Pull a SKU/model out of a name/description, eg 'Milton Road Pendant (TOB5158)'."""
    if not text:
        return None
    m = re.search(r"\(([A-Z]{1,5}[-\s]?\d{3,}[A-Z0-9./-]*)\)", text)
    if m:
        return m.group(1)
    m = re.search(r"\b(?:sku|model|item)\b\s*#?\s*[:\-]?\s*([A-Z0-9][A-Z0-9./-]{3,})", text, re.I)
    if m:
        return m.group(1)
    return None


def _real_img_src(el) -> Optional[str]:
    """First product image inside `el`, skipping logos / tracking pixels / data URIs."""
    if el is None:
        return None
    for img in el.find_all("img"):
        src = img.get("src") or img.get("data-src") or ""
        if not src.startswith("http"):
            continue
        if any(bad in src for bad in ("company_logo", "/js/log", "logo", "avatar", "1x1")):
            continue
        return src
    return None


def _extract_vt_rows(soup) -> List[Dict[str, Any]]:
    """
    PRIMARY extractor for pro.houzz.com virtual tables (estimates, proposals,
    purchase documents — both /preview and /edit views).

    Houzz renders line items as `div.tr.vt-row` with SEMANTIC column classes:
        vt-group-row              -> room/section header ("1 SCULLERY … $13,424.10")
        vt-item-row / item rows   -> auto-number-column, item-details-column,
                                     quantity-column, cost-column, total-column
    Preview views keep data as text (`.print-item-name`, `.print-item-note`,
    `.item-extra-info-pair`). Edit views keep data in <input value="…"> fields
    identified by data-testid / placeholder ("Add SKU", "Add a manufacturer",
    "Add a color", "Add dimensions", "Add materials", "Add Room").
    """
    rows = soup.select("div.tr.vt-row")
    if not rows:
        return []

    raw: List[Dict[str, Any]] = []
    current_group: Optional[str] = None

    for r in rows:
        classes = r.get("class") or []
        if "vt-group-row" in classes:
            # "1 SCULLERY $0.00 $0.00 $13,424.10" -> "SCULLERY"
            t = _text(r)
            t = re.sub(r"^\s*\d+(\.\d+)?\s+", "", t)
            t = re.sub(r"(\s*\$[\d,\.]+)+\s*$", "", t).strip()
            current_group = t or current_group
            continue

        item: Dict[str, Any] = {"room_name": current_group}

        num_el = r.select_one('[class*="auto-number-column"]')
        item["row_number"] = _text(num_el) or None

        details = r.select_one('[class*="item-details-column"]')

        # ---- 1. Text-based fields (preview views) --------------------------
        name_el = details.select_one(".print-item-name") if details else None
        if name_el is not None:
            item["name"] = _text(name_el) or None
        note_el = details.select_one(".print-item-note") if details else None
        if note_el is not None:
            item["description"] = _text(note_el)[:500] or None
        if details is not None:
            for pair in details.select(".item-extra-info-pair"):
                pt = _text(pair)
                m = re.match(r"^\s*(room|color|colour|finish|dimensions?|size|sku|manufacturer|brand|materials?)\s*:\s*(.+)$", pt, re.I)
                if not m:
                    continue
                key, val = m.group(1).lower(), m.group(2).strip()
                if key == "room" and val:
                    item["room_name"] = val
                elif key in ("color", "colour", "finish"):
                    item["finish_color"] = val
                elif key in ("dimensions", "dimension", "size"):
                    item["dimensions"] = val
                elif key == "sku":
                    item["sku"] = val
                elif key in ("manufacturer", "brand"):
                    item["brand"] = val
                elif key in ("materials", "material"):
                    item["materials"] = val

        # ---- 2. Input-based fields (edit views + qty everywhere) -----------
        for inp in r.find_all("input"):
            val = (inp.get("value") or "").strip()
            if not val:
                continue
            tid = (inp.get("data-testid") or "").strip()
            ph = (inp.get("placeholder") or "").strip().lower()
            if tid == "itemName" and not item.get("name"):
                item["name"] = val
            elif tid == "quantity":
                item["quantity"] = _parse_qty(val)
            elif tid == "UnitType" and val.lower() not in ("add unit type",):
                item["unit_type"] = val
            elif tid in ("materialCost", "laborCost", "unitCost"):
                item["unit_cost"] = _parse_money(val)
            elif ph == "add sku":
                item["sku"] = val
            elif ph == "add a manufacturer":
                item["brand"] = val
            elif ph == "add a color":
                item["finish_color"] = val
            elif ph == "add dimensions":
                item["dimensions"] = val
            elif ph == "add materials":
                item["materials"] = val
            elif ph == "add room":
                item["room_name"] = val

        # ---- 3. Money columns ----------------------------------------------
        total_el = r.select_one('[class*="total-column"]')
        item["extended_price"] = _parse_money(_text(total_el))
        cost_el = r.select_one('[class*="cost-column"]:not([class*="shipping"])')
        cost_val = _parse_money(_text(cost_el))
        if cost_val:
            item.setdefault("unit_cost", cost_val)

        # ---- 4. Image / link -------------------------------------------------
        item["image_url"] = _real_img_src(details if details is not None else r)
        item["source_url"] = _first_a(details if details is not None else r)

        # ---- 5. Derived fields ----------------------------------------------
        if not item.get("name") and details is not None:
            # last resort: cell text minus placeholder phrases
            t = re.sub(r"add a description|no status|\d+\s*link[s]?", "", _text(details), flags=re.I).strip()
            item["name"] = t[:150] or None

        if not item.get("sku"):
            item["sku"] = _sku_from_text((item.get("name") or "") + " " + (item.get("description") or ""))
        if not item.get("brand"):
            item["brand"] = _brand_from_text((item.get("name") or "") + " " + (item.get("description") or ""))

        # unit price from total/qty when missing
        q = item.get("quantity")
        ext = item.get("extended_price")
        if item.get("unit_price") is None and q and ext:
            item["unit_price"] = round(ext / q, 2)
        elif item.get("unit_price") is None and ext and not q:
            item["quantity"] = 1
            item["unit_price"] = ext

        raw.append(item)

    # ---- Parent/child folding (purchase documents) --------------------------
    # Edit views number deliverables "1", "2"… and their component/spec rows
    # "1.1", "2.1"…  The component row carries SKU/brand/color/dims; the parent
    # carries the display name + room. Merge them so nothing is lost and
    # nothing is double-counted.
    by_number = {it.get("row_number"): it for it in raw if it.get("row_number")}
    has_children = set()
    for it in raw:
        rn = it.get("row_number") or ""
        m = re.match(r"^(\d+)\.\d+$", rn)
        if m and m.group(1) in by_number:
            has_children.add(m.group(1))

    items: List[Dict[str, Any]] = []
    for it in raw:
        rn = it.get("row_number") or ""
        m = re.match(r"^(\d+)\.\d+$", rn)
        parent = by_number.get(m.group(1)) if m else None
        if parent is not None and parent.get("name"):
            it["parent_name"] = parent["name"]
            it["room_name"] = it.get("room_name") or parent.get("room_name")
            if it.get("extended_price") is None:
                it["extended_price"] = parent.get("extended_price")
        # Skip parent wrappers whose $ totals are duplicated by their children
        if re.match(r"^\d+$", rn) and rn in has_children:
            continue
        items.append(it)

    # Notes: fold unit_type + materials into notes so they surface everywhere
    for it in items:
        bits = []
        if it.get("unit_type"):
            bits.append(f"Unit: {it['unit_type']}")
        if it.get("materials"):
            bits.append(f"Materials: {it['materials']}")
        if it.get("parent_name"):
            bits.append(f"For: {it['parent_name']}")
        if bits:
            it["notes"] = " | ".join(bits)

    return items


def _parse_houzz_html(html: str) -> Dict[str, Any]:
    """Server-side parser. Returns dict with items + top-level totals + meta."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")

    # Strip tags that add noise
    for tag in soup.find_all(["script", "style", "svg", "noscript"]):
        tag.decompose()

    body_text = soup.get_text(" ", strip=True)
    meta: Dict[str, Any] = {}
    # Document number MUST contain digits (eg "ES-400220") so we never mistake
    # a client surname ("Diehl") for a document number.
    m = re.search(r"(?:estimate|proposal|purchase\s*document|purchase\s*order|invoice|quote)\s*#?\s*((?=[A-Z0-9\-]*\d)[A-Z0-9\-]{3,})", body_text, re.I)
    if m:
        meta["proposal_number"] = m.group(1)
    m = re.search(r"(?:client|customer|bill(?:ed)?\s*to)\s*[:\-]?\s*([A-Z][A-Za-z\'\.\-\s,]{2,60})", body_text)
    if m:
        meta["client_name"] = m.group(1).strip()

    # Totals — REQUIRE a $-prefixed amount so percentages ("Tax 7%") and bare
    # digits never leak into money fields.
    _money_shape = r"\$\s*\d{1,3}(?:,\d{3})*(?:\.\d+)?"
    def _grep_money(pattern: str):
        """All label→$ matches; return the LARGEST (column headers often show $0.00)."""
        vals = [_parse_money(g) for g in re.findall(pattern, body_text, re.I)]
        vals = [v for v in vals if v is not None]
        return max(vals) if vals else None
    meta["subtotal"] = _grep_money(r"\bsubtotal\b[^\n]{0,30}?(" + _money_shape + r")")
    meta["tax"] = _grep_money(r"(?<!sub)\btax\b(?:\s*\([^)]*\))?[^\n]{0,30}?(" + _money_shape + r")")
    meta["total"] = _grep_money(r"(?:\bgrand\s*)?\btotal\b(?!\s*(?:cost|price|column))[^\n]{0,30}?(" + _money_shape + r")")

    # STRATEGY 1 (primary): Houzz pro virtual-table rows — semantic classes.
    best: List[Dict[str, Any]] = _extract_vt_rows(soup)

    # STRATEGY 2: semantic <table> extraction.
    if not best:
        for table in soup.find_all("table"):
            items = _extract_from_table(table)
            if len(items) > len(best):
                best = items

    # STRATEGY 3: repeated-div heuristics.
    if not best:
        best = _extract_from_grid_divs(soup)

    return {"items": best, "meta": meta}


@router.post("/raw-capture")
async def raw_capture(payload: HouzzRawCapture):
    """
    Chrome extension v7.46+ posts the outerHTML of the Houzz page here.
    We parse server-side (BeautifulSoup), so parser fixes never need an
    extension reinstall.
    """
    db = _get_db()
    if not payload.html or len(payload.html) < 200:
        raise HTTPException(status_code=400, detail="HTML payload is empty or too small")

    parsed = _parse_houzz_html(payload.html)
    line_items = [HouzzLineItem(**it) for it in parsed["items"]]

    session_payload = HouzzProposalPayload(
        project_id=payload.project_id,
        houzz_url=payload.houzz_url,
        proposal_number=parsed["meta"].get("proposal_number"),
        client_name=parsed["meta"].get("client_name"),
        subtotal=parsed["meta"].get("subtotal"),
        tax=parsed["meta"].get("tax"),
        total=parsed["meta"].get("total"),
        items=line_items,
        kind=payload.kind,
        scraped_at=payload.scraped_at,
        session_id=payload.session_id,
    )
    cleaned = _dedupe_and_validate(session_payload.items)
    resolved = [_resolve_line(it) for it in cleaned]
    sid = await _save_session(session_payload, resolved)

    # Also persist the raw HTML for offline analysis / re-parse without another scrape
    await db.houzz_raw_captures.replace_one(
        {"session_id": sid},
        {
            "session_id": sid,
            "houzz_url": payload.houzz_url,
            "kind": payload.kind,
            "html_bytes": len(payload.html),
            "extension_version": payload.extension_version,
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "html": payload.html,
            "raw_item_count": len(parsed["items"]),
            "cleaned_item_count": len(cleaned),
        },
        upsert=True,
    )

    doc = await db.houzz_import_sessions.find_one({"session_id": sid}, {"_id": 0})
    logger.info(
        "🏠 Houzz raw-capture: html=%d KB parsed=%d cleaned=%d matched=%d from %s",
        len(payload.html) // 1024,
        len(parsed["items"]),
        len(cleaned),
        sum(1 for it in resolved if it.get("manufacturer_link")),
        payload.houzz_url,
    )
    return _build_response(doc)


@router.post("/reparse/{session_id}", response_model=HouzzImportSessionResponse)
async def reparse_session(session_id: str):
    """Re-run the HTML parser on a stored session (used when we improve the parser)."""
    db = _get_db()
    cap = await db.houzz_raw_captures.find_one({"session_id": session_id})
    if not cap or not cap.get("html"):
        raise HTTPException(status_code=404, detail="No raw capture found for this session")
    parsed = _parse_houzz_html(cap["html"])
    line_items = [HouzzLineItem(**it) for it in parsed["items"]]
    session_payload = HouzzProposalPayload(
        project_id=cap.get("project_id"),
        houzz_url=cap.get("houzz_url"),
        proposal_number=parsed["meta"].get("proposal_number"),
        client_name=parsed["meta"].get("client_name"),
        subtotal=parsed["meta"].get("subtotal"),
        tax=parsed["meta"].get("tax"),
        total=parsed["meta"].get("total"),
        items=line_items,
        kind=cap.get("kind", "proposal"),
        session_id=session_id,
    )
    cleaned = _dedupe_and_validate(session_payload.items)
    resolved = [_resolve_line(it) for it in cleaned]
    await _save_session(session_payload, resolved)
    doc = await db.houzz_import_sessions.find_one({"session_id": session_id}, {"_id": 0})
    return _build_response(doc)



# ============================================================================
# ROUTES
# ============================================================================
@router.post("/proposal-import", response_model=HouzzImportSessionResponse)
async def import_from_extension(payload: HouzzProposalPayload):
    """
    Chrome extension POSTs a scraped Houzz proposal/estimate/PO here.
    We resolve manufacturer links for every item and persist a session.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="No line items in payload")

    # Backend safety net — even if the extension over-collects, we dedupe here.
    original_count = len(payload.items)
    cleaned_items = _dedupe_and_validate(payload.items)
    dropped = original_count - len(cleaned_items)
    if dropped > 0:
        logger.info(
            "🏠 Houzz import: dropped %d duplicate/invalid rows (%d -> %d) from %s",
            dropped, original_count, len(cleaned_items), payload.houzz_url,
        )

    if not cleaned_items:
        raise HTTPException(
            status_code=400,
            detail=f"All {original_count} scraped rows were duplicates or invalid; nothing to import.",
        )

    resolved = [_resolve_line(it) for it in cleaned_items]
    sid = await _save_session(payload, resolved)
    doc = await _get_db().houzz_import_sessions.find_one({"session_id": sid}, {"_id": 0})
    logger.info(
        "🏠 Houzz import: %d items (%d matched to manufacturer) from %s",
        len(resolved),
        sum(1 for it in resolved if it.get("manufacturer_link")),
        payload.houzz_url,
    )
    return _build_response(doc)


@router.post("/proposal-import-pdf", response_model=HouzzImportSessionResponse)
async def import_from_pdf(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    kind: str = Form("proposal"),
):
    """
    User uploads a Houzz Pro proposal PDF (exported from the Houzz dashboard).
    We extract line items + totals with a best-effort parser.
    """
    raw = await file.read()

    text = ""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(raw))
        text = "\n".join((p.extract_text() or "") for p in reader.pages)
    except Exception as exc:
        logger.warning("PyPDF2 fallback failed: %s — trying pdfplumber", exc)

    if not text.strip():
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(raw)) as pdf:
                text = "\n".join((p.extract_text() or "") for p in pdf.pages)
        except Exception as exc:
            logger.warning("pdfplumber failed too: %s", exc)

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from the PDF. If it's a scanned/image PDF, use the Chrome Extension instead.",
        )

    parsed = _parse_proposal_pdf_text(text)

    line_items = [HouzzLineItem(**it) for it in parsed["items"]]
    payload = HouzzProposalPayload(
        project_id=project_id,
        houzz_url=f"pdf://{file.filename}",
        proposal_number=parsed.get("proposal_number"),
        client_name=parsed.get("client_name"),
        subtotal=parsed.get("subtotal"),
        tax=parsed.get("tax"),
        total=parsed.get("total"),
        items=line_items,
        kind=kind,
        scraped_at=datetime.now(timezone.utc).isoformat(),
    )

    resolved = [_resolve_line(it) for it in payload.items]
    sid = await _save_session(payload, resolved)
    doc = await _get_db().houzz_import_sessions.find_one({"session_id": sid}, {"_id": 0})
    logger.info(
        "🏠 Houzz PDF import: %d items parsed from %s",
        len(resolved), file.filename,
    )
    return _build_response(doc)


@router.get("/import-session/{session_id}", response_model=HouzzImportSessionResponse)
async def get_session(session_id: str):
    db = _get_db()
    doc = await db.houzz_import_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return _build_response(doc)


@router.get("/import-sessions", response_model=List[HouzzImportSessionResponse])
async def list_sessions(project_id: Optional[str] = None, limit: int = 25):
    db = _get_db()
    q: Dict[str, Any] = {}
    if project_id:
        q["project_id"] = project_id
    docs = await db.houzz_import_sessions.find(q, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [_build_response(d) for d in docs]


class CommitRequest(BaseModel):
    session_id: str
    project_id: str
    target: str = "checklist"   # "checklist" (spreadsheet) | "purchase_order" | legacy alias "items"
    room_id: Optional[str] = None
    po_status: str = "pending"  # only when target = purchase_order
    default_room_name: Optional[str] = None   # room for items without a Houzz room
    category_name: str = "FF&E"               # checklist category items are filed under
    room_overrides: Optional[Dict[str, str]] = None  # {item_index: room_name} from review screen


async def _find_or_create_checklist_slot(db, project_id: str, room_name: str, category_name: str) -> Tuple[str, str]:
    """Room -> Category -> Subcategory for the checklist sheet. Returns (room_id, subcategory_id)."""
    now = datetime.now(timezone.utc).isoformat()
    room_name = (room_name or "HOUZZ IMPORT").strip().upper()

    room = await db.rooms.find_one({
        "project_id": project_id, "sheet_type": "checklist",
        "name": {"$regex": f"^{re.escape(room_name)}$", "$options": "i"},
    })
    if not room:
        room = {
            "id": str(uuid.uuid4()), "project_id": project_id, "name": room_name,
            "sheet_type": "checklist", "description": "", "order_index": 999,
            "color": "#7A5A8A", "notes": "", "floor": "1st Floor",
            "created_at": now, "updated_at": now,
        }
        await db.rooms.insert_one(room)

    cat = await db.categories.find_one({
        "room_id": room["id"],
        "name": {"$regex": f"^{re.escape(category_name)}$", "$options": "i"},
    })
    if not cat:
        cat = {
            "id": str(uuid.uuid4()), "room_id": room["id"], "name": category_name.upper(),
            "description": "", "order_index": 0, "color": "#5A7A5A",
            "created_at": now, "updated_at": now,
        }
        await db.categories.insert_one(cat)

    sub = await db.subcategories.find_one({"category_id": cat["id"]})
    if not sub:
        sub = {
            "id": str(uuid.uuid4()), "category_id": cat["id"], "name": "HOUZZ IMPORT",
            "description": "", "order_index": 0, "color": "#8A5A5A",
            "created_at": now, "updated_at": now,
        }
        await db.subcategories.insert_one(sub)
    return room["id"], sub["id"]


@router.post("/commit")
async def commit_session(payload: CommitRequest):
    """
    Take a resolved import session and push items into either:
      - the project's CHECKLIST spreadsheet (target='checklist' / legacy 'items')
        -> rooms auto-created from the Houzz room groupings, every item filed
           under Room -> {category_name} -> HOUZZ IMPORT with its manufacturer
           link (approved B2B domains ONLY — never a retail URL).
      - a new Purchase Order draft (target='purchase_order')
    """
    db = _get_db()
    doc = await db.houzz_import_sessions.find_one({"session_id": payload.session_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    items = doc.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="Session has no items")

    if payload.target == "purchase_order":
        po_id = f"po_{uuid.uuid4().hex[:12]}"
        po = {
            "id": po_id,
            "project_id": payload.project_id,
            "houzz_url": doc.get("houzz_url"),
            "po_number": doc.get("proposal_number") or f"HZ-{doc.get('session_id','')[:6].upper()}",
            "vendor": next((it.get("brand") for it in items if it.get("brand")), "Houzz"),
            "line_items": items,
            "subtotal": doc.get("subtotal"),
            "tax": doc.get("tax"),
            "total": doc.get("total"),
            "status": payload.po_status,
            "source": "houzz_import",
            "source_session_id": payload.session_id,
            "payments": [],
            "deposit_amount": None,
            "deposit_paid_at": None,
            "balance_amount": None,
            "balance_paid_at": None,
            "receipts": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.purchase_orders.insert_one(po)
        await db.houzz_import_sessions.update_one(
            {"session_id": payload.session_id},
            {"$set": {"committed": True, "committed_to": "purchase_order", "committed_id": po_id}},
        )
        return {"ok": True, "purchase_order_id": po_id, "line_count": len(items)}

    # target == "checklist" (or legacy "items"): push into the checklist sheet
    overrides = payload.room_overrides or {}
    subcat_cache: Dict[str, Tuple[str, str]] = {}
    inserted = []
    rooms_used: set = set()
    for idx, it in enumerate(items):
        room_name = (
            overrides.get(str(idx))
            or it.get("room_name")
            or payload.default_room_name
            or "HOUZZ IMPORT"
        )
        cache_key = room_name.strip().upper()
        if cache_key not in subcat_cache:
            subcat_cache[cache_key] = await _find_or_create_checklist_slot(
                db, payload.project_id, room_name, payload.category_name
            )
        rooms_used.add(cache_key)
        room_id, subcat_id = subcat_cache[cache_key]

        qty = it.get("quantity")
        note_bits = [b for b in [it.get("notes"),
                                 f"Houzz #{doc.get('proposal_number')}" if doc.get("proposal_number") else None] if b]
        item_doc = {
            "id": str(uuid.uuid4()),
            "subcategory_id": subcat_id,
            "room_id": room_id,
            "project_id": payload.project_id,
            "name": it.get("name") or it.get("description") or "Unknown Product",
            "vendor": it.get("brand") or "",
            "sku": it.get("sku") or "",
            # STRICT: link is the manufacturer link ONLY (21 approved B2B
            # domains). Retail URLs from Houzz are kept in a separate field
            # for reference and are NEVER used as the item link.
            "link": it.get("manufacturer_link") or "",
            "houzz_source_url": it.get("source_url"),
            "image_url": it.get("image_url") or "",
            "size": it.get("dimensions") or "",
            "finish_color": it.get("finish_color") or "",
            "quantity": int(round(qty)) if qty else 1,
            "cost": it.get("unit_cost") or it.get("unit_price") or 0.0,
            "price": it.get("unit_price") or 0.0,
            "description": it.get("description") or "",
            "remarks": "",
            "status": "",
            "notes": " | ".join(note_bits),
            "source": "houzz_proposal_import",
            "source_session_id": payload.session_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.items.insert_one(item_doc)
        inserted.append(item_doc["id"])

    await db.houzz_import_sessions.update_one(
        {"session_id": payload.session_id},
        {"$set": {"committed": True, "committed_to": "checklist", "committed_ids": inserted}},
    )
    return {"ok": True, "inserted_item_ids": inserted, "count": len(inserted),
            "rooms": sorted(rooms_used)}


@router.delete("/import-session/{session_id}")
async def delete_session(session_id: str):
    db = _get_db()
    res = await db.houzz_import_sessions.delete_one({"session_id": session_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


# ------------ Diagnostic helpers ---------------------------------------------
@router.get("/known-manufacturers")
async def known_manufacturers():
    """Debug helper — list all brand->domain mappings we recognize."""
    from manufacturer_resolver import known_manufacturer_domains
    return known_manufacturer_domains()
