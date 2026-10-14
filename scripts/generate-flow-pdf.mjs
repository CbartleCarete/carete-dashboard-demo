// Generates carete-flow.pdf — a one-page landscape flow diagram of the
// Members > Claims > Reports data flow. Uses pdf-lib (already a dep) so
// there's no extra tooling. Run from the project root:
//
//   node scripts/generate-flow-pdf.mjs
//
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";

// US Letter, landscape — pt units.
const W = 792;
const H = 612;

const pdfDoc = await PDFDocument.create();
pdfDoc.setTitle("Carete Dashboard — Members > Claims > Reports flow");
pdfDoc.setAuthor("Carete");
const page = pdfDoc.addPage([W, H]);

const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

// Palette
const ink900 = rgb(0.10, 0.13, 0.18);
const ink700 = rgb(0.25, 0.30, 0.36);
const ink500 = rgb(0.45, 0.50, 0.58);
const ink300 = rgb(0.80, 0.82, 0.86);
const ink100 = rgb(0.96, 0.97, 0.98);
const brand = rgb(0.18, 0.42, 0.86);
const brandDark = rgb(0.10, 0.28, 0.62);
const brandTint = rgb(0.92, 0.95, 1.0);
const white = rgb(1, 1, 1);

// Top-origin helper — every y in this script is "from the top" of the page.
const ty = (y) => H - y;

function rect({ x, y, w, h, fill = white, stroke = ink300, strokeWidth = 0.75 }) {
  page.drawRectangle({
    x,
    y: ty(y + h),
    width: w,
    height: h,
    color: fill,
    borderColor: stroke,
    borderWidth: strokeWidth,
  });
}

function wrapLines(text, maxWidth, font, size) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? cur + " " + word : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (cur) lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function txt(
  text,
  { x, y, font = helv, size = 10, color = ink700, maxWidth, lineHeight = 1.4 } = {}
) {
  let cursorY = y;
  for (const para of String(text).split("\n")) {
    const lines = maxWidth ? wrapLines(para, maxWidth, font, size) : [para];
    for (const line of lines) {
      page.drawText(line, { x, y: ty(cursorY) - size, size, font, color });
      cursorY += size * lineHeight;
    }
  }
  return cursorY;
}

function arrow(x1, y1, x2, y2, { color = ink500, width = 1, head = 5 } = {}) {
  page.drawLine({
    start: { x: x1, y: ty(y1) },
    end: { x: x2, y: ty(y2) },
    thickness: width,
    color,
  });
  if (Math.abs(x2 - x1) < 0.5) {
    // vertical
    const dir = y2 > y1 ? 1 : -1;
    page.drawLine({ start: { x: x2 - head, y: ty(y2) + dir * head }, end: { x: x2, y: ty(y2) }, thickness: width, color });
    page.drawLine({ start: { x: x2 + head, y: ty(y2) + dir * head }, end: { x: x2, y: ty(y2) }, thickness: width, color });
  } else if (Math.abs(y2 - y1) < 0.5) {
    // horizontal
    const dir = x2 > x1 ? 1 : -1;
    page.drawLine({ start: { x: x2 - dir * head, y: ty(y2) - head }, end: { x: x2, y: ty(y2) }, thickness: width, color });
    page.drawLine({ start: { x: x2 - dir * head, y: ty(y2) + head }, end: { x: x2, y: ty(y2) }, thickness: width, color });
  }
}

// ──────────────────────────────── Title ─────────────────────────────────
txt("Carete Dashboard — flow", { x: 30, y: 42, font: helvBold, size: 18, color: ink900 });
txt("How a member becomes billable, becomes a claim, becomes a report.", {
  x: 30,
  y: 65,
  font: helv,
  size: 11,
  color: ink500,
});

// ──────────────────────── Section header band ───────────────────────────
const sectionY = 95;
const sectionH = 28;
const colW = 230;
const colXs = [30, 281, 532];
const colLabels = ["MEMBERS", "CLAIMS", "REPORTS"];

for (let i = 0; i < 3; i++) {
  rect({ x: colXs[i], y: sectionY, w: colW, h: sectionH, fill: ink900, stroke: ink900 });
  const labelW = helvBold.widthOfTextAtSize(colLabels[i], 12);
  txt(colLabels[i], {
    x: colXs[i] + (colW - labelW) / 2,
    y: sectionY + 9,
    font: helvBold,
    size: 12,
    color: white,
  });
}

// Inter-section arrows in the header band, sitting in the column gutters.
const bandYMid = sectionY + sectionH / 2;
const gap1Mid = (colXs[0] + colW + colXs[1]) / 2;
const gap2Mid = (colXs[1] + colW + colXs[2]) / 2;
arrow(gap1Mid - 6, bandYMid, gap1Mid + 6, bandYMid, { color: white, width: 1.4, head: 4 });
arrow(gap2Mid - 6, bandYMid, gap2Mid + 6, bandYMid, { color: white, width: 1.4, head: 4 });

// ─────────────────────────────── Boxes ──────────────────────────────────
function flowBox({ col, y, h, title, subtitle, body, highlight = false, terminal = false }) {
  const x = colXs[col];
  const w = colW;
  const fill = highlight ? brandTint : terminal ? ink100 : white;
  const stroke = highlight ? brand : ink300;
  const strokeWidth = highlight ? 1.4 : 0.75;
  rect({ x, y, w, h, fill, stroke, strokeWidth });

  let cy = y + 12;
  txt(title, {
    x: x + 12,
    y: cy,
    font: helvBold,
    size: 11,
    color: highlight ? brandDark : ink900,
  });
  cy += 15;

  if (subtitle) {
    txt(subtitle, {
      x: x + 12,
      y: cy,
      font: helvBold,
      size: 9,
      color: highlight ? brand : ink500,
    });
    cy += 12;
  }

  if (body) {
    txt(body, {
      x: x + 12,
      y: cy + 2,
      font: helv,
      size: 9,
      color: ink700,
      maxWidth: w - 24,
      lineHeight: 1.4,
    });
  }
}

