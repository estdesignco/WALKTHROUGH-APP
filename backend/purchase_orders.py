"""
Purchase Orders Router
======================

Standalone module for managing Purchase Orders in the app.

Features
--------
- Global list of POs across all projects  (GET /api/purchase-orders)
- Per-project list                        (GET /api/purchase-orders?project_id=…)
- Full CRUD                                (POST/GET/PATCH/DELETE)
- Payment tracking with deposit + balance
- Receipt attachments (URL to uploaded file)
- Import from Houzz proposal (via extension) — see houzz_import.commit
- Import from PDF (parses a vendor / Houzz PO PDF)

Data model
----------
purchase_orders:
    id              str  (po_… uuid)
    project_id      str  nullable (global POs allowed)
    po_number       str
    vendor          str
    houzz_url       str  nullable
    line_items      list[dict]  (same shape as houzz_import HouzzLineItem)
    subtotal        float
    tax             float
    shipping        float
    total           float
    status          "draft"|"pending"|"deposit_paid"|"paid"|"shipped"|"received"|"cancelled"
    payments        list[Payment]
    deposit_amount  float | null
    deposit_paid_at str  ISO | null
    balance_amount  float | null
    balance_due_at  str  ISO | null
    balance_paid_at str  ISO | null
    receipts        list[{url,label,uploaded_at}]
    notes           str
    created_at, updated_at
"""

from __future__ import annotations

import io
import re
import uuid
import base64
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from manufacturer_resolver import resolve_manufacturer_link

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/purchase-orders", tags=["Purchase Orders"])

_db: Optional[AsyncIOMotorDatabase] = None

VALID_STATUSES = {
    "draft", "pending", "deposit_paid", "paid",
    "shipped", "received", "cancelled",
}


def set_db(db: AsyncIOMotorDatabase) -> None:
    global _db
    _db = db


def _get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise HTTPException(status_code=500, detail="PurchaseOrders DB not initialized")
    return _db


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ============================================================================
# MODELS
# ============================================================================
class Payment(BaseModel):
    id: str = Field(default_factory=lambda: f"pay_{uuid.uuid4().hex[:10]}")
    date: str = Field(default_factory=_now_iso)
    amount: float
    method: str = "unknown"          # "credit_card" | "ach" | "check" | "wire" | "cash" | ...
    kind: str = "payment"            # "deposit" | "balance" | "payment"
    reference: Optional[str] = None  # check #, last-4, transaction id
    receipt_url: Optional[str] = None
    note: Optional[str] = None


