"""Run: .venv/bin/python -m unittest discover -s tests -v

The CSF scripts' fixes from the design note's code review: SoA parsing, CSET replay order and freshness, SoA judgement
validation, fields the reviewer may not change, the intake date. Everything is written to a temp dir."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import compute_scope as CS  # noqa: E402
import extract_cset_candidates as EX  # noqa: E402
import record_judgements as RJ  # noqa: E402


def soa_file(rows, headers=("Control", "Control title", "Applicable", "Justification")) -> Path:
    path = Path(tempfile.mkdtemp()) / "soa.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Annex A controls"
    ws.append(list(headers))
    for r in rows:
        ws.append(list(r))
    wb.save(path)
    return path


def parse(path: Path) -> tuple[int, list | None, str]:
    run = Path(tempfile.mkdtemp())
    p = subprocess.run([sys.executable, str(ROOT / "scripts" / "parse_soa.py"), str(run), str(path)],
                       capture_output=True, text=True)
    out = run / "soa_parsed.json"
    return p.returncode, json.loads(out.read_text()) if out.exists() else None, p.stdout + p.stderr


class ParseSoa(unittest.TestCase):
    def test_numeric_ids_get_their_lost_zero_back_from_row_order(self):
        rows = [(5.1, "Policies", "Yes", None), (5.9, "Inventory", "Yes", None),
                (5.1, "Acceptable use", "Yes", None), (5.11, "Return of assets", "No", "No assets lent")]
        code, parsed, _ = parse(soa_file(rows))
        self.assertEqual(code, 0)
        self.assertEqual([r["control_id_raw"] for r in parsed], ["5.1", "5.9", "5.10", "5.11"])

    def test_a_duplicate_id_after_parsing_fails_and_writes_nothing(self):
        code, parsed, out = parse(soa_file([("5.1", "a", "Yes", None), ("5.1", "b", "No", "x")]))
        self.assertEqual((code, parsed), (1, None))
        self.assertIn("more than once", out)

    def test_the_id_column_is_not_the_title_column(self):
        path = soa_file([("Policies", "5.1", "Yes", None)], headers=("Control title", "Control", "Applicable", "Notes"))
        code, parsed, _ = parse(path)
        self.assertEqual((code, parsed[0]["control_id_raw"]), (0, "5.1"))


class CsetReplay(unittest.TestCase):
    def ref(self, verb, qid, sid):
        if verb == "INSERT":
            return f"INSERT INTO [dbo].[MATURITY_REFERENCES] VALUES ({qid}, {EX.CSF_GEN_FILE_ID}, N'{sid}')"
        return (f"DELETE FROM [dbo].[MATURITY_REFERENCES] WHERE [Mat_Question_Id] = {qid} AND "
                f"[Gen_File_Id] = {EX.CSF_GEN_FILE_ID} AND [Section_Ref] = N'{sid}'")

    def test_a_mapping_deleted_then_inserted_again_stays(self):
        lines = [self.ref("INSERT", 1, "ID.AM-01"), self.ref("DELETE", 1, "ID.AM-01"), self.ref("INSERT", 1, "ID.AM-01"),
                 self.ref("INSERT", 2, "PR.DS-11"), self.ref("DELETE", 2, "PR.DS-11")]
        self.assertEqual(EX.net_active_pairs(lines), {(1, "ID.AM-01")})

    def test_an_unknown_stored_commit_means_extract_again(self):
        out = Path(tempfile.mkdtemp()) / "cset_candidates.json"
        out.write_text(json.dumps({"cset_commit": "0" * 40}))
        old = EX.sql_changed
        EX.sql_changed = lambda *a: (_ for _ in ()).throw(RuntimeError("bad object"))
        try:
            self.assertEqual(EX.freshness(out, Path("."), "1" * 40), "extract")
        finally:
            EX.sql_changed = old


class SoaJudgements(unittest.TestCase):
    rules = {"exclusion_classes": ["covered_elsewhere", "not_relevant", "unclear"]}
    soa = {"A": {"applicable": False}, "B": {"applicable": None}, "C": {"applicable": True}}

    def test_an_excluded_control_needs_its_class_and_an_unreadable_one_its_applicability(self):
        errs = CS.validate_judgements({"A": {"reason": "r"}, "B": {"reason": "r", "exclusion_class": "unclear"}},
                                      self.soa, self.rules)
        self.assertTrue(any(e.startswith("A:") and "exclusion_class" in e for e in errs))
        self.assertTrue(any(e.startswith("B:") and "applicable" in e for e in errs))
        ok = {"A": {"reason": "r", "exclusion_class": "not_relevant"},
              "B": {"reason": "r", "applicable": False, "exclusion_class": "unclear"},
              "C": {"reason": "r"}}
        self.assertEqual(CS.validate_judgements(ok, self.soa, self.rules), [])


class ReviewerFacts(unittest.TestCase):
    def test_scope_reason_and_usage_note_cannot_change(self):
        entry = {"subcategory_id": "GOVERN 1.1", "function": "GOVERN", "outcome": "o", "bank": "foundation",
                 "question_type": "full_discovery", "questions": [{"question_text": "How?"}], "evidence_prompt": "e",
                 "scope_reason": "foundation", "usage_note": "AI in use", "confidence_flag": "", "assessor_note": None}
        patch = [dict(entry, scope_reason="changed", usage_note="changed", assessor_note="n")]
        errs = RJ.validate_patch([entry], patch)
        self.assertTrue(any("scope_reason must not change" in e for e in errs))
        self.assertTrue(any("usage_note must not change" in e for e in errs))


class IntakeDate(unittest.TestCase):
    def test_a_date_that_is_not_yyyy_mm_dd_is_refused(self):
        runs = Path(tempfile.mkdtemp())
        for bad in ("2026-13-01", "../x", "2026-1-5"):
            p = subprocess.run([sys.executable, str(ROOT / "scripts" / "intake.py"), "write", "--org", "Acme",
                                "--domain", "1", "--certs", "1", "--ai-in-use", "1", "--csf-assessment-done", "2",
                                "--iso42001-held", "2", "--date", bad, "--runs-dir", str(runs)],
                               capture_output=True, text=True)
            self.assertEqual(p.returncode, 1, bad)
            self.assertIn("YYYY-MM-DD", p.stderr + p.stdout)
        self.assertEqual(list(runs.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
