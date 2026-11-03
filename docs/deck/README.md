# Explainer deck

`Cybersecurity_and_AI_Capability.pptx` explains, in plain language, what the assessment is about. Use it to open an
engagement with leadership and staff, or to present results.

1. Opening: why cybersecurity matters, and what it means for each role (user, developer or architect, product
   analyst, leader).
2. The framework: how NIST CSF 2.0 brings structure, the six functions, and the four implementation tiers.
3. AI: the three categories of harm in NIST AI 100-1, and the four AI RMF functions.
4. Closing the gap: CIS Controls and Implementation Groups for CSF gaps; for AI gaps, the direction of risk (what
   enters, leaves or bypasses the organisation).
5. How the assessment works: intake → questionnaire → answers and profile → reports, and from gap to action.
6. Questions, and public references.

The deck is generic. When presenting one organisation's results, add slides with screenshots of its hub page and
reports (the Stage 3 skills in `.claude/skills/`). Keep those copies with the engagement, outside this repository.

`build_deck.js` regenerates the deck with pptxgenjs (theme, layouts and sections; colours match the report skills).
It needs `pptxgenjs`, `react`, `react-dom`, `react-icons`, `sharp` and `jszip`, and the `apply_theme.js` helper of the
pptx skill (`PPTX_SKILL` environment variable): `node build_deck.js out.pptx`.
