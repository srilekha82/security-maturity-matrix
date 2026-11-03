"""
Priority (High / Medium / Low) of each AI RMF subcategory for the AI RMF profile XLS (its Priority column).

A helper for the Stage 2 writer (not a command): the rules live in data/ai/severity_rules.json, the criticality bands in
data/ai/question_rules.json `ai_system_inventory`, the rows and foundation in the accepted mapping
(record_ai_bank.question_context). Pure functions, no files written; the caller audits its own run.

  system_level(system)            one inventory row -> its criticality level
  subcategory_priorities(...)     {subcategory: level} for the subcategories in the client's questionnaire

An inventory system is {"name": ..., "areas": [ai area ids], "<criticality header>": "<band as written in the sheet>"}.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from paths import AI_QUESTION_RULES, AI_SEVERITY_RULES as SEVERITY_RULES  # noqa: E402


def load_rules() -> dict:
    """The severity rules, checked against the inventory's bands so the two files cannot drift apart."""
    rules = json.loads(SEVERITY_RULES.read_text())
    bands = json.loads(AI_QUESTION_RULES.read_text())["ai_system_inventory"]["criticality"]
    if set(rules["band_levels"]) != set(bands) or any(len(rules["band_levels"][h]) != len(b) for h, b in bands.items()):
        sys.exit("[ai_priority] ERROR: severity_rules.json band_levels must have one level per band of "
                 "question_rules.json ai_system_inventory.criticality")
    rules["bands"] = bands
    return rules


def highest(levels, rules: dict) -> str:
    return max(levels, key=rules["levels"].index)


def system_level(system: dict, rules: dict) -> str:
    """Highest level among the system's answers; a blank or unrecognised band counts as `blank`."""
    out = []
    for header, bands in rules["bands"].items():
        answer = str(system.get(header) or "").strip()
        out.append(rules["band_levels"][header][bands.index(answer)] if answer in bands else rules["blank"])
    return highest(out, rules)


def reach(ctx: dict) -> dict[str, list[tuple[str, list]]]:
    """{subcategory: [(area, impacts)]} from the mapping rows, a folded subcategory reached through its row."""
    out: dict[str, list] = {}
    for sid, rows in ctx["rows"].items():
        for r in rows.values():
            for target in [sid, *r["folded"]]:
                out.setdefault(target, []).append((r["area"], r["impact"]))
    return out


def subcategory_priorities(subcategories, systems: list[dict], domain: str, client_areas, ctx: dict,
                           rules: dict | None = None) -> dict[str, str]:
    """Priority per subcategory in the client's questionnaire (`subcategories`); see severity_rules.json."""
    rules = rules or load_rules()
    levels = [(set(s.get("areas") or []), system_level(s, rules)) for s in systems]
    org = highest([lvl for _, lvl in levels] or [rules["blank"]], rules)
    floor = rules["domain_floor"] if domain in rules["domain_floor"]["domains"] else None
    reached, client_areas = reach(ctx), set(client_areas)
    out = {}
    for sid in subcategories:
        if sid.startswith("GOVERN") or sid in ctx["foundation"]:
            level = org
        else:
            rows = [(a, imp) for a, imp in reached.get(sid, []) if a in client_areas]
            per_area = []
            for area in {a for a, _ in rows}:
                used = [lvl for areas, lvl in levels if area in areas]
                per_area.append(highest(used, rules) if used else rules["blank"])
            level = highest(per_area or [rules["blank"]], rules)
            if floor and any(floor["impact"] in imp for _, imp in rows):
                level = floor["level"]
        if floor and sid in floor["subcategories"]:
            level = floor["level"]
        out[sid] = level
    return out
