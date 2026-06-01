"""
Regression test for HVL Group / Bernhardt-style invalid JSON-LD parsing.

These vendors ship JSON-LD with JS-style `//` comments and trailing commas,
which is invalid JSON. Browsers tolerate it but `json.loads` chokes. Without
the safe parser we silently lose price, sku, finish, and size on every
item from these vendors.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import _safe_jsonld_parse


HVL_REAL_JSONLD = """
    {
        "@context": "https://schema.org",
        "@type": "Product",

        // Core identity
        "name": "Chambers Chandelier",
        "sku": "2758-AOB",
        "mpn": "2758-AOB",
        "gtin12": "806134857783",
        "url": "https://www.hvlgroup.com/Product/2758-AOB/",

        // Description & media
        "description": "",
        "image": [
            "https://cdnbf.hvlgroup.com/example/2758-AOB.png",
        ],

        // Brand
        "brand": {
            "@type": "Brand",
            "name": "Hudson Valley Lighting"
        },

        // Offers (price & availability)
        "offers": {
            "@type": "Offer",
            "url": "https://www.hvlgroup.com/Product/2758-AOB/",
            "priceCurrency": "USD",
            "price": "5410.00",
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
                "@type": "Organization",
                "name": "HVL Group"
            }
        }
    }
"""


def test_safe_parser_handles_line_comments():
    data = _safe_jsonld_parse(HVL_REAL_JSONLD)
    assert data is not None, "parser must return data even with // comments"
    assert data["sku"] == "2758-AOB"
    assert data["name"] == "Chambers Chandelier"
    assert data["offers"]["price"] == "5410.00"
    assert data["brand"]["name"] == "Hudson Valley Lighting"


def test_safe_parser_strips_trailing_commas():
    invalid = '{"a": 1, "b": [1, 2, 3,], "c": {"d": 4,},}'
    data = _safe_jsonld_parse(invalid)
    assert data == {"a": 1, "b": [1, 2, 3], "c": {"d": 4}}


def test_safe_parser_preserves_urls_in_strings():
    """// in a URL string must NOT be stripped as a comment."""
    valid = '{"url": "https://example.com/path", "name": "X"}'
    data = _safe_jsonld_parse(valid)
    assert data["url"] == "https://example.com/path"
    assert data["name"] == "X"


def test_safe_parser_handles_block_comments():
    src = """
    {
        /* this is a block comment */
        "key": "value"
    }
    """
    data = _safe_jsonld_parse(src)
    assert data == {"key": "value"}


def test_safe_parser_returns_none_on_garbage():
    assert _safe_jsonld_parse("") is None
    assert _safe_jsonld_parse(None) is None
    assert _safe_jsonld_parse("this is not json at all {{{") is None


if __name__ == "__main__":
    test_safe_parser_handles_line_comments()
    test_safe_parser_strips_trailing_commas()
    test_safe_parser_preserves_urls_in_strings()
    test_safe_parser_handles_block_comments()
    test_safe_parser_returns_none_on_garbage()
    print("✅ all 5 jsonld safe parser tests passed")
