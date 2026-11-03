---
name: nist-csf-assessment
description: >
  Generates a NIST CSF 2.0 Assessment HTML dashboard from a filled-in CSF 2.0
  Organizational Profile XLS (Stage 3 of this repository: the report from the
  answers). Use this skill whenever the user uploads a NIST CSF profile XLS, asks
  to generate, regenerate or update the CSF assessment HTML or dashboard, or says
  anything like "generate the assessment", "rebuild the CSF report" or "create the
  cybersecurity dashboard" — even if the phrasing is casual.
---

# NIST CSF 2.0 Assessment — HTML Generator

Produces one self-contained `NIST_CSF_Assessment.html` from a NIST CSF 2.0
Organizational Profile XLS. The output is a 4-tab interactive report: radar chart,
maturity tables, gap analysis, and a roadmap **derived from the organisation's own
gaps**. Everything shown comes from the XLS; nothing is hard-coded per organisation.

Where it sits in the pipeline: Stage 1 (`/generate-questions`) produces the
questionnaire; the answers become the CSF profile XLS (Stage 2); this skill turns that
XLS into the report. The hub page (`nist-assessment-hub`) links it with the AI RMF
report.

---

## Quick orientation

Read `references/architecture.md` before writing any code — it defines the tab
layout, CSS tokens and JS structure the output must follow.

---

## Workflow

### Step 1 — Read the XLS

The XLS is the NIST CSF 2.0 Organizational Profile Template. Sheet: `Current and
Target Profile`. Columns:

| Column | Use |
|--------|-----|
| `CSF Outcome (Function, Category, or Subcategory)` | Row ID — skip if not matching `^[A-Z]{2}\.[A-Z]{2}-\d+` |
| `Included in Profile?` | Skip rows where value is not blank and not "yes" |
| `CSF Outcome Description` | `desc` |
| `Rationale` | `rationale` |
| `Current Priority` | `priority` (High / Medium / Low; blank = Low) |
| `Current Status` | `current_n` — normalise to integer tier (map below) |
| `Target CSF Tier` | `target_n` — normalise to integer tier |
| `Current Policies, Processes, and Procedures` | `current_ppp` |
| `Current Internal Practices` | `current_practices` |
| `Current Roles and Responsibilities` | `current_roles` |
| `Current Selected Informative References` | `current_refs` |
| `Current Artifacts and Evidence` | `current_artifacts` |
| `Target Policies, Processes, and Procedures` | `target_ppp` |
| `Target Internal Practices` | `target_practices` |
| `Target Roles and Responsibilities` | `target_roles` |
| `Target Selected Informative References` | `target_refs` |
| `Notes` | `notes` |
| `Considerations` | `considerations` (in this pipeline it also carries the AI impact notes for the subcategory) |

**Tier normalisation:** `Tier 1` / `T1` / `1` → 1, `Tier 2` / `T2` / `2` → 2, etc.
A row with no current or target tier is shown but not counted as a gap.

**Function from ID prefix:** `GV` → Govern, `ID` → Identify, `PR` → Protect,
`DE` → Detect, `RS` → Respond, `RC` → Recover

Use openpyxl. Ask the user for the organisation name (used in titles) if it is not in
the file name or the conversation; never guess it.

### Step 2 — Derive the roadmap from the gaps (never hard-code it)

A gap is a row with `current_n < target_n`. Each gap becomes one roadmap item:

| Field | From |
|-------|------|
| `id`, `fn`, `category` | the row (category = the CSF category name of the ID's prefix, e.g. `PR.AA` → Identity Management, Authentication, and Access Control) |
| `action` | first sentence of `target_practices`, else of `target_ppp`, else `desc` |
| `refs` | `target_refs`, else `current_refs` (whatever the assessor wrote: CIS safeguard numbers, ISO 27001 controls, …) |
| `current_n` → `target_n` | the row |
| `priority` | the row |

Phases: **Phase 1** (0–3 months) = High-priority gaps; **Phase 2** (3–6 months) =
Medium; **Phase 3** (6–12 months) = Low or unset. Within a phase, order by gap size
(`target_n - current_n`, largest first), then by ID. A phase with no items is not
shown. Do not add tools, effort or cost: the profile does not hold them and they must
not be invented.

### Step 3 — Build the HTML

`references/architecture.md` is the authoritative spec. One self-contained file: CSS
in a `<style>` block, JS in a `<script>` block before `</body>`. The only external
dependency is the XLSX library CDN (for the upload feature).

JS sections, in order:
```
/* ── 1. Constants & seed data  */
/* ── 2. State                  */
/* ── 3. Tab navigation         */
/* ── 4. Upload / data ingestion*/
/* ── 5. Computed helpers       */
/* ── 6. Render: Summary        */
/* ── 7. Render: Maturity       */
/* ── 8. Render: Gap Analysis   */
/* ── 9. Render: Assessment     */
/* ── 10. Popup modal           */
/* ── 11. Bootstrap             */
```

The roadmap is computed in JS from `profileData` (`buildRoadmap()`, the rules of
Step 2), so an uploaded XLS rebuilds it too.

### Step 4 — Verify and deliver

Extract the JS and run `node --check` on it before saving. Check: the seed has one
record per included subcategory of the XLS, the gap count matches the XLS, the JS is
clean. Save as `NIST_CSF_Assessment.html` in the user's output folder, next to the
AI RMF report and the hub page if they exist, and present it to the user.

Never save a report into this repository: it holds a client's answers (like `runs/`,
client data stays out of git).

---

## Critical rules

1. **No fabricated data.** Every field shown comes from the XLS. Never invent
   rationale, practices, notes, tools, effort or cost.
2. **Roadmap from the gaps.** Computed from the XLS by the rules of Step 2; no
   organisation-specific roadmap lives in this skill.
3. **Single file output.** No separate CSS/JS files (browsers block local loading).
4. **Popups show XLS data.** Clicking a row shows the real `rationale`,
   `considerations`, current and target fields.
5. **Upload refreshes everything.** The upload handler on Tab 4 calls
   `fullRefresh()`, which re-renders all tabs, the radar and the roadmap.
6. **Theme.** UI chrome uses the theme tokens in `references/architecture.md`;
   change only those to rebrand. Function colours are the palette given there.
7. **No CIS text.** References are shown as identifiers only (e.g. `CIS 6.3`); CIS
   Controls text is CC BY-NC-ND 4.0 and is not reproduced.

---

## When to re-use vs regenerate

- **New XLS** → full regeneration (Steps 1–4), or upload it in the existing report.
- **Layout or copy tweak** → patch the existing HTML, skip Step 1.
