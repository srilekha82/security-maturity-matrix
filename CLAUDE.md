# security-maturity-tool

Stage 1 of the assessment pipeline: one questionnaire (CSF 2.0 sheet + AI RMF 1.0 sheet) for a client. `README.md`
has the flow and file layout. **Before changing a script, prompt, command or data file, or adding a stage, read
`DESIGN_RULES.md`.** You do not need it to run the flows below.

## Running
- Always use the venv: `.venv/bin/python ./scripts/<script>.py` (create: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`). Run from the repo root.
- Tests: `.venv/bin/python -m unittest discover -s tests` (stores are redirected to a temp dir; keep it that way).

## What to run
- **Generate questions:** `/generate-questions` (one numbered intake, CSF + AI RMF, one `questionnaire.xlsx`). Parts on an
  existing run folder: `/csf-questionnaire`, `/ai-questionnaire`, `/assess-questionnaire`.
- **Build or refresh the AI RMF banks:** `/build-ai-bank` (pilot first). CSF banks: `/build-csf-bank`.
- **Questions about how something works or what a term means:** answer from `README.md` (it has an "I want to…" table
  and a glossary).
- **Maturity XLS (Stage 2):** the XLS writer and answer session are not built yet.
- **Reports (Stage 3):** the skills in `.claude/skills/`: `nist-csf-assessment` and `nist-ai-rmf-assessment` (one HTML
  report each, from the filled-in profile XLS) and `nist-assessment-hub` (the page linking both). Reports hold a
  client's answers: save them outside the repo, never commit them.
- **Explainer deck:** `docs/deck/` (NIST CSF and AI RMF in plain language, and how the assessment works).

## Never
- Commit `runs/` or copy it into `data/`: it holds client data.
- Commit or publish CIS text: `data/ai/source/` (the guides) or `data/ai/cis_ai_safeguards.json` (parsed text). CIS
  material is CC BY-NC-ND 4.0; only `cis_ai_safeguard_ids.json` (no text) is committed.
