"""
Manufacturer Link Resolver
==========================

Given a brand/manufacturer name and a SKU (or product name), returns the
ACTUAL MANUFACTURER product page URL — never a retailer/reseller.

CRITICAL RULE (per user requirement, absolute):
    Retailers/vendors like Wayfair, Amazon, Ballard Designs, West Elm, CB2,
    Crate & Barrel, Perigold, Overstock, Houzz Marketplace, etc. are FORBIDDEN.
    Even if the Houzz proposal line item points at one of them, we must swap
    to the manufacturer's own website.

The resolver has three layers:
    1. If the source URL is already on a known manufacturer domain -> keep it.
    2. If the source URL is on a known retailer domain -> reject; build a
       manufacturer search URL using the brand mapping + SKU/name.
    3. Fallback -> return None (caller decides how to handle).
"""

from __future__ import annotations

from typing import Optional, Dict, Tuple
from urllib.parse import quote_plus, urlparse
import re


# ============================================================================
# BRAND -> MANUFACTURER DOMAIN MAP
# ============================================================================
# Key: normalized brand name (lowercase, alphanumeric only).
# Value: dict describing how to build a manufacturer product/search URL.
#
# `search_url` supports {sku} placeholder that gets URL-encoded at runtime.
# ============================================================================
BRAND_MANUFACTURERS: Dict[str, Dict[str, str]] = {
    # ----- Furniture -----
    "fourhands":       {"domain": "fourhands.com",        "search_url": "https://fourhands.com/search?q={sku}"},
    "fourhandshome":   {"domain": "fourhands.com",        "search_url": "https://fourhands.com/search?q={sku}"},
    "bernhardt":       {"domain": "bernhardt.com",        "search_url": "https://www.bernhardt.com/search?q={sku}"},
    "hooker":          {"domain": "hookerfurniture.com",  "search_url": "https://www.hookerfurniture.com/search?searchTerm={sku}"},
    "hookerfurniture": {"domain": "hookerfurniture.com",  "search_url": "https://www.hookerfurniture.com/search?searchTerm={sku}"},
    "gabby":           {"domain": "gabbyhome.com",        "search_url": "https://gabbyhome.com/search?q={sku}"},
    "arteriors":       {"domain": "arteriorshome.com",    "search_url": "https://www.arteriorshome.com/search?q={sku}"},
    "arteriorshome":   {"domain": "arteriorshome.com",    "search_url": "https://www.arteriorshome.com/search?q={sku}"},
    "madegoods":       {"domain": "madegoods.com",        "search_url": "https://www.madegoods.com/search?q={sku}"},
    "vanguard":        {"domain": "vanguardfurniture.com","search_url": "https://www.vanguardfurniture.com/search?q={sku}"},
    "vanguardfurniture":{"domain":"vanguardfurniture.com","search_url": "https://www.vanguardfurniture.com/search?q={sku}"},
    "century":         {"domain": "centuryfurniture.com", "search_url": "https://www.centuryfurniture.com/search?q={sku}"},
    "centuryfurniture":{"domain": "centuryfurniture.com", "search_url": "https://www.centuryfurniture.com/search?q={sku}"},
    "leefurniture":    {"domain": "leefurniture.com",     "search_url": "https://www.leefurniture.com/search?q={sku}"},
    "lee":             {"domain": "leefurniture.com",     "search_url": "https://www.leefurniture.com/search?q={sku}"},
    "cistoneshoreline":{"domain": "shorelineinteriors.com","search_url": "https://shorelineinteriors.com/search?q={sku}"},
    "worldsawayhome":  {"domain": "worldsaway.com",       "search_url": "https://worldsaway.com/search?q={sku}"},
    "worldsaway":      {"domain": "worldsaway.com",       "search_url": "https://worldsaway.com/search?q={sku}"},
    "cisco":           {"domain": "ciscohome.com",        "search_url": "https://ciscohome.com/search?q={sku}"},
    "ciscohome":       {"domain": "ciscohome.com",        "search_url": "https://ciscohome.com/search?q={sku}"},
    "bassett":         {"domain": "bassettfurniture.com", "search_url": "https://www.bassettfurniture.com/search.aspx?q={sku}"},
    "bassettmirror":   {"domain": "bassettmirror.com",    "search_url": "https://www.bassettmirror.com/search?q={sku}"},
    "hancockmoore":    {"domain": "hancockandmoore.com",  "search_url": "https://www.hancockandmoore.com/search?q={sku}"},
    "hancockandmoore": {"domain": "hancockandmoore.com",  "search_url": "https://www.hancockandmoore.com/search?q={sku}"},
    "kravet":          {"domain": "kravet.com",           "search_url": "https://www.kravet.com/search?searchtext={sku}"},
    "leejofa":         {"domain": "leejofa.com",          "search_url": "https://www.leejofa.com/search?searchtext={sku}"},
    "safavieh":        {"domain": "safaviehhome.com",     "search_url": "https://www.safaviehhome.com/search?q={sku}"},

    # ----- Lighting -----
    "uttermost":            {"domain": "uttermost.com",       "search_url": "https://www.uttermost.com/en-us/searchresults?searchTerm={sku}"},
    "visualcomfort":        {"domain": "visualcomfort.com",   "search_url": "https://www.visualcomfort.com/us_en/search?text={sku}"},
    "visualcomfortandco":   {"domain": "visualcomfort.com",   "search_url": "https://www.visualcomfort.com/us_en/search?text={sku}"},
    "hudsonvalleylighting": {"domain": "hudsonvalleylighting.com","search_url": "https://www.hudsonvalleylighting.com/search?type=product&q={sku}"},
    "hvl":                  {"domain": "hudsonvalleylighting.com","search_url": "https://www.hudsonvalleylighting.com/search?type=product&q={sku}"},
    "hinkley":              {"domain": "hinkley.com",         "search_url": "https://www.hinkley.com/search?searchword={sku}"},
    "hinkleylighting":      {"domain": "hinkley.com",         "search_url": "https://www.hinkley.com/search?searchword={sku}"},
    "kichler":              {"domain": "kichler.com",         "search_url": "https://www.kichler.com/search-results?q={sku}"},
    "circalighting":        {"domain": "circalighting.com",   "search_url": "https://www.circalighting.com/search?q={sku}"},
    "curreyandcompany":     {"domain": "curreyandcompany.com","search_url": "https://www.curreyandcompany.com/search?q={sku}"},
    "currey":               {"domain": "curreyandcompany.com","search_url": "https://www.curreyandcompany.com/search?q={sku}"},
    "regina":               {"domain": "reginaandrew.com",    "search_url": "https://www.reginaandrew.com/search?q={sku}"},
    "reginaandrew":         {"domain": "reginaandrew.com",    "search_url": "https://www.reginaandrew.com/search?q={sku}"},
    "corbett":              {"domain": "corbettlighting.com", "search_url": "https://www.corbettlighting.com/search?type=product&q={sku}"},
    "corbettlighting":      {"domain": "corbettlighting.com", "search_url": "https://www.corbettlighting.com/search?type=product&q={sku}"},
    "mitzi":                {"domain": "mitzi.com",           "search_url": "https://www.mitzi.com/search?type=product&q={sku}"},
    "troy":                 {"domain": "troy-lighting.com",   "search_url": "https://www.troy-lighting.com/search?type=product&q={sku}"},
    "troylighting":         {"domain": "troy-lighting.com",   "search_url": "https://www.troy-lighting.com/search?type=product&q={sku}"},

    # ----- Rugs -----
    "loloi":                {"domain": "loloirugs.com",       "search_url": "https://loloirugs.com/search?q={sku}"},
    "loloirugs":            {"domain": "loloirugs.com",       "search_url": "https://loloirugs.com/search?q={sku}"},
    "jaipur":               {"domain": "jaipurliving.com",    "search_url": "https://www.jaipurliving.com/search?q={sku}"},
    "jaipurliving":         {"domain": "jaipurliving.com",    "search_url": "https://www.jaipurliving.com/search?q={sku}"},
    "surya":                {"domain": "surya.com",           "search_url": "https://www.surya.com/search?q={sku}"},
    "feizy":                {"domain": "feizy.com",           "search_url": "https://www.feizy.com/search?q={sku}"},
    "dashandalbert":        {"domain": "annieselke.com",      "search_url": "https://www.annieselke.com/search?searchword={sku}"},

    # ----- Plumbing / Bath -----
    "kohler":               {"domain": "kohler.com",          "search_url": "https://www.kohler.com/en/search-results/?keyword={sku}"},
    "brizo":                {"domain": "brizo.com",           "search_url": "https://www.brizo.com/search?q={sku}"},
    "delta":                {"domain": "deltafaucet.com",     "search_url": "https://www.deltafaucet.com/search?q={sku}"},
    "deltafaucet":          {"domain": "deltafaucet.com",     "search_url": "https://www.deltafaucet.com/search?q={sku}"},
    "rohl":                 {"domain": "rohlhome.com",        "search_url": "https://www.rohlhome.com/search?q={sku}"},
    "hansgrohe":            {"domain": "hansgrohe-usa.com",   "search_url": "https://www.hansgrohe-usa.com/search?q={sku}"},
    "toto":                 {"domain": "totousa.com",         "search_url": "https://www.totousa.com/search-results?query={sku}"},
    "duravit":              {"domain": "duravit.us",          "search_url": "https://www.duravit.us/search?q={sku}"},
    "kallista":             {"domain": "kallista.com",        "search_url": "https://www.kallista.com/en/search-results/?keyword={sku}"},
    "wattsofresidential":   {"domain": "watersofresidential.com","search_url": "https://www.watersofresidential.com/search?q={sku}"},

    # ----- Appliances -----
    "sub-zero":             {"domain": "subzero-wolf.com",    "search_url": "https://www.subzero-wolf.com/search-results?searchtext={sku}"},
    "subzero":              {"domain": "subzero-wolf.com",    "search_url": "https://www.subzero-wolf.com/search-results?searchtext={sku}"},
    "wolf":                 {"domain": "subzero-wolf.com",    "search_url": "https://www.subzero-wolf.com/search-results?searchtext={sku}"},
    "thermador":            {"domain": "thermador.com",       "search_url": "https://www.thermador.com/us/search?q={sku}"},
    "miele":                {"domain": "mieleusa.com",        "search_url": "https://www.mieleusa.com/e/search-results-{sku}"},
    "monogram":             {"domain": "monogram.com",        "search_url": "https://www.monogram.com/search?q={sku}"},
    "viking":               {"domain": "vikingrange.com",     "search_url": "https://www.vikingrange.com/consumer/search?searchTerm={sku}"},

    # ----- Hardware -----
    "restorationhardware":  {"domain": "rh.com",              "search_url": "https://rh.com/search-results.jsp?N=0&Ntt={sku}"},
    "rh":                   {"domain": "rh.com",              "search_url": "https://rh.com/search-results.jsp?N=0&Ntt={sku}"},
    "emtek":                {"domain": "emtek.com",           "search_url": "https://emtek.com/search?q={sku}"},
    "rockymountainhardware":{"domain": "rockymountainhardware.com","search_url": "https://www.rockymountainhardware.com/search?q={sku}"},
    "topknobs":             {"domain": "topknobs.com",        "search_url": "https://www.topknobs.com/search?q={sku}"},
    "schaub":               {"domain": "schaubandcompany.com","search_url": "https://www.schaubandcompany.com/search?q={sku}"},
}

