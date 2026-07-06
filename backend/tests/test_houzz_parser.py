"""
Regression tests for the Houzz vt-table parser.

Uses REAL captured HTML from the user's Houzz Pro account (stored in
tests/fixtures/). These captures previously broke the parser:
  - Estimate ES-400220: parser read the row number "1.1" as quantity, then a
    math-sanity check deleted 7 of 9 rows.
  - Purchase document IN-10138: edit-view data lives in <input value="…">
    fields the old parser never read.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from houzz_import import _parse_houzz_html, _dedupe_and_validate, HouzzLineItem

FIXTURES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")


def _load(name):
    with open(os.path.join(FIXTURES, name)) as f:
        return f.read()


def _parse(name):
    parsed = _parse_houzz_html(_load(name))
    cleaned = _dedupe_and_validate([HouzzLineItem(**it) for it in parsed["items"]])
    return parsed["meta"], cleaned


# ---------------------------------------------------------------------------
# Estimate preview view (ES-400220)
# ---------------------------------------------------------------------------
class TestEstimatePreview:
    def setup_method(self):
        self.meta, self.items = _parse("houzz_estimate_preview.html")

    def test_all_seven_items_survive(self):
        assert len(self.items) == 7, [i.name for i in self.items]

    def test_room_group_headers_become_room_names_not_items(self):
        names = [i.name for i in self.items]
        assert "SCULLERY" not in names
        assert "MAN CAVE" not in names
        rooms = {i.room_name for i in self.items}
        assert rooms == {"SCULLERY", "MAN CAVE"}

    def test_quantity_comes_from_input_not_row_number(self):
        by_name = {i.name: i for i in self.items}
        assert by_name["Medium Pendant"].quantity == 2
        assert by_name["Swivel Chair"].quantity == 8
        assert by_name["Leather Sofa"].quantity == 1

    def test_unit_price_derived_from_total(self):
        by_name = {i.name: i for i in self.items}
        assert by_name["Medium Pendant"].unit_price == pytest.approx(2599.0)
        assert by_name["Swivel Chair"].unit_price == pytest.approx(2599.0)

    def test_finish_and_dimensions_extracted(self):
        by_name = {i.name: i for i in self.items}
        assert by_name["Medium Pendant"].finish_color == "Natural Brass"
        assert by_name["Leather Sofa"].finish_color == "KL247-13"
        assert by_name["Leather Sofa"].dimensions == '90"L'

    def test_visual_comfort_sku_and_brand(self):
        by_name = {i.name: i for i in self.items}
        pendant = by_name["Milton Road Pendant"]
        assert pendant.sku == "TOB5158"
        assert pendant.brand == "Visual Comfort"

    def test_no_bogus_sku_from_skullery(self):
        by_name = {i.name: i for i in self.items}
        assert by_name["Skullery Chandelier"].sku is None

    def test_meta_totals(self):
        assert self.meta["proposal_number"] == "ES-400220"
        assert self.meta["subtotal"] == pytest.approx(116563.06)
        assert self.meta["total"] == pytest.approx(124722.46)


# ---------------------------------------------------------------------------
# Purchase document edit view (IN-10138 / drapery workroom PO)
# ---------------------------------------------------------------------------
class TestPurchaseDocumentEdit:
    def setup_method(self):
        self.meta, self.items = _parse("houzz_po_edit.html")

    def test_five_fabric_items_no_parents_no_empty_row(self):
        assert len(self.items) == 5, [i.name for i in self.items]
        names = [i.name for i in self.items]
        # Parent wrapper rows must be folded away, not duplicated
        assert "Living Room Drapes" not in names
        assert names.count("Reside") == 3

    def test_input_value_fields_extracted(self):
        by_room = {i.room_name: i for i in self.items}
        lr = by_room["LIVING ROOM"]
        assert lr.name == "Reside"
        assert lr.brand == "Kasmir"
        assert lr.sku == "5198 / 41"
        assert lr.quantity == 7
        assert lr.unit_type == "Yards"
        assert lr.unit_cost == pytest.approx(33.0)
        assert lr.finish_color == "Antique"
        assert lr.dimensions == "57 (Inches)"
        assert "Polyester" in lr.materials

    def test_rooms_come_from_add_room_inputs(self):
        rooms = {i.room_name for i in self.items}
        assert rooms == {"LIVING ROOM", "LADIES TV ROOM", "BAR", "DINING ROOM", "PRIMARY BEDROOM"}

    def test_extended_price_inherited_from_parent(self):
        by_room = {i.room_name: i for i in self.items}
        assert by_room["PRIMARY BEDROOM"].extended_price == pytest.approx(935.85)

    def test_parent_name_recorded(self):
        by_room = {i.room_name: i for i in self.items}
        assert by_room["LIVING ROOM"].parent_name == "Living Room Drapes"


# ---------------------------------------------------------------------------
# Dedupe safety-net behaviour
# ---------------------------------------------------------------------------
class TestDedupe:
    def test_math_mismatch_rows_are_kept(self):
        """7 Yards @ $33 -> $231 line total must NOT be dropped."""
        items = [HouzzLineItem(name="Fabric", quantity=7, unit_price=33.0, extended_price=231.0)]
        assert len(_dedupe_and_validate(items)) == 1

    def test_totals_rows_dropped(self):
        items = [HouzzLineItem(name="Subtotal", extended_price=999.0),
                 HouzzLineItem(name="Grand Total", extended_price=999.0),
                 HouzzLineItem(name="Real Item", extended_price=10.0)]
        kept = _dedupe_and_validate(items)
        assert [i.name for i in kept] == ["Real Item"]

    def test_empty_stub_row_dropped(self):
        items = [HouzzLineItem(name=None, quantity=0, extended_price=0)]
        assert _dedupe_and_validate(items) == []

    def test_duplicates_collapse(self):
        items = [HouzzLineItem(name="Chair", quantity=1, extended_price=100.0),
                 HouzzLineItem(name="Chair", quantity=1, extended_price=100.0)]
        assert len(_dedupe_and_validate(items)) == 1
