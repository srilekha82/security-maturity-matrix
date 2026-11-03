# /build-csf-bank — build a domain's CSF 2.0 question bank from the CSET SQL

Argument: the domain (`finance`, `healthcare`, `manufacturing_ot`, `saas_cloud`, `consulting`, `other`) or `all`.
Builds `data/csf/banks/question_bank_<domain>.json` from the CSET SQL migration files, several candidates per
subcategory: CSET's own CSF 2.0 question first (set `NCSF_V2`, every subcategory), then the maturity-model questions
CSET maps to CSF 2.0. Scripts do everything the CSET schema decides; an agent step (Step 3) judges only what the schema cannot
(domain of generic questions, rewording statement-only practices as questions, loose subcategory mappings).
`build_questions.py` later picks the right number per engagement. Do not re-implement any parsing or routing inline.
The banks are shared across clients: build or refresh one when it is missing or CSET changed, not per engagement.

Tools: Bash, Read, Write, Agent. Working directory: repo root. Say little: the script summary lines and the final report.

## 1 — Domain and CSET path
If no domain was given: `.venv/bin/python ./scripts/intake.py menu domain`, ask the user to pick a number (or `all`),
and use that domain's value. The CSET repo is `~/workstuff/cset` unless the user says otherwise (expand `~`).
If that folder does not exist, clone the public repo there (only the SQL folder, with full history; tell the user):
`mkdir -p ~/workstuff && git clone --filter=blob:none --sparse https://github.com/cisagov/cset.git ~/workstuff/cset && git -C ~/workstuff/cset sparse-checkout set CSETWebApi/CSETWeb_Api/CSETWebCore.UpgradeLibrary/VersionUpgrader/SQL`

## 2 — Extract candidates (deterministic)
`.venv/bin/python ./scripts/extract_cset_candidates.py --cset-path <cset_path>`

Pulls the CSET repo, replays the SQL (reference INSERT minus DELETE, question INSERT / UPDATE / DELETE) and writes
`data/csf/bank_build/cset_candidates.json`. Same commit as stored: prints "up to date" and exits. Commit moved but no
`.sql` changed: only patches the stored commit. Otherwise it re-extracts. If it reports "could not update CSET repo",
relay the message and stop. Add `--force` only if the user asks.

## 3 — Build the bank (deterministic routing)
`.venv/bin/python ./scripts/build_question_bank.py --domain <domain>`

- **Exit 0**: bank written. Go to Step 5.
- **Exit 2**: some candidates need a judgement. It wrote `data/csf/bank_build/pending_judgements_<domain>.json` and no
  bank. Go to Step 4.

## 4 — Judge the pending questions (agent)
`prompts/question_bank_judge.md` is your complete instruction for this step.

1. Read `data/csf/bank_build/pending_judgements_<domain>.json`; work through `items` in batches of about 25.
2. For each item write only the verdicts it `needs`, in the format the prompt defines, all into
   `data/csf/bank_build/verdicts_<domain>.json`.
3. Save them (your model id):
   ```bash
   .venv/bin/python ./scripts/record_judgements.py data/csf/bank_build/verdicts_<domain>.json \
       --pending data/csf/bank_build/pending_judgements_<domain>.json --model <model id>
   ```
   If it lists problems, fix those entries and run it again; nothing is saved until it passes.
4. Run Step 3 again: it should now exit 0.

Verdicts are stored in `data/csf/bank_build/cset_judgements.json` and reused by every domain and every later build; they
are redone only for questions CSET has changed. Each recording also writes a write-once record to
`data/csf/bank_build/judgement_log/`. Delete `verdicts_<domain>.json` once recorded.

## 5 — Evidence prompts (agents; once, only subcategories without one)
Each CSF subcategory gets its own evidence prompt once (domain-independent, stored in `data/csf/evidence_prompts.json`
`by_subcategory`), so an engagement's reviewer does not rewrite a generic category line on every entry (decided
2026-11-02). The questions stay CSET's; only the evidence line is written.

1. `.venv/bin/python ./scripts/record_judgements.py evidence prepare` writes `data/csf/bank_build/evidence_input.json`
   (subcategories with no prompt of their own, with NIST's implementation examples; it says how many). Nothing to do
   when it says 0.
2. **Writers** (fresh subagents, Sonnet, started together): follow `prompts/csf_evidence_writer.md` with that input, one
   for GV + ID and one for PR + DE + RS + RC; write `data/csf/bank_build/work/evidence_<part>.json`.
3. **Evaluators** (fresh subagents, Opus; they must not see the writer's prompt): follow
   `prompts/csf_evidence_evaluator.md` with the input and one writer's file; write `work/evidence_<part>_eval.json`.
4. Record each part: `.venv/bin/python ./scripts/record_judgements.py evidence data/csf/bank_build/work/evidence_<part>.json
   --review data/csf/bank_build/work/evidence_<part>_eval.json --model <writer model id> --session "evaluator=<model id>"`.
   A failed prompt is not stored (the subcategory keeps its category line, which the engagement's reviewer sharpens);
   one pass, no revision turn. Delete the work and input files.

## 6 — Report
Relay the script output: subcategories with candidates (and how many have maturity-model questions), empty ones, the routing counts (accept/schema, accept/agent,
reject/schema, reject/agent), how many questions the agent judged, and the evidence prompts stored. Do not re-read the bank file unless the user asks.