# Aliases: brand may appear in Houzz as "Four Hands, Inc." — collapse to canonical.
BRAND_ALIASES: Dict[str, str] = {
    "fourhandsinc": "fourhands",
    "fourhandsfurniture": "fourhands",
    "hookerfurniturecorporation": "hooker",
    "hookerfurnitureco": "hooker",
    "visualcomfortco": "visualcomfort",
    "visualcomfortcompany": "visualcomfort",
    "hudsonvalley": "hudsonvalleylighting",
    "curreyco": "curreyandcompany",
    "hancockandmooreleatherfurniture": "hancockandmoore",
    "kohlerco": "kohler",
    "kohlercompany": "kohler",
    "subzerowolf": "subzero",
    "brizohansgrohe": "brizo",
    "loloirugsinc": "loloi",
    "arteriorsinc": "arteriors",
    "wolfsubzero": "wolf",
}


# ============================================================================
# FORBIDDEN RETAILER / RESELLER DOMAINS
# ============================================================================
# If a Houzz proposal points at one of these, we IGNORE the URL and rebuild
# a manufacturer search URL. Per user's explicit and non-negotiable rule.
# ============================================================================
FORBIDDEN_RETAILER_DOMAINS = {
    "wayfair.com", "wayfair.co.uk", "wayfair.ca",
    "amazon.com", "amazon.ca", "amazon.co.uk", "amzn.to",
    "ballarddesigns.com",
    "westelm.com",
    "cb2.com",
    "crateandbarrel.com",
    "potterybarn.com",
    "williams-sonoma.com", "williamssonoma.com",
    "overstock.com", "bedbathandbeyond.com",
    "perigold.com",
    "onekingslane.com",
    "chairish.com", "1stdibs.com",
    "target.com", "walmart.com", "homedepot.com", "lowes.com",
    "houzz.com",  # Houzz Shop / Marketplace — never a manufacturer link
    "etsy.com",
    "ebay.com",
    "worldmarket.com", "cost-plus.com",
    "anthropologie.com", "urbanoutfitters.com",
    "lumens.com",  # aggregator lighting retailer
    "ylighting.com", "1800lighting.com",
    "buildwithferguson.com", "ferguson.com",  # (Ferguson resells but the manufacturer wins)
    "wayside.com",
    "livingspaces.com",
    "raymourflanigan.com",
    "roomsandgardens.com",
    "themoderncustomer.com",
    "shopstyle.com",
    "google.com",  # google shopping / images
    "bing.com",
    "pinterest.com",
    "instagram.com", "facebook.com",
}


