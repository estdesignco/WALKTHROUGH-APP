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
from typing import List, Optional, Dict, Any

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
    """Backend safety net: drop duplicate rows + rows whose math doesn't add up.

    Even if the Chrome extension misbehaves and posts the same row 8 times or
    grabs subtotal / grand-total rows as line items, this filter catches it.

    Rules:
      * If qty * unit_price is off from extended_price by >5% AND >$2 -> drop
        (that row is almost certainly a subtotal / grand total).
      * Content hash on (name, qty, unit, ext) -> keep one per hash.
      * If two rows hash-collide, keep the one with more populated fields.
      * Reject rows named exactly "Item", "Item 1", etc. (React placeholders).
      * Reject rows named "Subtotal", "Total", "Tax", "Shipping", etc.
    """
    def fill_count(it: "HouzzLineItem") -> int:
        return sum(1 for v in it.dict().values() if v not in (None, "", 0))

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

        q = float(it.quantity or 0)
        u = float(it.unit_price or 0)
        e = float(it.extended_price or 0)

        # Math validation
        if q > 0 and u > 0 and e > 0:
            expected = q * u
            diff = abs(expected - e)
            tolerance = max(2.0, expected * 0.05)
            if diff > tolerance:
                continue  # likely a subtotal / summary row

        # Reject $0 rows with no product identifier
        if e == 0 and not (it.sku or it.brand):
            continue

        key = "|".join([
            re.sub(r"\s+", " ", name.lower()),
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
    target: str = "items"       # "items" (spreadsheet) | "purchase_order"
    room_id: Optional[str] = None
    po_status: str = "pending"  # only when target = purchase_order


@router.post("/commit")
async def commit_session(payload: CommitRequest):
    """
    Take a resolved import session and push items into either:
      - the project's items spreadsheet (target='items')
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
            "vendor": items[0].get("brand") if items else "Houzz",
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

    # target == "items" (default): push to spreadsheet
    inserted = []
    for it in items:
        item_doc = {
            "id": str(uuid.uuid4()),
            "project_id": payload.project_id,
            "room_id": payload.room_id,
            "name": it.get("name") or it.get("description"),
            "vendor": it.get("brand"),
            "sku": it.get("sku"),
            "link": it.get("manufacturer_link") or it.get("source_url"),
            "manufacturer_link": it.get("manufacturer_link"),
            "houzz_source_url": it.get("source_url"),
            "image_url": it.get("image_url"),
            "size": it.get("dimensions"),
            "finish_color": it.get("finish_color"),
            "quantity": it.get("quantity") or 1,
            "cost": it.get("unit_cost"),
            "price": it.get("unit_price"),
            "extended_price": it.get("extended_price"),
            "description": it.get("description"),
            "category": it.get("category"),
            "notes": it.get("notes"),
            "source": "houzz_proposal_import",
            "source_session_id": payload.session_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.items.insert_one(item_doc)
        inserted.append(item_doc["id"])

    await db.houzz_import_sessions.update_one(
        {"session_id": payload.session_id},
        {"$set": {"committed": True, "committed_to": "items", "committed_ids": inserted}},
    )
    return {"ok": True, "inserted_item_ids": inserted, "count": len(inserted)}


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
