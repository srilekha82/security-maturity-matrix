---
name: nist-assessment-hub
description: "Generates or updates the Assessment Hub landing page (Assessment_Landing.html): one HTML page that links the NIST CSF 2.0 and NIST AI RMF 1.0 assessment reports with their headline scores, assessment cards and framework context. Use this skill whenever the user asks to generate, rebuild or update the landing or hub page, to update the scores shown on it, to change the organisation name or the links to the two reports, or says things like \"update the landing\", \"fix the hub links\" or \"regenerate the hub\"."
---

# Assessment Hub — Landing Page Skill

Generates `Assessment_Landing.html`, the page that links the two reports produced by
the `nist-csf-assessment` and `nist-ai-rmf-assessment` skills and shows their headline
scores. Stage 3 of this repository, after the profile XLS files are filled in.

## What the page contains

1. **Header** — bar (`--ink`) with a generic shield mark, the organisation name and
   "Assessment Hub · Confidential"
2. **Hero** — gradient banner, title "Organisational Assessment Hub", four-segment bar
3. **Summary strip** — CSF overall tier | AI RMF overall level | CSF subcategories |
   AI RMF subcategories
4. **Two assessment cards** — CSF (`--ink`) and AI RMF (`--accent-deep`), each with its
   stats, function tags and an "Open" button linking to the report file
5. **Framework context** — how CSF and AI RMF relate
6. **Footer** — "Confidential — prepared for {ORG_NAME}"

## Values (no defaults: every one comes from the assessment)

`references/landing_template.html` holds placeholders; replace every one:

| Placeholder | Value |
|-------------|-------|
| `{{ORG_NAME}}` | the organisation's name (ask; never guess) |
| `{{CSF_TIER}}` | `T` + average current tier of the included CSF subcategories, one decimal (e.g. `T2.1`) |
| `{{CSF_COUNT}}` | number of included CSF subcategories |
| `{{AI_LEVEL}}` | `L` + average current maturity of the included AI RMF subcategories, one decimal |
| `{{AI_COUNT}}` | number of included AI RMF subcategories |
| `{{CSF_FILE}}` | the CSF report's file name (default `NIST_CSF_Assessment.html`) |
| `{{AI_FILE}}` | the AI RMF report's file name (default `AI_RMF_Assessment.html`) |

Compute the scores from the two profile XLS files with the same reading rules as the
two report skills (included rows only; rows without a current value are left out of
the average), or take them from the reports' Key Findings. If one assessment was not
done, show "—" for its values and say "Not assessed" on its card instead of a link.

## Theme tokens

Neutral and re-skinnable — to rebrand, change only these values in `:root`:

```
--ink:         #1E293B  (header, CSF card, headings)
--slate:       #475569  (secondary text)
--accent:      #7C3AED  (buttons, highlights)
--accent-deep: #4C1D95  (AI RMF card)
--accent-soft: #F5F3FF  (tinted pills and panels)
```

Framework function colours (the same as in the two reports):
- NIST CSF: Govern #334155, Identify #1D4ED8, Protect #0F766E, Detect #B45309, Respond #B91C1C, Recover #4D7C0F
- AI RMF: Govern #4A90B8, Map #5BB5A2, Measure #D4A017, Manage #2B4F8C

## How to generate the page

1. Get the organisation name and the two profile XLS files (or the two reports).
2. Start from `references/landing_template.html`; replace every `{{…}}` placeholder.
   Check that none is left (`grep '{{'`).
3. Save as `Assessment_Landing.html` in the user's output folder, next to the two
   reports (the links are relative), and present it. Never save it into this
   repository: it carries a client's scores.

## When only the links need fixing

Ask for the exact file names of the two reports and whether they sit in the same
folder as the hub; change only the two `href` values.

## When scores need updating

Recompute from the new profile XLS (or take the values the user gives) and update the
summary strip and the matching stat boxes; nothing else.