# ============================================================================
# HELPERS
# ============================================================================
def _norm_brand(brand: Optional[str]) -> str:
    """Normalize a brand string: lowercase, strip non-alphanumeric."""
    if not brand:
        return ""
    return re.sub(r"[^a-z0-9]", "", brand.lower())


def _domain_of(url: Optional[str]) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url).netloc.lower()
        # strip common leading www.
        if host.startswith("www."):
            host = host[4:]
        return host
    except Exception:
        return ""


def _is_forbidden_retailer(url: Optional[str]) -> bool:
    host = _domain_of(url)
    if not host:
        return False
    for bad in FORBIDDEN_RETAILER_DOMAINS:
        if host == bad or host.endswith("." + bad):
            return True
    return False


def _brand_entry(brand: Optional[str]) -> Optional[Dict[str, str]]:
    key = _norm_brand(brand)
    if not key:
        return None
    if key in BRAND_ALIASES:
        key = BRAND_ALIASES[key]
    return BRAND_MANUFACTURERS.get(key)


def _url_matches_brand(url: Optional[str], brand: Optional[str]) -> bool:
    entry = _brand_entry(brand)
    if not entry:
        return False
    host = _domain_of(url)
    if not host:
        return False
    dom = entry["domain"].lower()
    return host == dom or host.endswith("." + dom)


