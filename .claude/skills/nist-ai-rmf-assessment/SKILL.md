---
name: "nist-ai-rmf-assessment"
description: "Generates or updates a NIST AI RMF 1.0 Assessment HTML dashboard from a filled-in AI RMF profile XLS (Stage 3 of this repository: the report from the answers). Use this skill whenever the user uploads the AI RMF profile XLS, asks to generate, regenerate or update the AI RMF assessment HTML or dashboard, or says anything like \"generate the AI assessment\", \"rebuild the AI RMF report\" or \"refresh the AI dashboard\". Use it whenever a .xlsx file is mentioned alongside AI RMF, NIST AI, AI maturity or Govern / Map / Measure / Manage, even if the phrasing is casual."
---

# NIST AI RMF 1.0 Assessment — HTML Generator

Produces one self-contained `AI_RMF_Assessment.html` from an AI RMF profile XLS (any
file name; the layout is `tests/fixtures/ai_rmf_profile_template.xlsx`). The output is
a 5-tab interactive report: Summary, Maturity Assessment, Gap Analysis & Roadmap,
Assessment Detail, and CIS Reference. Everything shown comes from the XLS and from this
repository's accepted mapping; nothing is hard-coded per organisation.

Where it sits in the pipeline: Stage 1 (`/generate-questions`) produces the
questionnaire; the answers become the AI RMF profile XLS (Stage 2); this skill turns
that XLS into the report. The hub page (`nist-assessment-hub`) links it with the CSF
report.

If a previously generated `AI_RMF_Assessment.html` exists in the working folder, treat
it as the template: when only the data changes, replace its seed data in place.

---

## Quick orientation

The AI RMF has four functions: **Govern, Map, Measure, Manage**. The organisation may
use AI, build it, or both; the profile's `Applicability Layer` column says which layer
each subcategory was assessed at. Do not assume a profile.

Short IDs: `GOVERN → GV`, `MAP → MA`, `MEASURE → ME`, `MANAGE → MN`
(e.g. `GOVERN 1.1` → `GV.1.1`)

Function colours (AI RMF palette — not the CSF colours):
```
Govern:  #4A90B8
Map:     #5BB5A2
Measure: #D4A017
Manage:  #2B4F8C
```

---

## Workflow

### Step 1 — Read the XLS

Sheet: `AI RMF Profile`

| Column | Field |
|--------|-------|
| `AI RMF (Function, Category,SubCategory)` | Row ID — keep subcategory rows only (e.g. "GOVERN 1.1"); skip function and category header rows |
| `Outcome Description` | `desc` |
| `Included in Profile` | Skip rows where the value is "No" or blank |
| `Rationale` | `rationale` |
| `Priority` | `priority` (High / Medium / Low; blank = Low) |
| `Applicability Layer` | `layer` (Developer / User / Shared) |
| `Current Maturity (1-4)` | `current_n` — integer 1–4 |
| `Current State` | `current_state` |
| `Target Maturity (1-4)` | `target_n` — integer 1–4 |
| `Target State` | `target_state` |
| `Current Evidence / Controls in Place` | `evidence` |

**Function from ID prefix:** `GOVERN` → Govern, `MAP` → Map, `MEASURE` → Measure,
`MANAGE` → Manage. **Short ID** (`short_id`): `GOVERN 1.1` → `GV.1.1`, etc.

Use openpyxl. Ask the user for the organisation name if it is not given; never guess.

### Step 2 — CIS safeguards from the accepted mapping (never a hand-made table)

Read `data/ai/mapping.json` (the accepted AI RMF mapping of this repository). For each
subcategory, `cis_controls` is the sorted union of the `cis_refs` of its mapping rows,
taking only the rows of the organisation's AI areas when they are known (the run
folder's `ai_usage.json` `ai_areas`), else all rows. Foundation subcategories (GOVERN
and the twelve in `data/ai/mapping_rules.json` `foundation.subcategories`) have no
mapping rows and get `[]`. IDs keep their form (`LLM-3.13`, `MCP-8.2`, `AGENT-6.2`);
the guide and control of each are in `data/ai/cis_ai_safeguard_ids.json`. Show IDs
only: CIS text is CC BY-NC-ND 4.0 and is not in this repository.

### Step 3 — Derive the roadmap from the gaps (never hard-code it)

A gap is a row with `current_n < target_n`. Each gap becomes one roadmap item: `id`,
`short_id`, `fn`, `action` = first sentence of `target_state` (else `desc`), `cis` =
the row's `cis_controls`, `current_n` → `target_n`, `priority`.

Phases: **Phase 1** (0–3 months) = High; **Phase 2** (3–6 months) = Medium;
**Phase 3** (6–12 months) = Low or unset. Within a phase, order by gap size, then by
ID. A phase with no items is not shown. No effort or cost: the profile does not hold
them and they must not be invented.

### Step 4 — Build the HTML

One self-contained file: CSS in `<style>`, JS in a `<script>` before `</body>`. The
only CDN dependency allowed is the XLSX library (for the upload feature).

#### JS constants (top of the script block)

