// Generates carete-data-spec.pdf — a one-page landscape "what we collect"
// spec sheet showing real example records side-by-side (Member, Claim) so
// onboarding clients can see what data actually lives in the system.
//
//   node scripts/generate-data-spec-pdf.mjs
//
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "node:fs";

const W = 792;
const H = 612;
const M = 40; // page margin

const pdfDoc = await PDFDocument.create();
pdfDoc.setTitle("Carete — data spec");
pdfDoc.setAuthor("Carete");
const page = pdfDoc.addPage([W, H]);

const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

// ─── Palette ──────────────────────────────────────────────────────────────
const ink900 = rgb(0.10, 0.13, 0.18);
const ink700 = rgb(0.30, 0.35, 0.42);
const ink500 = rgb(0.50, 0.55, 0.62);
const ink400 = rgb(0.62, 0.66, 0.72);
const ink300 = rgb(0.82, 0.84, 0.88);
const ink200 = rgb(0.90, 0.92, 0.94);
const ink100 = rgb(0.96, 0.97, 0.98);
const ink50  = rgb(0.985, 0.99, 0.995);
const brand     = rgb(0.20, 0.45, 0.85);
const brandDark = rgb(0.12, 0.30, 0.65);
const brandTint = rgb(0.93, 0.96, 1.0);
const green     = rgb(0.20, 0.55, 0.30);
const greenTint = rgb(0.91, 0.97, 0.92);
const white     = rgb(1, 1, 1);

// ─── Helpers ──────────────────────────────────────────────────────────────
const ty = (y) => H - y;

function rect({ x, y, w, h, fill = white, stroke, strokeWidth = 0.75 }) {
  page.drawRectangle({
    x, y: ty(y + h), width: w, height: h,
    color: fill,
    borderColor: stroke ?? fill,
    borderWidth: stroke ? strokeWidth : 0,
  });
}

function hline(x1, y, x2, { color = ink200, width = 0.5 } = {}) {
  page.drawLine({
    start: { x: x1, y: ty(y) },
    end:   { x: x2, y: ty(y) },
    thickness: width,
    color,
  });
}

