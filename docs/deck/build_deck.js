// Neutral rebuild of the "Cybersecurity Capability" explainer deck for security-maturity-matrix.
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2];
const THEME = {
  name: "Security Maturity Matrix",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1E293B", lt1: "FFFFFF", dk2: "475569", lt2: "F1F5F9",
    accent1: "7C3AED", accent2: "4C1D95", accent3: "0F766E", accent4: "B45309",
    accent5: "B91C1C", accent6: "1D4ED8", hlink: "6D28D9", folHlink: "4C1D95",
  },
};
const HEX = { ink: "1E293B", slate: "475569", accent: "7C3AED", deep: "4C1D95", soft: "F5F3FF", tint: "F1F5F9", white: "FFFFFF" };
// NIST CSF 2.0 function colours, as in templates/csf_org_profile_template.xlsx. Light: text on them is ink.
const CSF = { Govern: "F9F49D", Identify: "4BB2E0", Protect: "9292EA", Detect: "FAB746", Respond: "F97367", Recover: "7DF49F" };
const GOOD = "0F766E", BAD = "B91C1C"; // "security aware" / "if not" labels (not function colours)
const AIF = { Govern: "4A90B8", Map: "5BB5A2", Measure: "D4A017", Manage: "2B4F8C" };

async function icon(Comp, color = "FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: String(size) }));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
async function iconCircle(slide, Comp, x, y, d, fill, name) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: name + " circle" });
  slide.addImage({ data: await icon(Comp), x: x + d * 0.25, y: y + d * 0.25, w: d * 0.5, h: d * 0.5, objectName: name + " icon" });
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.title = "Cybersecurity & AI Capability";
  pres.author = "security-maturity-matrix contributors";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  pres.defineSlideMaster({
    title: "Title Dark", background: { color: HEX.ink },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.3, w: 11.7, h: 1.4, fontSize: 44, bold: true, color: C.background1, valign: "bottom", align: "left" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.85, w: 11.7, h: 1.2, fontSize: 20, color: "CBD5E1", valign: "top", align: "left" }, text: "" } },
      { text: { text: "security-maturity-matrix · NIST CSF 2.0 · NIST AI RMF 1.0", options: { x: 0.8, y: 6.7, w: 11.7, h: 0.4, fontSize: 12, color: "94A3B8" } } },
    ],
  });
  pres.defineSlideMaster({
    title: "Content", background: { color: HEX.white },
    margin: [0.5, 0.6, 0.6, 0.6],
    slideNumber: { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: "94A3B8", align: "right" },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.75, fontSize: 32, bold: true, color: C.text1, valign: "middle", align: "left" }, text: "" } },
      { placeholder: { options: { name: "sub", type: "body", x: 0.6, y: 1.08, w: 12.1, h: 0.55, fontSize: 16, color: C.text2, valign: "top", align: "left" }, text: "" } },
      { text: { text: "security-maturity-matrix", options: { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: "94A3B8" } } },
    ],
  });

  const content = (title, sub, section) => {
    const s = pres.addSlide({ masterName: "Content", sectionTitle: section });
    s.addText(title, { placeholder: "title" });
    if (sub) s.addText(sub, { placeholder: "sub" });
    return s;
  };
  const card = (s, x, y, w, h, fill, name) =>
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: fill }, objectName: name });
  const tb = (opts) => Object.assign({ isTextBox: true, margin: 0, valign: "top", fontSize: 14, color: C.text1 }, opts);

  // 1 — Title
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "Title Dark", sectionTitle: "Opening" });
  s.addText("Cybersecurity & AI Capability", { placeholder: "title" });
  s.addText("Understanding an organisation's posture through NIST CSF 2.0 and the NIST AI Risk Management Framework", { placeholder: "body" });
  await iconCircle(s, fa.FaShieldAlt, 0.8, 1.05, 1.0, HEX.accent, "Title");
  s.addNotes("An explainer for leadership and staff before or after a security and AI maturity assessment. Replace nothing here; the organisation's own results are in the assessment hub and reports.");

  // 2 — Agenda
  s = content("What We Will Cover", null, "Opening");
  const agenda = [
    ["Why Cybersecurity", "What is at stake: data, operations and reputation"],
    ["What This Means For Your Role", "How cybersecurity shows up in different roles"],
    ["Bringing Structure", "How cybersecurity evolved and why a framework helps"],
    ["The Six Functions", "The areas every organisation must address"],
    ["Implementation Tiers", "How maturity is measured, from partial to adaptive"],
    ["When AI Enters the Picture", "Why AI risk needs its own lens"],
    ["Closing the Gap", "Controls that turn findings into action"],
    ["How the Assessment Works", "From questionnaire to reports and roadmap"],
  ];
  agenda.forEach(([t, d], i) => {
    const col = i < 4 ? 0 : 1, row = i % 4;
    const x = 0.6 + col * 6.2, y = 1.45 + row * 1.35;
    card(s, x, y, 5.9, 1.15, HEX.tint, "Agenda item " + (i + 1));
    s.addShape("ellipse", { x: x + 0.25, y: y + 0.22, w: 0.7, h: 0.7, fill: { color: HEX.accent }, line: { color: HEX.accent }, objectName: "Agenda number circle " + (i + 1) });
    s.addText(String(i + 1).padStart(2, "0"), tb({ x: x + 0.25, y: y + 0.22, w: 0.7, h: 0.7, align: "center", valign: "middle", bold: true, color: C.background1, fontSize: 16, objectName: "Agenda number " + (i + 1) }));
    s.addText([{ text: t, options: { bold: true, fontSize: 17, breakLine: true } }, { text: d, options: { fontSize: 14, color: C.text2 } }],
      tb({ x: x + 1.15, y: y + 0.18, w: 4.55, h: 0.85, valign: "middle", objectName: "Agenda text " + (i + 1) }));
  });

  // 3 — Why
  pres.addSection({ title: "Why it matters" });
  s = content("Why Cybersecurity?", "Cybersecurity protects customer and partner data, keeps the business running, and keeps the trust a reputation depends on.", "Why it matters");
  const why = [
    [fa.FaDatabase, "Protect the Data", ["Confidentiality: prevent unauthorised exposure", "Integrity: prevent tampering or corruption", "Customer information, IP, credentials and contracts", "Regulatory obligations around data handling"]],
    [fa.FaCogs, "Protect the Operations", ["Availability: keep systems and services running", "Resilience: recover quickly when things go wrong", "Business continuity and delivery", "Reputation and trust with customers and partners"]],
  ];
  for (let i = 0; i < 2; i++) {
    const [ic, t, b] = why[i], x = 0.6 + i * 6.2;
    card(s, x, 1.85, 5.9, 3.65, HEX.tint, t + " card");
    await iconCircle(s, ic, x + 0.35, 2.15, 0.8, i ? HEX.deep : HEX.accent, t);
    s.addText(t, tb({ x: x + 1.35, y: 2.3, w: 4.3, h: 0.5, bold: true, fontSize: 20, objectName: t + " title" }));
    s.addText(b.map((v, j) => ({ text: v, options: { bullet: true, breakLine: j < b.length - 1 } })),
      tb({ x: x + 0.4, y: 3.2, w: 5.2, h: 2.1, fontSize: 15, paraSpaceAfter: 6, objectName: t + " bullets" }));
  }
  card(s, 0.6, 5.75, 12.1, 0.95, HEX.soft, "Breach note box");
  s.addText("A breach is not just a security incident: it is a reputational, commercial and potentially regulatory event.",
    tb({ x: 0.95, y: 5.75, w: 11.4, h: 0.95, valign: "middle", italic: true, fontSize: 17, color: C.accent2, objectName: "Breach note" }));

  // 4 — Roles
  s = content("What This Means For Your Role", "Security awareness is a way of thinking, not a training exercise.", "Why it matters");
  const roles = [
    [fa.FaUser, "As a User", "Every login, file share and link is a conscious decision: you are the first line of defence.", "One compromised credential or phishing click can expose the whole organisation."],
    [fa.FaCode, "As a Developer or Architect", "Security designed in from the first line of code: least privilege and threat models at design time.", "Flaws shipped to production cost far more to fix and erode trust with every patch."],
    [fa.FaClipboardList, "As a Product Analyst", "Privacy and data minimisation from the requirements stage: security as a product quality.", "Late security requirements create workarounds that users bypass."],
    [fa.FaUserTie, "As a Leader", "Cybersecurity on the agenda with revenue and delivery: risks and incidents have owners.", "Without ownership security turns reactive, and a breach becomes a commercial and regulatory event."],
  ];
  for (let i = 0; i < 4; i++) {
    const [ic, t, yes, no] = roles[i], col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.2, y = 1.8 + row * 2.6;
    card(s, x, y, 5.9, 2.4, HEX.tint, t + " card");
    await iconCircle(s, ic, x + 0.3, y + 0.3, 0.7, HEX.ink, t);
    s.addText(t, tb({ x: x + 1.2, y: y + 0.4, w: 4.5, h: 0.5, bold: true, fontSize: 18, objectName: t + " title" }));
    s.addText([{ text: "Security aware: ", options: { bold: true, color: GOOD } }, { text: yes, options: { breakLine: true } },
      { text: "If not: ", options: { bold: true, color: BAD } }, { text: no }],
      tb({ x: x + 0.35, y: y + 1.1, w: 5.25, h: 1.2, fontSize: 14, paraSpaceAfter: 6, objectName: t + " text" }));
  }

  // 5 — Structure
  pres.addSection({ title: "The framework" });
  s = content("Bringing Structure to Cybersecurity", "Cybersecurity has moved from a technical function to a business-wide discipline, and that shift needs a structured approach.", "The framework");
  const thenNow = [
    ["THEN", HEX.slate, ["An IT problem with a clear perimeter", "A small team owned it", "Firewalls, antivirus, patching; compliance was the goal", "Incidents were technical events"]],
    ["NOW", HEX.accent, ["Every device, SaaS tool and AI assistant is attack surface", "Every role is an entry point and a safeguard", "Resilience is the goal: absorb, detect, respond, recover", "Incidents are business events"]],
  ];
  thenNow.forEach(([lbl, col, pts], i) => {
    const x = 0.6 + i * 6.2;
    card(s, x, 1.8, 5.9, 2.55, i ? HEX.soft : HEX.tint, lbl + " card");
    s.addText(lbl, tb({ x: x + 0.35, y: 1.98, w: 5.2, h: 0.4, bold: true, fontSize: 16, color: col, objectName: lbl + " label" }));
    s.addText(pts.map((v, j) => ({ text: v, options: { bullet: true, breakLine: j < pts.length - 1 } })),
      tb({ x: x + 0.35, y: 2.45, w: 5.3, h: 1.8, fontSize: 14, paraSpaceAfter: 4, objectName: lbl + " points" }));
  });
  s.addText("How NIST CSF helps: one map, one language, one way to track progress, with Govern setting the strategy around all five", tb({ x: 0.6, y: 4.55, w: 12.1, h: 0.4, bold: true, fontSize: 15, objectName: "Flow label" }));
  const flow = [["IDENTIFY", "Know what you have, what matters, what the risks are"], ["PROTECT", "Right controls across data, systems and people"], ["DETECT", "Know when something goes wrong, early"], ["RESPOND", "Owners, processes and communications ready"], ["RECOVER", "Resume operations, protect reputation, improve"]];
  flow.forEach(([n, d], i) => {
    const x = 0.6 + i * 2.48, fn = n[0] + n.slice(1).toLowerCase();
    card(s, x, 5.1, 2.2, 1.65, HEX.white, n + " step");
    s.addShape("roundRect", { x, y: 5.1, w: 2.2, h: 1.65, rectRadius: 0.12, fill: { color: CSF[fn] }, line: { color: CSF[fn], width: 1.5 }, objectName: n + " fill" });
    s.addText(n, tb({ x: x + 0.15, y: 5.22, w: 1.9, h: 0.35, bold: true, fontSize: 15, color: HEX.ink, objectName: n + " name" }));
    s.addText(d, tb({ x: x + 0.15, y: 5.6, w: 1.95, h: 1.05, fontSize: 13, color: HEX.ink, objectName: n + " desc" }));
    if (i < 4) s.addText("→", tb({ x: x + 2.2, y: 5.65, w: 0.28, h: 0.5, align: "center", fontSize: 18, color: C.text2, objectName: "Arrow " + i }));
  });

  // 6 — Six functions
  s = content("The Six Functions", "Six parallel areas of activity, not sequential stages: all run continuously across the organisation.", "The framework");
  const six = [["Govern", "Risk strategy, policies, accountability and oversight", "Leadership · Legal & Compliance · HR"],
    ["Identify", "Asset inventory, risk assessment, supply chain risk", "Data · Technology · Operations · Supply Chain"],
    ["Protect", "Access control, data security, secure configuration, awareness training", "People · Data · Technology · Operations"],
    ["Detect", "Continuous monitoring, anomaly detection, event logging", "Technology · Operations · Data"],
    ["Respond", "Incident response planning, communications, analysis, mitigation", "People · Operations · Technology"],
    ["Recover", "Recovery planning, restoration, improvements, post-incident communications", "Operations · Technology · Supply Chain"]];
  const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.ink }, fontSize: 14 } });
  const rows = [[hdr("NIST function"), hdr("What it covers"), hdr("Where it shows up in the organisation")]].concat(
    six.map(([f, d, a]) => [{ text: f.toUpperCase(), options: { bold: true, color: HEX.ink, fill: { color: CSF[f] } } }, { text: d }, { text: a, options: { color: HEX.slate } }]));
  s.addTable(rows, { x: 0.6, y: 1.8, w: 12.1, colW: [2.2, 5.6, 4.3], fontSize: 15, rowH: 0.72, valign: "middle", border: { type: "solid", pt: 0.75, color: "E2E8F0" }, fontFace: "Calibri", objectName: "Six functions table" });

  // 7 — Tiers
  s = content("Implementation Tiers", "Four levels of maturity: each tier builds on the last.", "The framework");
  const tiers = [["Tier 1", "Partial", "Reactive and ad hoc; no formal risk management"], ["Tier 2", "Risk Informed", "Risk aware but applied inconsistently"], ["Tier 3", "Repeatable", "Consistent, policy-driven, formally approved"], ["Tier 4", "Adaptive", "Proactive, continuously improving; security is culture"]];
  const tierFill = ["E2E8F0", "C4B5FD", "8B5CF6", HEX.deep];
  tiers.forEach(([t, n, d], i) => {
    const x = 2.75 + i * 2.5;
    card(s, x, 1.75, 2.35, 1.35, tierFill[i], t + " box");
    const dark = i >= 2;
    s.addText([{ text: t + " · " + n, options: { bold: true, fontSize: 15, breakLine: true } }, { text: d, options: { fontSize: 12 } }],
      tb({ x: x + 0.15, y: 1.85, w: 2.05, h: 1.15, color: dark ? HEX.white : HEX.ink, objectName: t + " text" }));
  });
  const areas = [["Access control", ["Shared logins; access rarely reviewed", "Roles defined, applied unevenly", "Least privilege; periodic reviews", "Automated access governance"]],
    ["Design & development", ["Security bolted on after build", "Some requirements, unevenly followed", "Security in design; threat modelling", "Continuous security testing"]],
    ["Vendor management", ["No visibility of vendor risk", "Key vendors known; basic diligence", "Risk assessments; security terms", "Continuous vendor monitoring"]],
    ["Leadership & culture", ["Seen as IT's problem", "Aware, not actively engaged", "On the leadership agenda", "Embedded; everyone owns it"]]];
  areas.forEach(([a, cells], r) => {
    const y = 3.3 + r * 0.82;
    s.addText(a, tb({ x: 0.6, y, w: 2.05, h: 0.78, bold: true, fontSize: 14, valign: "middle", objectName: a + " label" }));
    cells.forEach((c, i) => {
      const x = 2.75 + i * 2.5;
      card(s, x, y, 2.35, 0.78, HEX.tint, a + " tier " + (i + 1));
      s.addText(c, tb({ x: x + 0.12, y, w: 2.12, h: 0.78, fontSize: 12, valign: "middle", objectName: a + " tier " + (i + 1) + " text" }));
    });
  });
  s.addText("Areas are illustrative; the assessment rates every subcategory.", tb({ x: 0.6, y: 6.6, w: 8, h: 0.3, fontSize: 11, italic: true, color: C.text2, objectName: "Tiers caption" }));

  // 8 — AI
  pres.addSection({ title: "AI" });
  s = content("When AI Enters the Picture", "The same approach applies, but AI widens the scope of harm and needs a dedicated lens.", "AI");
  s.addText("NIST AI 100-1: three categories of harm", tb({ x: 0.6, y: 1.75, w: 7.2, h: 0.4, bold: true, fontSize: 16, color: C.accent2, objectName: "Harm heading" }));
  const harms = [["P", "Harm to People", "Individuals' rights, safety and opportunity; discrimination against groups; society's access to education and democratic participation.", AIF.Govern],
    ["O", "Harm to an Organisation", "Business operations, security breaches, monetary loss, reputation: the category NIST CSF already covers.", AIF.Manage],
    ["E", "Harm to an Ecosystem", "Interconnected systems: financial systems, supply chains, natural resources and the environment.", AIF.Map]];
  harms.forEach(([l, t, d, col], i) => {
    const y = 2.25 + i * 1.5;
    card(s, 0.6, y, 7.2, 1.35, HEX.tint, t + " card");
    s.addShape("ellipse", { x: 0.85, y: y + 0.3, w: 0.75, h: 0.75, fill: { color: col }, line: { color: col }, objectName: t + " circle" });
    s.addText(l, tb({ x: 0.85, y: y + 0.3, w: 0.75, h: 0.75, align: "center", valign: "middle", bold: true, fontSize: 22, color: C.background1, objectName: t + " letter" }));
    s.addText([{ text: t, options: { bold: true, fontSize: 16, breakLine: true } }, { text: d, options: { fontSize: 13, color: C.text2 } }],
      tb({ x: 1.85, y: y + 0.12, w: 5.75, h: 1.15, objectName: t + " text" }));
  });
  card(s, 8.1, 1.75, 4.6, 4.95, HEX.soft, "AI RMF box");
  s.addText("NIST AI RMF 1.0", tb({ x: 8.4, y: 1.95, w: 4.0, h: 0.45, bold: true, fontSize: 18, color: C.accent2, objectName: "AI RMF heading" }));
  s.addText("Part 1 frames the wider harms; Part 2, the Core, gives four functions to manage them. The method stays familiar; what AI changes is the scope.",
    tb({ x: 8.4, y: 2.45, w: 4.0, h: 1.55, fontSize: 14, objectName: "AI RMF intro" }));
  Object.entries(AIF).forEach(([f, col], i) => {
    const y = 4.1 + i * 0.6;
    s.addShape("roundRect", { x: 8.4, y, w: 4.0, h: 0.48, rectRadius: 0.08, fill: { color: col }, line: { color: col }, objectName: f + " chip" });
    s.addText(f.toUpperCase(), tb({ x: 8.55, y, w: 3.7, h: 0.48, valign: "middle", bold: true, fontSize: 14, color: C.background1, objectName: f + " chip text" }));
  });

  // 9 — Closing the gap
  pres.addSection({ title: "Closing the gap" });
  s = content("Closing the Gap: Introducing Controls", "Once the gaps are known, controls say what to do to close them.", "Closing the gap");
  card(s, 0.6, 1.75, 5.95, 4.95, HEX.tint, "CIS card");
  s.addText("The CSF gap: CIS Controls", tb({ x: 0.9, y: 1.95, w: 5.4, h: 0.45, bold: true, fontSize: 18, objectName: "CIS heading" }));
  s.addText("A prioritised set of practical safeguards from the Center for Internet Security. NIST CSF says what outcome to achieve; CIS Controls say how, grouped by size and capability.",
    tb({ x: 0.9, y: 2.45, w: 5.4, h: 1.5, fontSize: 14, objectName: "CIS intro" }));
  [["IG1", "Basic hygiene every organisation should have"], ["IG2", "For organisations with a dedicated security function"], ["IG3", "For high risk exposure or strict regulation"]].forEach(([g, d], i) => {
    const y = 4.05 + i * 0.85;
    s.addShape("roundRect", { x: 0.9, y, w: 0.95, h: 0.65, rectRadius: 0.08, fill: { color: tierFill[i + 1] }, line: { color: tierFill[i + 1] }, objectName: g + " chip" });
    s.addText(g, tb({ x: 0.9, y, w: 0.95, h: 0.65, align: "center", valign: "middle", bold: true, fontSize: 15, color: i ? HEX.white : HEX.ink, objectName: g + " label" }));
    s.addText(d, tb({ x: 2.0, y, w: 4.3, h: 0.65, valign: "middle", fontSize: 14, objectName: g + " text" }));
  });
  card(s, 6.75, 1.75, 5.95, 4.95, HEX.soft, "AI gap card");
  s.addText("The AI gap: follow the direction of risk", tb({ x: 7.05, y: 1.95, w: 5.4, h: 0.45, bold: true, fontSize: 18, color: C.accent2, objectName: "AI gap heading" }));
  const dirs = [[fa.FaSignInAlt, "What enters", "Third-party models, agents and tools whose training and risk choices you did not make."],
    [fa.FaSignOutAlt, "What leaves", "Data in prompts and AI-assisted outputs, which carry your accountability."],
    [fa.FaRandom, "What bypasses", "Adversarial AI, undisclosed AI output and outside agents acting in your name."]];
  for (let i = 0; i < 3; i++) {
    const [ic, t, d] = dirs[i], y = 2.55 + i * 1.35;
    await iconCircle(s, ic, 7.05, y + 0.1, 0.7, HEX.deep, t);
    s.addText([{ text: t, options: { bold: true, fontSize: 15, breakLine: true } }, { text: d, options: { fontSize: 13, color: C.text2 } }],
      tb({ x: 7.95, y, w: 4.5, h: 1.2, objectName: t + " text" }));
  }

  // 10 — How the assessment works
  pres.addSection({ title: "The assessment" });
  s = content("How the Assessment Works", "One intake, one questionnaire, two reports: the same approach for cybersecurity and for AI.", "The assessment");
  const steps = [[fa.FaClipboardCheck, "Intake", "Sector, certifications, and how the organisation uses or builds AI"],
    [fa.FaListUl, "Questionnaire", "A NIST CSF 2.0 sheet (106 subcategories) and an AI RMF sheet scoped to the organisation's AI use"],
    [fa.FaPenFancy, "Answers & profile", "Each subcategory rated: current and target tier or maturity, with evidence"],
    [fa.FaChartBar, "Reports", "CSF and AI RMF reports, a hub page, and a roadmap built from the gaps"]];
  for (let i = 0; i < 4; i++) {
    const [ic, t, d] = steps[i], x = 0.6 + i * 3.08;
    card(s, x, 1.8, 2.8, 2.75, HEX.tint, t + " step card");
    await iconCircle(s, ic, x + 0.3, 2.05, 0.75, i === 3 ? HEX.accent : HEX.ink, t);
    s.addText([{ text: (i + 1) + ". " + t, options: { bold: true, fontSize: 16, breakLine: true } }, { text: d, options: { fontSize: 13, color: C.text2 } }],
      tb({ x: x + 0.3, y: 3.0, w: 2.3, h: 1.45, objectName: t + " step text" }));
    if (i < 3) s.addText("→", tb({ x: x + 2.8, y: 2.95, w: 0.28, h: 0.5, align: "center", fontSize: 20, color: C.text2, objectName: "Step arrow " + i }));
  }
  s.addText("From gap to action", tb({ x: 0.6, y: 4.8, w: 12.1, h: 0.4, bold: true, fontSize: 16, color: C.accent2, objectName: "Gap to action heading" }));
  [["Assess", "Rate each subcategory, Tier 1 to 4"], ["Find the gap", "Current below target"], ["Map to safeguards", "CIS safeguards and the AI RMF Playbook"], ["Phase by priority", "High → 0–3 months, Medium → 3–6, Low → 6–12"]].forEach(([t, d], i) => {
    const x = 0.6 + i * 3.08;
    card(s, x, 5.3, 2.8, 1.35, HEX.soft, t + " card");
    s.addText([{ text: t, options: { bold: true, fontSize: 15, breakLine: true } }, { text: d, options: { fontSize: 13, color: C.text2 } }],
      tb({ x: x + 0.25, y: 5.42, w: 2.35, h: 1.15, objectName: t + " text" }));
  });
  s.addNotes("The organisation's own results go in the assessment hub and the two reports (Stage 3 skills). Add screenshots of them on a following slide when presenting a specific assessment.");

  // 11 — Closing
  pres.addSection({ title: "Close" });
  s = pres.addSlide({ masterName: "Title Dark", sectionTitle: "Close" });
  s.addText("Questions & Discussion", { placeholder: "title" });
  s.addText("Security is not a layer added on top of the business: it is the way the business thinks.", { placeholder: "body" });

  // 12 — References
  s = content("References", "Public sources behind the frameworks and the assessment.", "Close");
  const refs = [["NIST Cybersecurity Framework 2.0", "https://www.nist.gov/cyberframework"],
    ["CSF 2.0 informative references (OLIR)", "https://csrc.nist.gov/Projects/olir"],
    ["CSF 2.0 browsable reference", "https://csf.tools/framework/csf-v2-0/"],
    ["NIST AI Risk Management Framework 1.0 (AI 100-1)", "https://www.nist.gov/itl/ai-risk-management-framework"],
    ["NIST AI RMF Playbook", "https://airc.nist.gov/airmf-resources/playbook/"],
    ["CIS Controls v8.1 and the AI companion guides", "https://www.cisecurity.org/controls"],
    ["CISA Cyber Security Evaluation Tool (CSET)", "https://github.com/cisagov/cset"]];
  s.addText(refs.flatMap(([t, u], i) => [{ text: t + ": ", options: { bold: true } },
    { text: u, options: { hyperlink: { url: u }, color: C.hlink, breakLine: i < refs.length - 1 } }]),
    tb({ x: 0.6, y: 1.85, w: 12.1, h: 4.6, fontSize: 16, paraSpaceAfter: 12, objectName: "Reference list" }));

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
