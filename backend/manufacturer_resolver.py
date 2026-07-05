"""
Manufacturer Link Resolver
==========================

Single, non-negotiable rule:

    manufacturer_link may ONLY point at one of the manufacturer domains
    that the user has EXPLICITLY approved in `vendor_portals._URL_DOMAIN_TO_KEY`.

    If we can't produce a link on one of those domains, we return None.
    We do NOT construct links to any other website — period.

Source of truth: `vendor_portals._URL_DOMAIN_TO_KEY` (21 approved domains).
Adding a vendor there automatically enables it here.
"""

from __future__ import annotations

from typing import Optional, Dict, Tuple
from urllib.parse import quote_plus, urlparse
import re

from vendor_portals import _URL_DOMAIN_TO_KEY

# ============================================================================
# APPROVED MANUFACTURER MAP
#   built directly from vendor_portals._URL_DOMAIN_TO_KEY so we never drift.
# ============================================================================
# Per-brand search URL template. If a brand isn't listed here, we fall back
# to `https://{domain}/search?q={sku}` which most e-commerce sites accept.
_SEARCH_URL_OVERRIDES: Dict[str, str] = {
    "uttermost.com":            "https://www.uttermost.com/en-us/searchresults?searchTerm={sku}",
    "visualcomfort.com":        "https://www.visualcomfort.com/us_en/search?text={sku}",
    "hvlgroup.com":             "https://www.hvlgroup.com/search?q={sku}",
    "bernhardt.com":            "https://www.bernhardt.com/search?q={sku}",
    "fourhands.com":            "https://fourhands.com/search?q={sku}",
    "loloirugs.com":            "https://loloirugs.com/search?q={sku}",
    "gabby.com":                "https://gabby.com/search?q={sku}",
    "surya.com":                "https://www.surya.com/search?q={sku}",
    "safavieh.com":             "https://www.safavieh.com/search?q={sku}",
    "reginaandrew.com":         "https://www.reginaandrew.com/search?q={sku}",
    "globalviews.com":          "https://www.globalviews.com/search?q={sku}",
    "vandh.com":                "https://www.vandh.com/search?q={sku}",
    "flowdecor.com":            "https://www.flowdecor.com/search?q={sku}",
    "crestviewcollection.com":  "https://www.crestviewcollection.com/search?q={sku}",
    "eichholtz.com":            "https://www.eichholtz.com/en/search?q={sku}",
    "myohamerica.com":          "https://myohamerica.com/search?q={sku}",
    "rowefurniture.com":        "https://www.rowefurniture.com/search?q={sku}",
    "bassettmirror.com":        "https://www.bassettmirror.com/search?q={sku}",
    "phillipjeffries.com":      "https://www.phillipjeffries.com/search?q={sku}",
    "yorkwallcoverings.com":    "https://www.yorkwallcoverings.com/search?q={sku}",
    "classichome.com":          "https://classichome.com/search?q={sku}",
}

# Brand-name aliases that map to a vendor_key. Houzz proposals often print
# a manufacturer name with punctuation / different casing / abbreviations.
_BRAND_TO_VENDOR_KEY_ALIASES: Dict[str, str] = {
    # Four Hands
    "fourhands": "four_hands",
    "fourhandsinc": "four_hands",
    "fourhandshome": "four_hands",
    "fourhandsfurniture": "four_hands",
    "four hands": "four_hands",
    # Visual Comfort
    "visualcomfort": "visual_comfort",
    "visualcomfortco": "visual_comfort",
    "visualcomfortandco": "visual_comfort",
    "visualcomfortcompany": "visual_comfort",
    # HVL / Hudson Valley
    "hvl": "hvl_group",
    "hvlgroup": "hvl_group",
    "hudsonvalley": "hvl_group",
    "hudsonvalleylighting": "hvl_group",
    "hudsonvalleylightinggroup": "hvl_group",
    # Regina Andrew
    "regina": "regina_andrew",
    "reginaandrew": "regina_andrew",
    "reginaandrewdesign": "regina_andrew",
    # Global Views
    "globalviews": "global_views",
    # Bernhardt
    "bernhardt": "bernhardt",
    "bernhardtfurniture": "bernhardt",
    "bernhardtinteriors": "bernhardt",
    "bernhardtexteriors": "bernhardt",
    # Rowe
    "rowe": "rowe",
    "rowefurniture": "rowe",
    # Loloi
    "loloi": "loloi",
    "loloirugs": "loloi",
    "loloii": "loloi",
    "loloiinc": "loloi",
    # Uttermost
    "uttermost": "uttermost",
    "uttermostco": "uttermost",
    "uttermostcompany": "uttermost",
    # Gabby
    "gabby": "gabby",
    "gabbyhome": "gabby",
    # Bassett Mirror
    "bassett": "bassett_mirror",
    "bassettmirror": "bassett_mirror",
    "bassettmirrorcompany": "bassett_mirror",
    # Surya
    "surya": "surya",
    "suryarugs": "surya",
    # Safavieh
    "safavieh": "safavieh",
    "safaviehhome": "safavieh",
    # V and H
    "vandh": "vandh",
    "vandhcompany": "vandh",
    "vandhinteriors": "vandh",
    # Flow Decor
    "flow": "flow_decor",
    "flowdecor": "flow_decor",
    # Crestview Collection
    "crestview": "crestview_collection",
    "crestviewcollection": "crestview_collection",
    # Eichholtz
    "eichholtz": "eichholtz",
    # MOH America
    "moh": "moh_america",
    "mohamerica": "moh_america",
    "myohamerica": "moh_america",
    # Wallpaper
    "phillipjeffries": "phillip_jeffries",
    "phillipjeffriesltd": "phillip_jeffries",
    "york": "york_wallcoverings",
    "yorkwallcoverings": "york_wallcoverings",
    # Classic Home
    "classichome": "classic_home",
}