function wrapLines(text, maxWidth, font, size) {
  const words = String(text).split(/\s+/);
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

// Draws text where (x, y) is the TOP-LEFT of the first line (not baseline).
function txt(text, { x, y, font = helv, size = 10, color = ink700, maxWidth, lineHeight = 1.4 } = {}) {
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

// Filled circle (pdf-lib's drawCircle uses center + radius). y is top-of-circle.
function circle({ x, yTop, r, fill }) {
  page.drawCircle({
    x: x + r, y: ty(yTop + r), size: r,
    color: fill, borderColor: fill, borderWidth: 0,
  });
}

// Pill (rounded-rect-ish) — circles at the ends + filled rect in the middle.
function pill({ x, y, label, color, tint, font = helvBold, size = 8 }) {
  const padX = 9, padY = 4;
  const labelW = font.widthOfTextAtSize(label, size);
  const w = labelW + padX * 2;
  const h = size + padY * 2;
  const r = h / 2;
  // Caps
  circle({ x, yTop: y, r, fill: tint });
  circle({ x: x + w - 2 * r, yTop: y, r, fill: tint });
  // Middle
  rect({ x: x + r, y, w: w - 2 * r, h, fill: tint });
  // Label
  page.drawText(label, {
    x: x + padX, y: ty(y + h - padY) - size + 1,
    size, font, color,
  });
  return { w, h };
}

// ─── Title block ──────────────────────────────────────────────────────────
txt("Carete — data spec", {
  x: M, y: M, font: helvBold, size: 26, color: ink900,
});
txt("What we collect on every member and every claim, and how they relate.", {
  x: M, y: M + 34, font: helv, size: 11, color: ink500,
});
hline(M, M + 58, W - M, { color: ink200, width: 0.75 });

// ─── Showcase cards ───────────────────────────────────────────────────────
//
// Two example records side-by-side, with a relationship strip between them.
// Each card shows real example data the user would actually see in the app.
//
const cardY = M + 76;
const cardW = 312;
const cardH = 352;
const cardGap = 48;
const cardsTotalW = cardW * 2 + cardGap;
const cardXs = [
  (W - cardsTotalW) / 2,
  (W - cardsTotalW) / 2 + cardW + cardGap,
];

function drawShowcaseCard({
  x, y, w, h,
  eyebrow,
  caption,
  primary,
  secondaryId,
  statusLabel,
  groups,
  footer,
}) {
  rect({ x, y, w, h, fill: white, stroke: ink300, strokeWidth: 1 });

  const pad = 22;
  let cy = y + pad;

  // Eyebrow (small caps label)
  txt(eyebrow, { x: x + pad, y: cy, font: helvBold, size: 9, color: brand });
  cy += 14;

  // Primary identifier
  txt(primary, { x: x + pad, y: cy, font: helvBold, size: 17, color: ink900 });
  cy += 22;

  // Caption + secondary id on one line
  if (caption) {
    txt(caption, { x: x + pad, y: cy, font: helv, size: 9.5, color: ink500 });
  }
  if (secondaryId) {
    const idW = helv.widthOfTextAtSize(secondaryId, 9.5);
    txt(secondaryId, {
      x: x + w - pad - idW, y: cy,
      font: helv, size: 9.5, color: ink400,
    });
  }
  cy += 16;

  // Status pill
  if (statusLabel) {
    pill({
      x: x + pad, y: cy,
      label: statusLabel,
      color: green, tint: greenTint,
    });
    cy += 22;
  }

  // Divider
  hline(x + pad, cy, x + w - pad);
  cy += 14;

  // Field groups
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    txt(group.label.toUpperCase(), {
      x: x + pad, y: cy, font: helvBold, size: 8, color: ink500,
    });
    cy += 14;

    const labelColW = 100;
    for (const [label, value] of group.rows) {
      txt(label, { x: x + pad, y: cy, font: helv, size: 9.5, color: ink500 });
      txt(value, {
        x: x + pad + labelColW, y: cy,
        font: helvBold, size: 9.5, color: ink900,
        maxWidth: w - pad - labelColW - pad,
        lineHeight: 1.35,
      });
      const vlines = wrapLines(value, w - pad - labelColW - pad, helvBold, 9.5);
      cy += Math.max(14, vlines.length * 9.5 * 1.35 + 2);
    }
    if (g < groups.length - 1) cy += 8;
  }

  // Footer (source)
  if (footer) {
    const footerY = y + h - pad - 8;
    hline(x + pad, footerY - 8, x + w - pad);
    txt(footer, {
      x: x + pad, y: footerY,
      font: helv, size: 8, color: ink400,
      maxWidth: w - pad * 2, lineHeight: 1.4,
    });
  }
}

// MEMBER showcase — real example record (Maria Garcia from claimsStore demo data)
drawShowcaseCard({
  x: cardXs[0], y: cardY, w: cardW, h: cardH,
  eyebrow: "MEMBER",
  primary: "Maria Garcia",
  secondaryId: "M-001",
  caption: "the person receiving services",
  statusLabel: "Active  ·  enrolled",
  groups: [
    {
      label: "Identity",
      rows: [
        ["Date of birth", "Apr 12, 1962"],
        ["MCP", "Health Net"],
        ["CIN", "ABC123456"],
      ],
    },
    {
      label: "Contact",
      rows: [
        ["Address", "1801 N Fresno St, Fresno CA 93703"],
        ["Homeless", "no"],
      ],
    },
    {
      label: "Eligibility",
      rows: [
        ["Last verified", "Apr 30, 2026"],
        ["Source", "X12 270/271 to MCP"],
      ],
    },
  ],
  footer:
    "Collected on intake; coverage confirmed via API call to the member's MCP.",
});

// CLAIM showcase — one of Maria's actual service lines (CLM-2026-1241)
drawShowcaseCard({
  x: cardXs[1], y: cardY, w: cardW, h: cardH,
  eyebrow: "CLAIM (service line)",
  primary: "ECM — Care Management",
  secondaryId: "CLM-2026-1241",
  caption: "one line per encounter delivered",
  statusLabel: "Active  ·  paid",
  groups: [
    {
      label: "Service",
      rows: [
        ["HCPCS + mods", "G9008  ·  U1"],
        ["Variant", "Clinical staff — in person"],
        ["Billing unit", "per encounter"],
        ["Units", "2"],
      ],
    },
    {
      label: "Dates & place",
      rows: [
        ["Service date", "Apr 8 to Apr 22, 2026"],
        ["Place of service", "12 (home)"],
      ],
    },
    {
      label: "Money",
      rows: [
        ["Charge", "$420.00"],
        ["Rate", "$210.00 × 2 units"],
      ],
    },
    {
      label: "Linked to",
      rows: [
        ["Member", "M-001  ·  Maria Garcia"],
      ],
    },
  ],
  footer:
    "Logged in Add Service modal; codes derived from the DHCS catalog (rate × units auto-fills, editable).",
});

// ─── Relationship caption strip — sits BELOW both cards, spans them ──────
{
  const stripY = cardY + cardH + 8;
  const stripH = 24;
  const stripX = cardXs[0];
  const stripW = cardXs[1] + cardW - cardXs[0];
  rect({ x: stripX, y: stripY, w: stripW, h: stripH, fill: brandTint, stroke: ink200, strokeWidth: 0.5 });

  // Composite label, all on one line, centered.
  const A = "ONE MEMBER";
  const sep = "   has   ";
  const B = "MANY CLAIMS";
  const tail = "   .  Claims bundle (up to 6) into one invoice PDF for the MCP.";

  const fSize = 9.5;
  const wA = helvBold.widthOfTextAtSize(A, fSize);
  const wSep = helv.widthOfTextAtSize(sep, fSize);
  const wB = helvBold.widthOfTextAtSize(B, fSize);
  const wTail = helv.widthOfTextAtSize(tail, fSize);
  const totalW = wA + wSep + wB + wTail;

  let cx = stripX + (stripW - totalW) / 2;
  const yBase = stripY + 6;
  txt(A,    { x: cx, y: yBase, font: helvBold, size: fSize, color: brandDark }); cx += wA;
  txt(sep,  { x: cx, y: yBase, font: helv,     size: fSize, color: ink500 });    cx += wSep;
  txt(B,    { x: cx, y: yBase, font: helvBold, size: fSize, color: brandDark }); cx += wB;
  txt(tail, { x: cx, y: yBase, font: helv,     size: fSize, color: ink500 });
}

// ─── Footer panels: ORG SETUP + EXCHANGES ─────────────────────────────────
const footerY = cardY + cardH + 8 + 24 + 10; // below the relationship strip
const footerH = H - footerY - M;
const footerCardW = (W - M * 2 - 24) / 2;
const footerXs = [M, M + footerCardW + 24];

function drawReferencePanel({ x, y, w, h, title, rows }) {
  rect({ x, y, w, h, fill: ink50, stroke: ink200, strokeWidth: 0.75 });

  const pad = 16;
  let cy = y + pad - 2;
  txt(title.toUpperCase(), {
    x: x + pad, y: cy,
    font: helvBold, size: 8, color: brand,
  });
  cy += 14;

  const labelColW = 108;
  for (const [name, value] of rows) {
    txt(name, { x: x + pad, y: cy, font: helvBold, size: 9, color: ink900 });
    txt(value, {
      x: x + pad + labelColW, y: cy,
      font: helv, size: 9, color: ink700,
      maxWidth: w - pad - labelColW - pad, lineHeight: 1.35,
    });
    const vlines = wrapLines(value, w - pad - labelColW - pad, helv, 9);
    cy += Math.max(13, vlines.length * 9 * 1.35 + 2);
  }
}

drawReferencePanel({
  x: footerXs[0], y: footerY, w: footerCardW, h: footerH,
  title: "Org setup  —  one-time, on onboarding",
  rows: [
    ["NPI", "Billing NPI (10 digits)."],
    ["Tax ID (TIN / EIN)", "Federal tax ID, prints on every invoice."],
    ["Org name + address", "Billing provider on every claim PDF."],
    ["Rendering provider", "Optional — only if NPI differs from billing."],
    ["Per-payer IDs", "MCP-issued IDs (e.g. payor primary ID)."],
  ],
});

drawReferencePanel({
  x: footerXs[1], y: footerY, w: footerCardW, h: footerH,
  title: "Exchanges  —  what flows where",
  rows: [
    ["Carete  >  MCP", "Eligibility check (X12 270 out, 271 back)."],
    ["Carete  >  MCP", "Claim invoice PDF (mail · portal · fax)."],
    ["MCP  >  Carete", "Adjudication: paid or denied."],
    ["Carete  >  Org", "Reports + CSV exports for finance / program staff."],
  ],
});

// ─── Save ─────────────────────────────────────────────────────────────────
const bytes = await pdfDoc.save();
writeFileSync("carete-data-spec.pdf", bytes);
console.log("Wrote carete-data-spec.pdf");