const boxStartY = 140;

const memberBoxes = [
  {
    h: 70,
    title: "Add Member",
    subtitle: "Intake form",
    body: "Captures name, DOB, MCP, CIN, address, homeless status.",
  },
  {
    h: 56,
    title: "status: pending",
    body: "Member appears in the Eligibility Queue, awaiting verification.",
  },
  {
    h: 104,
    title: "Eligibility check",
    subtitle: "API call > MCP",
    body: "X12 270 sent to the member's plan. 271 response parsed for active Medi-Cal coverage + ECM / CS benefit category. Writes back active or ineligible.",
    highlight: true,
  },
  {
    h: 60,
    title: "status: active",
    body: "Enrolled. Service lines can now be billed against this member.",
  },
  {
    h: 48,
    title: "status: ineligible",
    body: "Rejected by MCP — not billable.",
    terminal: true,
  },
];

const claimBoxes = [
  {
    h: 90,
    title: "Add Service",
    body: "Pick program > service > variant from DHCS catalog. Variant carries HCPCS, modifiers, unit, and defaultRate. Charge auto-fills as rate × units, editable.",
  },
  {
    h: 76,
    title: "Service line",
    subtitle: "status: pending",
    body: "Stored with memberId, serviceId + variantId, dates, units, charge, place of service.",
  },
  {
    h: 104,
    title: "Bundle invoice",
    body: "Multi-select pending lines > PDF export. One member, one payer (MCP), <= 6 service lines per invoice. Org NPI / TIN pulled from Settings.",
    highlight: true,
  },
  {
    h: 60,
    title: "MCP adjudicates",
    body: "Submitted to payer (mail · portal · fax). Plan returns paid or denied.",
  },
  {
    h: 50,
    title: "status: active  or  denied",
    body: "Active = paid, settled. Denied = surface for follow-up.",
    terminal: true,
  },
];

const reportBoxes = [
  {
    h: 56,
    title: "Aggregations",
    body: "Reads from members store + claims store.",
  },
  {
    h: 150,
    title: "KPIs",
    body:
      "· Reimbursement — $ from active claims\n" +
      "· Enrollment rate — active / total members\n" +
      "· Services delivered — count of lines, by program\n" +
      "· Claims success rate — active / submitted\n" +
      "· Denial rate — denied / submitted",
  },
  {
    h: 110,
    title: "Exports",
    body:
      "· All Claims (CSV)\n" +
      "· All Members (CSV)\n" +
      "· Services delivered (CSV)\n" +
      "· Custom export builder",
  },
];

function layoutColumn(col, boxes) {
  let y = boxStartY;
  const positions = [];
  for (const b of boxes) {
    flowBox({ col, y, ...b });
    positions.push({ y, h: b.h });
    y += b.h + 10;
  }
  return positions;
}

const memberPositions = layoutColumn(0, memberBoxes);
const claimPositions = layoutColumn(1, claimBoxes);
const reportPositions = layoutColumn(2, reportBoxes);

// Vertical arrows within each column — link box i to box i+1, except where
// a branch tells a different story (handled below).
function verticalArrows(positions, colIdx, skipBetween = []) {
  for (let i = 0; i < positions.length - 1; i++) {
    if (skipBetween.includes(i)) continue;
    const pos = positions[i];
    const x = colXs[colIdx] + colW / 2;
    arrow(x, pos.y + pos.h, x, pos.y + pos.h + 10);
  }
}

// In Members, skip the arrow between "active" (3) and "ineligible" (4)
// — that's a branch from the eligibility box, not a linear step.
verticalArrows(memberPositions, 0, [3]);
verticalArrows(claimPositions, 1);
verticalArrows(reportPositions, 2);

// Branch: eligibility > ineligible (around the right side of the column).
{
  const eligBox = memberPositions[2];
  const ineligBox = memberPositions[4];
  const branchX = colXs[0] + colW + 8;
  const yStart = eligBox.y + eligBox.h - 18;
  const yEnd = ineligBox.y + ineligBox.h / 2;
  // out > down > back-in
  page.drawLine({
    start: { x: colXs[0] + colW, y: ty(yStart) },
    end: { x: branchX, y: ty(yStart) },
    thickness: 0.75,
    color: ink500,
  });
  page.drawLine({
    start: { x: branchX, y: ty(yStart) },
    end: { x: branchX, y: ty(yEnd) },
    thickness: 0.75,
    color: ink500,
  });
  arrow(branchX, yEnd, colXs[0] + colW, yEnd);
  txt("no", {
    x: branchX + 1,
    y: (yStart + yEnd) / 2 - 4,
    font: helvBold,
    size: 7,
    color: ink500,
  });
}

// ─────────────── Footer: legend + caveat ───────────────
const footerY = H - 24;
txt(
  "Legend:  filled boxes = highlighted step (where the real work happens).  Grey boxes = terminal state.",
  { x: 30, y: footerY, font: helv, size: 8, color: ink500 }
);
txt(
  "Eligibility is a labelled API step here — today the dashboard toggles status manually; production wires X12 270/271 to each MCP.",
  { x: 30, y: footerY + 11, font: helv, size: 8, color: ink500 }
);

// ───────────────────────── Save ─────────────────────────
const bytes = await pdfDoc.save();
writeFileSync("carete-flow.pdf", bytes);
console.log("Wrote carete-flow.pdf");
