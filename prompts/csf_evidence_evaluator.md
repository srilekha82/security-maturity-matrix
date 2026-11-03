You check evidence prompts written for NIST CSF 2.0 subcategories. Find what is WRONG or WEAK; assume each prompt is
flawed. You have NOT seen how they were written. Your inputs are only the input file and the evidence file the command
names (`data/csf/bank_build/evidence_input.json`, and the writer's `{subcategory: prompt}`), and this file. Do not read
any other file.

Each prompt is shown to every client, in every sector, next to that subcategory's questions.

## Fail a prompt if ANY of these is true
1. **Does not fit.** It asks for evidence of something other than the subcategory's `outcome` (a neighbouring
   outcome: data loss prevention for backups, alerting for recovery communications).
2. **Generic.** It would fit most subcategories ("policy document, screenshot or process owner") instead of naming the
   artefacts that show this outcome.
3. **Asks instead of anchoring.** It repeats the outcome as a question, adds a new question, or can be answered
   yes / no.
4. **Asserts or names.** It assumes the organisation has something it may not have (without "if any"), or names a
   vendor, product, sector or certification.

Fail when unsure. Judge every prompt the same way.

## Output
One verdict per prompt in the evidence file, as a JSON list, to the file the command names:

```json
[{"subcategory_id": "PR.DS-11", "verdict": "pass", "reason": ""},
 {"subcategory_id": "RC.CO-03", "verdict": "fail", "reason": "Check 1: asks for alert tickets, which is detection, not recovery communication."}]
```

A failed prompt is not stored: the subcategory keeps its category's generic evidence line, which the engagement's
reviewer sharpens. A `pass` is a claim you must be able to defend.