# ============================================================================
# PUBLIC API
# ============================================================================
def resolve_manufacturer_link(
    source_url: Optional[str],
    brand: Optional[str] = None,
    sku: Optional[str] = None,
    name: Optional[str] = None,
) -> Tuple[Optional[str], str]:
    """
    Return (manufacturer_url, reason) for a Houzz line item.

    Rules:
        1. If source_url is already on the correct manufacturer domain -> keep.
        2. If source_url is on a KNOWN retailer/reseller domain -> swap to a
           manufacturer search URL built from brand + sku.
        3. If source_url is on some unknown 3rd party domain but the brand IS
           a known manufacturer -> swap to a manufacturer search URL.
        4. If brand is not in our map -> return the source_url ONLY IF it is
           not on the forbidden list; otherwise None.

    Args:
        source_url:  URL from the Houzz proposal (may be a retailer).
        brand:       Manufacturer name from the Houzz line item.
        sku:         Product SKU/model number.
        name:        Product name (used as fallback search term).

    Returns:
        (best_url_or_none, human_readable_reason)
    """
    # 1. Perfect case: source URL is on the manufacturer's own domain.
    if source_url and _url_matches_brand(source_url, brand):
        return source_url, "source_url is already the manufacturer's site"

    entry = _brand_entry(brand)
    search_term = (sku or name or "").strip()

    # 2. Forbidden retailer detected. Swap out.
    if _is_forbidden_retailer(source_url):
        if entry and search_term:
            url = entry["search_url"].format(sku=quote_plus(search_term))
            return url, f"source was retailer ({_domain_of(source_url)}); swapped to {entry['domain']} search"
        if entry:
            return f"https://{entry['domain']}/", f"source was retailer; brand {brand} known but no SKU to search"
        # No known brand, source is retailer -> nothing safe to return.
        return None, f"source is retailer ({_domain_of(source_url)}) and brand '{brand or ''}' is unknown — no manufacturer link available"

    # 3. Unknown 3rd party domain, but brand IS known.
    if entry and source_url and not _url_matches_brand(source_url, brand):
        if search_term:
            url = entry["search_url"].format(sku=quote_plus(search_term))
            return url, f"source_url domain didn't match brand; built {entry['domain']} search for '{search_term}'"
        return f"https://{entry['domain']}/", f"source_url didn't match brand; returning {entry['domain']} homepage"

    # 4. Brand not known.
    if not entry:
        if source_url and not _is_forbidden_retailer(source_url):
            return source_url, "brand unknown; keeping source_url (not a known retailer)"
        return None, f"brand '{brand or ''}' unknown, no safe source_url"

    # 5. Brand known but no source_url given.
    if search_term:
        return entry["search_url"].format(sku=quote_plus(search_term)), \
            f"no source_url provided; built {entry['domain']} search for '{search_term}'"
    return f"https://{entry['domain']}/", f"no source_url and no sku; returning {entry['domain']} homepage"


def is_known_manufacturer(brand: Optional[str]) -> bool:
    """True if the brand is in our manufacturer mapping."""
    return _brand_entry(brand) is not None


def known_manufacturer_domains() -> Dict[str, str]:
    """Return {brand_key: domain} for all mapped manufacturers (for diagnostics)."""
    return {k: v["domain"] for k, v in BRAND_MANUFACTURERS.items()}
