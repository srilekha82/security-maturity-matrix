# HTML Architecture Reference

Authoritative spec for `NIST_CSF_Assessment.html`.

---

## Tab structure

| Tab ID | Button label | Purpose |
|--------|-------------|---------|
| `summary` | Summary | Presentation overview — 3 stacked sections |
| `maturity` | Maturity Assessment | Slide-style table, gap rows only |
| `gaps` | Gap Analysis & Fulfillment | Full gap table + roadmap |
| `assessment` | Assessment Detail | Every included row + XLS upload |

Tab switching: CSS class `active` on `.page` div and `.tab` button.
Scroll-to-anchor: `navigateToTab(tabId, anchorId)` — anchors used are
`gap-section` and `roadmap-section` on Tab 3.

---

## Tab 1 — Summary (3 sections, stacked vertically)

### Section 1 — Executive Summary
Class: `.summary-section`
Layout: `.exec-grid` — 3 columns (Situation | Key Findings | The Ask)

**Situation panel** (`.exec-panel--situation`, bg `var(--lgray)`):
- Intro paragraph about the organisation's context, from the XLS `Notes` of the profile or text the user gives
  (never invented)
- 3 tagged blocks: Why this matters / Scope (subcategories in the profile) / Approach (self-assessment against
  CSF 2.0)
- Border-left `var(--ink)`

**Key Findings panel** (`.exec-panel--findings`, bg `#F1F5F9`):
- Intro line: "{n} subcategories assessed" (count of included rows)
- `.findings-grid` 2×2: Overall Tier | Gap count | Detect tier | Respond/Recover
- Values are dynamic — computed from `profileData` via `getOverallAvg()`,
  `getGaps().length`, `getFnAvg('Detect')`

**The Ask panel** (`.exec-panel--ask`, bg `var(--accent-soft)`):
- Intro: "Phased roadmap derived from the gaps…"
- One card per non-empty phase: Phase 1 (0–3m, High) / Phase 2 (3–6m, Medium) / Phase 3 (6–12m, Low)

### Section 2 — Maturity Radar
Class: `.summary-section.summary-section--clickable`
`onclick="navigateToTab('maturity')"`

Contains:
- `<canvas id="radarCanvas" width="380" height="320">`
- Legend: filled swatch (current) + outline swatch (target)
- "Click to explore full maturity assessment →" CTA in section header

Radar drawing (`renderRadar()`):
- 4 concentric polygon rings (Tier 1–4)
- Target polygon drawn in `--accent` dashed: average target tier per function from the XLS
- Filled polygon = current scores per function
- Dots coloured by `tierColor(avg)`
- Labels: 3-letter function abbreviation + T{x.x} score

### Section 3 — Gap Analysis + Closing the Gap
Class: `.summary-section.summary-section--split`
Layout: 2-column grid, each column is a `.split-subsection--clickable`

**Sub-section A — Gap Analysis** (`onclick="navigateToTab('gaps','gap-section')"`)
- Headline: dynamic gap count sentence
- `.gap-summary-bar`: one row per function showing avg tier → target desc + gap count badge
- `.gap-pills`: monospace ID badges for all gap subcategories (medium priority highlighted amber)
- CTA: "Click to explore full gap analysis →"

**Sub-section B — Closing the Gap** (`onclick="navigateToTab('gaps','roadmap-section')"`)
- `.roadmap-summary`: one card per phase
  - Phase label badge (coloured) + timing + action count
  - Phase title
  - `.rs-items-list`: one row per item showing:
    - `.rs-item-id` monospace badge (e.g. `ID.AM-02`)
    - `.rs-item-cat` grey text (e.g. `Identify · Asset Management`)
    - `.rs-item-plain` the item's `action` (from the XLS target fields)
- CTA: "Click to explore the roadmap →"

---

## Tab 2 — Maturity Assessment

Header: title + subtitle + `.maturity-fn-chips` (one chip per function showing
fn name, avg tier, gap count — rendered by JS)

Content: one `.mat-fn-block` per function that has gaps.

Each block:
```
.mat-fn-header (coloured bg = FN_COLOR[fn])
  .mat-fn-dot | .mat-fn-title | .mat-fn-meta | .mat-fn-tier-badge | gap count

.mat-table
  thead: Fn | Subcategory | Description | Key Gap / Consideration | Current | Target | Priority
  tbody: one <tr> per gap row, onclick="openPopup(id)"
    - Row bg: mat-row--medium (amber) for Medium, mat-row--low (soft blue) for Low
    - Fn col: 3-letter abbrev, coloured
    - Current/Target cols: .mat-tier-chip coloured pill
    - Priority col: .badge coloured pill
```