class LineItem(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    brand: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = 1
    unit_cost: Optional[float] = None
    unit_price: Optional[float] = None
    extended_price: Optional[float] = None
    dimensions: Optional[str] = None
    finish_color: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    manufacturer_link: Optional[str] = None
    notes: Optional[str] = None


class PurchaseOrder(BaseModel):
    id: str = Field(default_factory=lambda: f"po_{uuid.uuid4().hex[:12]}")
    project_id: Optional[str] = None
    po_number: str
    vendor: str
    houzz_url: Optional[str] = None
    line_items: List[LineItem] = Field(default_factory=list)
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    shipping: Optional[float] = None
    total: Optional[float] = None
    status: str = "draft"
    payments: List[Payment] = Field(default_factory=list)
    deposit_amount: Optional[float] = None
    deposit_paid_at: Optional[str] = None
    balance_amount: Optional[float] = None
    balance_due_at: Optional[str] = None
    balance_paid_at: Optional[str] = None
    receipts: List[Dict[str, Any]] = Field(default_factory=list)
    notes: Optional[str] = None
    source: str = "manual"           # "manual" | "houzz_import" | "pdf_import"
    source_session_id: Optional[str] = None
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class PurchaseOrderCreate(BaseModel):
    project_id: Optional[str] = None
    po_number: Optional[str] = None
    vendor: str
    line_items: List[LineItem] = Field(default_factory=list)
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    shipping: Optional[float] = None
    total: Optional[float] = None
    status: str = "draft"
    deposit_amount: Optional[float] = None
    balance_amount: Optional[float] = None
    balance_due_at: Optional[str] = None
    notes: Optional[str] = None


class PurchaseOrderUpdate(BaseModel):
    project_id: Optional[str] = None
    po_number: Optional[str] = None
    vendor: Optional[str] = None
    houzz_url: Optional[str] = None
    line_items: Optional[List[LineItem]] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    shipping: Optional[float] = None
    total: Optional[float] = None
    status: Optional[str] = None
    deposit_amount: Optional[float] = None
    balance_amount: Optional[float] = None
    balance_due_at: Optional[str] = None
    notes: Optional[str] = None


# ============================================================================
# HELPERS
# ============================================================================
def _serialize(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Strip the Mongo _id before returning to the frontend."""
    if not doc:
        return doc
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


def _recompute_totals(po: Dict[str, Any]) -> Dict[str, Any]:
    """Auto-compute subtotal/total when line items are present."""
    items = po.get("line_items") or []
    if items:
        sub = 0.0
        for it in items:
            ext = it.get("extended_price")
            if ext is None:
                q = float(it.get("quantity") or 1)
                p = float(it.get("unit_price") or 0)
                ext = q * p
                it["extended_price"] = ext
            sub += float(ext or 0)
        # Only overwrite if we didn't have an explicit subtotal
        if po.get("subtotal") is None:
            po["subtotal"] = round(sub, 2)
    tax = float(po.get("tax") or 0)
    shipping = float(po.get("shipping") or 0)
    if po.get("total") is None:
        po["total"] = round(float(po.get("subtotal") or 0) + tax + shipping, 2)
    return po


def _apply_payment_status(po: Dict[str, Any]) -> Dict[str, Any]:
    """Auto-move status forward based on payments."""
    total = float(po.get("total") or 0)
    paid = sum(float(p.get("amount") or 0) for p in po.get("payments") or [])
    if total > 0:
        # Only auto-advance from draft/pending/deposit_paid — respect shipped/received/cancelled.
        current = po.get("status") or "draft"
        if current not in {"shipped", "received", "cancelled"}:
            if paid <= 0:
                po["status"] = "pending" if current != "draft" else current
            elif paid + 0.005 < total:
                po["status"] = "deposit_paid"
            else:
                po["status"] = "paid"
    return po


def _parse_po_pdf_text(text: str) -> Dict[str, Any]:
    """Best-effort structured extraction from a PO PDF."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    po_number = None
    vendor = None
    total = None
    tax = None
    subtotal = None
    shipping = None

    for ln in lines:
        m = re.search(r"(?:po|order|purchase\s*order)\s*(?:#|number|no\.?)?\s*[:\-]?\s*([A-Z0-9\-]{3,})", ln, re.I)
        if m and not po_number:
            po_number = m.group(1)
        m = re.search(r"^(?:vendor|supplier|ship\s*from|sold\s*by)[:\s]+(.+)$", ln, re.I)
        if m and not vendor:
            vendor = m.group(1).strip()
        m = re.search(r"^subtotal[:\s]+\$?([0-9,\.]+)", ln, re.I)
        if m and subtotal is None:
            try: subtotal = float(m.group(1).replace(",", ""))
            except ValueError: pass
        m = re.search(r"^tax[:\s]+\$?([0-9,\.]+)", ln, re.I)
        if m and tax is None:
            try: tax = float(m.group(1).replace(",", ""))
            except ValueError: pass
        m = re.search(r"^(?:shipping|freight)[:\s]+\$?([0-9,\.]+)", ln, re.I)
        if m and shipping is None:
            try: shipping = float(m.group(1).replace(",", ""))
            except ValueError: pass
        m = re.search(r"^total[:\s]+\$?([0-9,\.]+)", ln, re.I)
        if m and total is None:
            try: total = float(m.group(1).replace(",", ""))
            except ValueError: pass

    line_re = re.compile(
        r"^\s*(\d+(?:\.\d+)?)\s+(.+?)\s+\$?([0-9,]+(?:\.[0-9]+)?)\s+\$?([0-9,]+(?:\.[0-9]+)?)\s*$"
    )
    items: List[Dict[str, Any]] = []
    for ln in lines:
        m = line_re.match(ln)
        if not m:
            continue
        qty, desc, unit, ext = m.groups()
        if not re.search(r"[A-Za-z]{3,}", desc):
            continue
        sku_m = re.search(r"\b([A-Z0-9]{2,}[-][A-Z0-9]{2,}|\b[A-Z]{2,}[0-9]{3,}\b)", desc)
        brand_m = re.match(r"([A-Z][A-Za-z&\.']+(?:\s+[A-Z][A-Za-z&\.']+)?)", desc.strip())
        items.append({
            "name": desc.strip(),
            "brand": brand_m.group(1) if brand_m else None,
            "sku": sku_m.group(1) if sku_m else None,
            "quantity": float(qty),
            "unit_price": float(unit.replace(",", "")),
            "extended_price": float(ext.replace(",", "")),
        })

    return {
        "po_number": po_number,
        "vendor": vendor,
        "subtotal": subtotal,
        "tax": tax,
        "shipping": shipping,
        "total": total,
        "items": items,
    }


# ============================================================================
# ROUTES
# ============================================================================
@router.post("", response_model=PurchaseOrder)
async def create_po(payload: PurchaseOrderCreate):
    db = _get_db()
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    po = PurchaseOrder(
        project_id=payload.project_id,
        po_number=payload.po_number or f"PO-{uuid.uuid4().hex[:8].upper()}",
        vendor=payload.vendor,
        line_items=payload.line_items,
        subtotal=payload.subtotal,
        tax=payload.tax,
        shipping=payload.shipping,
        total=payload.total,
        status=payload.status,
        deposit_amount=payload.deposit_amount,
        balance_amount=payload.balance_amount,
        balance_due_at=payload.balance_due_at,
        notes=payload.notes,
    )
    doc = po.dict()
    _recompute_totals(doc)
    _apply_payment_status(doc)
    await db.purchase_orders.insert_one(doc)
    return _serialize(doc)


@router.get("")
async def list_pos(project_id: Optional[str] = None, status: Optional[str] = None, limit: int = 200):
    db = _get_db()
    q: Dict[str, Any] = {}
    if project_id:
        q["project_id"] = project_id
    if status:
        q["status"] = status
    docs = await db.purchase_orders.find(q).sort("created_at", -1).limit(limit).to_list(limit)
    return [_serialize(d) for d in docs]


@router.get("/summary")
async def po_summary(project_id: Optional[str] = None):
    """Aggregate metrics for the POs dashboard."""
    db = _get_db()
    q: Dict[str, Any] = {}
    if project_id:
        q["project_id"] = project_id
    docs = await db.purchase_orders.find(q).to_list(1000)
    total = sum(float(d.get("total") or 0) for d in docs)
    paid = sum(sum(float(p.get("amount") or 0) for p in d.get("payments") or []) for d in docs)
    by_status: Dict[str, int] = {}
    for d in docs:
        st = d.get("status", "draft")
        by_status[st] = by_status.get(st, 0) + 1
    return {
        "count": len(docs),
        "total_value": round(total, 2),
        "total_paid": round(paid, 2),
        "total_outstanding": round(max(0.0, total - paid), 2),
        "by_status": by_status,
    }


@router.get("/{po_id}", response_model=PurchaseOrder)
async def get_po(po_id: str):
    db = _get_db()
    doc = await db.purchase_orders.find_one({"id": po_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return _serialize(doc)


@router.patch("/{po_id}", response_model=PurchaseOrder)
async def update_po(po_id: str, payload: PurchaseOrderUpdate):
    db = _get_db()
    doc = await db.purchase_orders.find_one({"id": po_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    if payload.status and payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    update = {k: v for k, v in payload.dict().items() if v is not None}
    if "line_items" in update:
        update["line_items"] = [li.dict() if hasattr(li, "dict") else li for li in update["line_items"]]

    # Recompute totals if line_items changed
    doc.update(update)
    _recompute_totals(doc)
    _apply_payment_status(doc)
    doc["updated_at"] = _now_iso()
    await db.purchase_orders.replace_one({"id": po_id}, doc)
    return _serialize(doc)


@router.delete("/{po_id}")
async def delete_po(po_id: str):
    db = _get_db()
    res = await db.purchase_orders.delete_one({"id": po_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return {"ok": True}


class PaymentIn(BaseModel):
    amount: float
    method: str = "unknown"
    kind: str = "payment"            # "deposit" | "balance" | "payment"
    date: Optional[str] = None
    reference: Optional[str] = None
    receipt_url: Optional[str] = None
    note: Optional[str] = None


@router.post("/{po_id}/payments", response_model=PurchaseOrder)
async def add_payment(po_id: str, payment: PaymentIn):
    db = _get_db()
    doc = await db.purchase_orders.find_one({"id": po_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    pay = Payment(
        amount=payment.amount,
        method=payment.method,
        kind=payment.kind,
        date=payment.date or _now_iso(),
        reference=payment.reference,
        receipt_url=payment.receipt_url,
        note=payment.note,
    ).dict()

    payments = doc.get("payments") or []
    payments.append(pay)
    doc["payments"] = payments

    # Update deposit/balance markers if this payment kind implies one
    if payment.kind == "deposit":
        doc["deposit_paid_at"] = pay["date"]
    elif payment.kind == "balance":
        doc["balance_paid_at"] = pay["date"]

    _apply_payment_status(doc)
    doc["updated_at"] = _now_iso()
    await db.purchase_orders.replace_one({"id": po_id}, doc)
    return _serialize(doc)


@router.delete("/{po_id}/payments/{payment_id}", response_model=PurchaseOrder)
async def delete_payment(po_id: str, payment_id: str):
    db = _get_db()
    doc = await db.purchase_orders.find_one({"id": po_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    payments = doc.get("payments") or []
    new_payments = [p for p in payments if p.get("id") != payment_id]
    if len(new_payments) == len(payments):
        raise HTTPException(status_code=404, detail="Payment not found")
    doc["payments"] = new_payments
    _apply_payment_status(doc)
    doc["updated_at"] = _now_iso()
    await db.purchase_orders.replace_one({"id": po_id}, doc)
    return _serialize(doc)


class ReceiptIn(BaseModel):
    label: Optional[str] = None
    data_base64: str                # base64-encoded file bytes
    filename: Optional[str] = None
    content_type: Optional[str] = None


@router.post("/{po_id}/receipts", response_model=PurchaseOrder)
async def add_receipt(po_id: str, receipt: ReceiptIn):
    """Store a small receipt directly as a data URL. For big files use S3-style hosting."""
    db = _get_db()
    doc = await db.purchase_orders.find_one({"id": po_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    try:
        raw = base64.b64decode(receipt.data_base64.split(",")[-1])  # tolerate "data:...;base64," prefix
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64: {exc}")

    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Receipt is > 5MB — use hosted uploads")

    ct = receipt.content_type or "application/octet-stream"
    data_url = f"data:{ct};base64,{base64.b64encode(raw).decode()}"
    receipts = doc.get("receipts") or []
    receipts.append({
        "id": f"r_{uuid.uuid4().hex[:10]}",
        "url": data_url,
        "label": receipt.label or receipt.filename or "Receipt",
        "filename": receipt.filename,
        "content_type": ct,
        "size": len(raw),
        "uploaded_at": _now_iso(),
    })
    doc["receipts"] = receipts
    doc["updated_at"] = _now_iso()
    await db.purchase_orders.replace_one({"id": po_id}, doc)
    return _serialize(doc)


@router.delete("/{po_id}/receipts/{receipt_id}", response_model=PurchaseOrder)
async def delete_receipt(po_id: str, receipt_id: str):
    db = _get_db()
    doc = await db.purchase_orders.find_one({"id": po_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    receipts = doc.get("receipts") or []
    new_receipts = [r for r in receipts if r.get("id") != receipt_id]
    if len(new_receipts) == len(receipts):
        raise HTTPException(status_code=404, detail="Receipt not found")
    doc["receipts"] = new_receipts
    doc["updated_at"] = _now_iso()
    await db.purchase_orders.replace_one({"id": po_id}, doc)
    return _serialize(doc)


@router.post("/import-from-pdf", response_model=PurchaseOrder)
async def import_from_pdf(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    mark_paid: bool = Form(False),
):
    """User uploads a PO PDF (vendor confirmation, Houzz PO export, etc.)."""
    db = _get_db()
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
            detail="Could not read any text from the PDF. If it's a scan, please rescan with OCR.",
        )

    parsed = _parse_po_pdf_text(text)

    # Resolve manufacturer link for each line item.
    line_items = []
    for it in parsed["items"]:
        manuf, _ = resolve_manufacturer_link(
            source_url=None, brand=it.get("brand"), sku=it.get("sku"), name=it.get("name"),
        )
        it["manufacturer_link"] = manuf
        line_items.append(it)

    po = PurchaseOrder(
        project_id=project_id,
        po_number=parsed.get("po_number") or f"PO-{uuid.uuid4().hex[:8].upper()}",
        vendor=parsed.get("vendor") or "Unknown",
        line_items=[LineItem(**it) for it in line_items],
        subtotal=parsed.get("subtotal"),
        tax=parsed.get("tax"),
        shipping=parsed.get("shipping"),
        total=parsed.get("total"),
        status="paid" if mark_paid else "pending",
        source="pdf_import",
    )
    doc = po.dict()
    _recompute_totals(doc)
    if mark_paid and (doc.get("total") or 0) > 0:
        doc["payments"] = [Payment(
            amount=doc["total"], method="unknown", kind="payment",
            note=f"Auto-recorded from PDF import ({file.filename})",
        ).dict()]
    _apply_payment_status(doc)
    await db.purchase_orders.insert_one(doc)
    logger.info("📦 PO PDF import: %s items from %s", len(line_items), file.filename)
    return _serialize(doc)