```javascript
const FN_ORDER = ['Govern','Map','Measure','Manage'];
const FN_COLOR = {Govern:'#4A90B8',Map:'#5BB5A2',Measure:'#D4A017',Manage:'#2B4F8C'};
const TAB_IDS  = ['summary','maturity','gaps','assessment','ref'];
const PHASES   = [
  {phase:'Phase 1',timing:'0–3 months', priority:'High',  color:'#1E293B'},
  {phase:'Phase 2',timing:'3–6 months', priority:'Medium',color:'#4C1D95'},
  {phase:'Phase 3',timing:'6–12 months',priority:'Low',   color:'#7C3AED'},
];
const CIS_BY_SUB = { /* Step 2: subcategory id -> [safeguard ids] */ };
let profileData = [ /* seed data from the XLS (Step 1) */ ];
// buildRoadmap(profileData) applies Step 3, so an uploaded XLS rebuilds the roadmap too.
```

#### Tab structure

| Tab index | TAB_ID | Page div | Title |
|-----------|--------|----------|-------|
| 0 | summary | page-summary | Summary |
| 1 | maturity | page-maturity | Maturity Assessment |
| 2 | gaps | page-gaps | Gap Analysis & Roadmap |
| 3 | assessment | page-assessment | Assessment Detail |
| 4 | ref | page-ref | CIS Reference |

Tab switching: `querySelectorAll('.tab').forEach((t,i)=>{ t.addEventListener('click', ...) })`, index `i` into `TAB_IDS`.

#### Summary tab

- **Executive Summary** panel (Situation / Key Findings / Roadmap). Situation text comes
  from the user or the profile; never invented.
- **Key Findings** (`find-grid`): 4 cards — L{overall} Overall Posture, {gaps} Total
  Gaps, L{weakest} Weakest · {fn}, L{strongest} Strongest · {fn} — computed by
  `renderSummary()`.
- Radar chart canvas (`rc`) + function list (`fn-list`).
- Gap bar chart (`gsb`) + gap pills (`gpills`): high-priority gaps as clickable short IDs.
- Roadmap summary (`rm-sum`): phases with their items.

#### Popup modal (`openPopup` — gap analysis and assessment rows)

Shows: short ID + full ID, function coloured header, description, tier chips
(Current Lx → Target Lx), priority / layer / GAP badges, **Rationale**, **Current
State**, **Target State**, **Evidence** (if present). No CIS safeguards in this popup.

#### Roadmap popup (`openPopupRm` — roadmap row clicks)

Lookup: `profileData.find(x => x.id === id || x.short_id === id)`. Shows everything in
`openPopup` plus **Control Mapping** (`--accent-soft` card, `--accent` left border:
the CIS safeguard IDs) and **Roadmap Detail** (Action | Phase | Priority).

#### CIS Reference tab (`page-ref`)

Static text explaining the identifiers, without quoting CIS:
- `LLM-n.n` = CIS Controls v8.1 AI & LLM Companion Guide safeguard
- `MCP-n.n` = Model Context Protocol Companion Guide safeguard
- `AGENT-n.n` = AI Agents Companion Guide safeguard

A short table of what the control numbers cover in general (1/2 inventory, 3 data
protection, 4/5/6 configuration and access, 7 vulnerabilities, 8 audit logs, 10
malware defences, 12/13 network, 14 awareness, 15 service providers, 16 application
security, 17 incident response, 18 testing), and the source line: "Safeguard IDs from
the CIS Controls v8.1 AI & LLM, MCP and AI Agents Companion Guides (Center for Internet
Security; obtain the guides from cisecurity.org)."

---

## Critical rules

1. **No fabricated data.** Every field comes from the XLS or from `data/ai/mapping.json`.
   Never invent rationale, states, actions, effort or cost.
2. **Roadmap from the gaps** (Step 3); no organisation-specific roadmap lives here.
3. **CIS from the accepted mapping** (Step 2), as IDs only; never a hand-made table,
   never CIS text.
4. **Single file.** No separate CSS/JS files.
5. **Roadmap popup uses short-ID lookup** (`x.id === id || x.short_id === id`).
6. **Function colours** are the AI RMF palette above. UI chrome uses the neutral theme
   tokens (change only these to rebrand):
   ```css
   --ink:         #1E293B   /* header bar, headings */
   --slate:       #475569   /* secondary text, borders */
   --accent:      #7C3AED   /* buttons, highlights, target markers */
   --accent-deep: #4C1D95   /* hover, emphasis */
   --accent-soft: #F5F3FF   /* tinted panels */
   ```
7. **CIS safeguards only in the roadmap popup and roadmap table**, not in gap rows or
   `openPopup`.
8. **Upload refreshes everything.** The upload handler on Assessment Detail calls
   `fullRefresh()`, which also rebuilds the roadmap.
9. **JS syntax check.** Extract every `<script>` block and run `node --check` before
   saving.

---

## When to re-use vs regenerate

- **New XLS** → re-extract the seed data (Steps 1–3) and replace `profileData` in the
  existing HTML, then `node --check`; or upload it in the report.
- **Layout or copy tweak** → patch the existing HTML.
- **Mapping changed** (`data/ai/mapping.json` re-accepted) → redo Step 2.

## Deliver

Save as `AI_RMF_Assessment.html` in the user's output folder (the same folder as the
hub page and the CSF report), and present it to the user. Never save a report into this
repository: it holds a client's answers.