def _key_to_domain() -> Dict[str, str]:
    """Reverse `_URL_DOMAIN_TO_KEY` into vendor_key -> domain."""
    return {v: k for k, v in _URL_DOMAIN_TO_KEY.items()}


_KEY_TO_DOMAIN = _key_to_domain()
_APPROVED_DOMAINS = set(_URL_DOMAIN_TO_KEY.keys())


# ============================================================================
# HELPERS
# ============================================================================
def _norm(s: Optional[str]) -> str:
    if not s:
        return ""
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _domain_of(url: Optional[str]) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        return host
    except Exception:
        return ""


def _vendor_key_for_brand(brand: Optional[str]) -> Optional[str]:
    """Map a brand name to a vendor_key by consulting the alias table."""
    if not brand:
        return None
    key = _norm(brand)
    if key in _BRAND_TO_VENDOR_KEY_ALIASES:
        return _BRAND_TO_VENDOR_KEY_ALIASES[key]
    # If a brand string like "Four Hands" wasn't caught, try substring match
    # against the alias keys (only long, distinctive tokens).
    for alias_key, vk in _BRAND_TO_VENDOR_KEY_ALIASES.items():
        if len(alias_key) >= 6 and alias_key in key:
            return vk
    return None


def _is_approved_domain(url: Optional[str]) -> Optional[str]:
    """If `url` is on an approved manufacturer domain, return that domain."""
    host = _domain_of(url)
    if not host:
        return None
    for dom in _APPROVED_DOMAINS:
        if host == dom or host.endswith("." + dom):
            return dom
    return None


def _search_url(domain: str, sku: str) -> str:
    tpl = _SEARCH_URL_OVERRIDES.get(domain, "https://{d}/search?q={{sku}}".format(d=domain))
    return tpl.format(sku=quote_plus(sku))


# ============================================================================
# PUBLIC API
# ============================================================================
def resolve_manufacturer_link(
    source_url: Optional[str] = None,
    brand: Optional[str] = None,
    sku: Optional[str] = None,
    name: Optional[str] = None,
) -> Tuple[Optional[str], str]:
    """
    Return (manufacturer_url, reason).

    Rules — in strict order:
      1. If `source_url` is already on one of the APPROVED domains -> return it.
      2. If `brand` maps to a known vendor_key -> return a search URL on that
         approved domain, using SKU (preferred) or product name.
      3. Otherwise -> return (None, reason). We NEVER return a URL that is
         not on an approved domain.
    """
    # 1. Source URL is already on one of the approved manufacturer domains.
    approved_dom = _is_approved_domain(source_url)
    if approved_dom:
        return source_url, f"source_url is on approved manufacturer site ({approved_dom})"

    # 2. Try to derive from brand.
    vk = _vendor_key_for_brand(brand)
    if vk and vk in _KEY_TO_DOMAIN:
        dom = _KEY_TO_DOMAIN[vk]
        query = (sku or name or "").strip()
        if query:
            return _search_url(dom, query), f"built {dom} search for '{query}'"
        return f"https://{dom}/", f"brand mapped to {dom} (no SKU to search)"

    # 3. Nothing safe to return.
    if brand:
        return None, f"brand '{brand}' is not in your approved manufacturer list"
    return None, "no brand and source_url is not on an approved manufacturer site"


def is_known_manufacturer(brand: Optional[str]) -> bool:
    """True if this brand maps to an approved manufacturer domain."""
    return _vendor_key_for_brand(brand) is not None


def known_manufacturer_domains() -> Dict[str, str]:
    """Return {vendor_key: domain} for all approved manufacturers."""
    return dict(_KEY_TO_DOMAIN)


def approved_domains() -> set:
    """The full set of approved manufacturer domains."""
    return set(_APPROVED_DOMAINS)