Key Gap / Consideration column: use `s.considerations || s.notes || '—'`
Truncate description at 120 chars, consideration at 180 chars.

---

## Tab 3 — Gap Analysis & Fulfillment

Two sections separated by `.tab-section-divider`.

### Section A (`id="gap-section"`) — Gap table
Filters: function dropdown + priority dropdown
Groups: `.fn-group` per function, collapsible via `toggleGroup(key)`
Each row: `.subcat-row` with `.sc-left` (id, desc, notes, badges) and
`.sc-right` (tier arrow showing current → target)
`onclick="openPopup(id)"`

### Section B (`id="roadmap-section"`) — Roadmap
`.roadmap-phases` → one `.roadmap-phase` per non-empty phase (built by `buildRoadmap()` from the gaps)
Each phase: header (badge + title + timing + count) + `.roadmap-table`
Table columns: ID | Action | References | Current → Target | Priority
Rows clickable → `openPopup(id)`

---

## Tab 4 — Assessment Detail

Filters: function + gap/all/medium/at-target dropdown + text search
`.fn-group` structure same as Tab 3 gap table but shows ALL subcategories
Upload button: `<label class="btn-upload">` with hidden `<input type="file">`
`onchange="handleUpload(event)"`
Upload status: `#uploadStatus` span toggled ok/err class

---

## Popup modal

`#popupOverlay` (fixed, full-screen, closes on overlay click or Escape)
`#popupBox` (max-width 580px, scrollable)

Sections rendered by `openPopup(id)`:
1. **Current vs Target** — tier pills + priority badge
2. **Rationale** — `s.rationale || s.notes` (italic block, `--accent-deep` left border)
3. **Key Gap & Considerations** — `s.considerations` (`--accent` left border)
4. **Current State** — grid of fields: PPP / Practices / Roles / References / Artifacts
5. **Target State** — grid of fields: PPP / Practices / Roles / References
6. **Roadmap Detail** — if the row is a gap: phase, action and references

Sections 4 and 5 only render if the field has content.

---

## CSS tokens

Theme tokens (neutral, re-skinnable — change only these to rebrand):

```css
--ink:         #1E293B
--slate:       #475569
--accent:      #7C3AED
--accent-deep: #4C1D95
--accent-soft: #F5F3FF
--lgray:   #F5F7FA
--mgray:   #E0E0E0
--green:   #1A6B3C
--amber:   #B45309
--header-h: 52px
--page-max: 1300px
--radius:   10px
```

Tier colours (sequential): T1 `#E2E8F0`, T2 `#A78BFA`, T3 `#7C3AED`, T4 `#4C1D95`

Function colours (this repository's CSF palette; the same in the hub page):
```
Govern:   #334155
Identify: #1D4ED8
Protect:  #0F766E
Detect:   #B45309
Respond:  #B91C1C
Recover:  #4D7C0F
```

---

## Key JS functions

| Function | Purpose |
|----------|---------|
| `navigateToTab(tabId, anchorId?)` | Switch tab, optional scroll to anchor |
| `handleUpload(evt)` | Parse XLS, update `profileData`, call `fullRefresh()` |
| `isGap(s)` | Returns `s.current_n < s.target_n` |
| `getFnAvg(fn)` | Average current tier for a function |
| `getOverallAvg()` | Average across all subcategories |
| `tierColor(t)` | Returns hex colour for a tier number |
| `getGaps()` | Returns `profileData.filter(isGap)` |
| `renderSummary()` | Redraws Tab 1 dynamic content + radar |
| `renderRadar()` | Draws canvas radar chart |
| `renderMaturity()` | Redraws Tab 2 table |
| `renderGapTable()` | Redraws Tab 3 gap section (respects filters) |
| `buildRoadmap()` | Gaps → phases and items (SKILL.md Step 2) |
| `renderRoadmap()` | Redraws Tab 3 roadmap section |
| `renderAssessmentDetail()` | Redraws Tab 4 (respects filters + search) |
| `subcatRowHTML(s, color)` | Shared row template for Tabs 3 and 4 |
| `toggleGroup(key)` | Expand/collapse a fn-group |
| `openPopup(id)` | Find record, build and show popup |
| `closePopup()` | Hide popup, restore scroll |
| `fullRefresh()` | Calls all render functions in sequence |
