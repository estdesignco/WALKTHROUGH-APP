# UPDATE NOTE (Feb 26, 2026 — latest)

The user has added 3 new agent-behavior rules that must be honored by any rendering / proposal / checklist logic ChatGPT proposes:

## 1. Render Must Match Sourced Pieces

The rendered room **must** use the actual sourced pieces.

If the agent identifies or links specific furniture, lighting, rugs, wallcoverings, mirrors, art, or decor as the proposed solution, the rendered concept must actually use those identified or linked pieces.

The agent **must not**:
- link one product while visually rendering a different product
- suggest one lighting family while placing unrelated lighting in the image
- present a concept where the written/source selections and the rendered room do not match

When suggestions come from approved vendor lines, the rendered solution must stay materially consistent with those selected pieces. Source selection and rendered output must always remain aligned.

## 2. Floor Plan Interpretation

When a floor plan, architectural plan, or dimensioned layout is provided, use it as a primary planning input for furniture selection and placement.

The agent must:
- read the floor plan to understand room shape, wall lengths, openings, circulation, and major constraints
- choose furniture sizes and layouts that fit the real room dimensions and movement paths
- avoid selecting pieces that overcrowd the room, block circulation, or ignore the plan geometry
- use the floor plan to guide scale, spacing, seating depth, rug sizing, and placement logic
- keep the final room appropriately furnished without making it feel undersized or compressed

If both a room image and a floor plan are provided:
- use the floor plan for spatial fit
- use the room image for architectural character and finish context

## 3. Item Identity Preservation Across The Whole Workflow

Once a piece is identified and linked as the selected piece, that same piece must carry through into the room concept, later edits, and alternate angles.

The agent must:
- preserve the linked piece's identity from initial identification → rendering → edits → angle changes → checklist entry
- not silently substitute a different but similar-looking item at any step
- treat the originally-linked vendor product as the source of truth for that slot in the room
- if a true substitution is required, surface it explicitly rather than making it silently

---

## Existing rules that MUST remain active

- follow instructions literally
- do not change/swap/remove/restyle items unless explicitly directed
- do not shrink rooms
- clear rooms of furniture without making them smaller
- preserve room continuity across angles
- treat each wall independently
- exact paint matching for Sherwin-Williams, Benjamin Moore, and Farrow & Ball
- wallpaper should be applied at realistic installed scale unless directed otherwise
- use approved vendor sources first
- use established furniture lines first for furniture suggestions
- empty-room concepting should preserve the shell and room size
- theater/media rooms should avoid ugly obvious recliners by default unless explicitly requested
- minimize back-and-forth and act directly when the request is clear

Why these changes are needed (user's own words):
> The first render produced beautiful linked furniture, but the actual rendered room did not use those same pieces. I need source selection and rendered output to stay aligned, and I need the assistant to use floor plans to select pieces that truly fit the room.

---

# What's changed in the codebase since the previous bundle

## A) New endpoint: `POST /api/ai-assist/ingest-canva-url`

Lives at `/app/backend/server.py` (right above `/api/ai-assist/ingest-pdf`). Replaces the manual "Save → Download → Drag PDF" UX with a paste-the-Canva-URL flow:

```
User pastes  https://www.canva.com/design/DAG.../view
   ↓
extract_design_id_from_url() → "DAG..."
   ↓
GET /v1/designs/{design_id}                  (Canva Connect API, documented)
   ↓  returns title, thumbnail, owner, urls.view_url
POST /v1/exports  body={design_id, format:{type:"pdf"}}
   ↓
poll GET /v1/exports/{job_id} every 2s
   ↓  status='success' → urls[]
download PDF(s), glue with pypdf if multi-part
   ↓
hand off to the existing /ai-assist/ingest-pdf pipeline (no duplication)
```

`/app/backend/canva_integration.py` got 3 new methods:
- `extract_design_id_from_url(canva_url) -> str|None`   (regex `/design/(DAG[A-Za-z0-9_-]+)`)
- `get_design(design_id) -> dict`                       (GET /v1/designs/{id})
- `export_design_as_pdf(design_id) -> dict`             (POST /v1/exports)
- `poll_export_until_done(job_id, max_wait_s) -> dict`  (GET /v1/exports/{id})

**Why this path** instead of a speculative `GET /v1/designs/{id}/elements?with_hyperlinks=true`:
Canva's Connect API documentation as of Feb 2026 does NOT publicly confirm that per-element hyperlinks are exposed in the design-content response. The `design:content` scope and "read element layout/contents" capability are documented, but the response schema for hyperlink retrieval is **unconfirmed**. Server-side PDF export is the fully-documented path that preserves hyperlink annotations, so that's what we ship.

**Research ask for ChatGPT/Claude/Gemini**: do you have any source confirming Canva's design-content response includes per-element `link` / `href` fields? If yes, name the endpoint + field path. If no, this PDF-via-export approach stays.

---

# Bundle anchor for the original brief

Everything else in `/app/memory/CHATGPT_BUNDLE.md` (the architecture, vendor login screenshots, scraper code, PDF pipeline, etc.) is still accurate. Append this update note when you forward it.
