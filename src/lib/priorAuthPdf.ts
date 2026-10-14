// Prior Authorization Request PDF generator.
//
// Builds a clean, printable document summarizing a submitted PA request —
// the same information logged to the Prior Authorizations store and
// drafted into the "Send Message" to the health plan — laid out as a
// document a care coordinator could print, fax, or attach to an outbound
// request. Unlike claimPdf.ts, there's no payer template to fill in: PA
// requests aren't tied to one payer's form, so this is drawn from a blank
// page with pdf-lib and paginates automatically as content grows.

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type Color,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export interface PriorAuthPdfChecklistItem {
  text: string;
  checked: boolean;
}

export interface PriorAuthPdfSection {
  heading: string;
  rows?: string[];
  checklist?: PriorAuthPdfChecklistItem[];
}

export interface PriorAuthPdfInput {
  paId: string;
  requestedOn: string;
  statusLabel: string;
  memberName: string;
  memberId: string;
  serviceLabel: string;
  healthPlan: string;
  sections: PriorAuthPdfSection[];
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 50;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const INK = rgb(0.03, 0.05, 0.12);
const MUTED = rgb(0.42, 0.46, 0.53);
const BRAND = rgb(0.17, 0.42, 0.88);
const RULE = rgb(0.86, 0.88, 0.92);

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  pageNum: number;
}

const wrapText = (
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (current && font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const drawFooter = (ctx: Ctx) => {
  ctx.page.drawText(
    `Carete · Prior Authorization Request · Page ${ctx.pageNum}`,
    { x: MARGIN_X, y: 28, size: 7.5, font: ctx.font, color: MUTED }
  );
};

const newPage = (ctx: Ctx) => {
  drawFooter(ctx);
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.pageNum += 1;
  ctx.y = PAGE_HEIGHT - MARGIN_TOP;
};

const ensureSpace = (ctx: Ctx, needed: number) => {
  if (ctx.y - needed < MARGIN_BOTTOM) {
    newPage(ctx);
  }
};

const drawTextLine = (
  ctx: Ctx,
  text: string,
  opts: { size?: number; font?: PDFFont; color?: Color; gap?: number } = {}
) => {
  const size = opts.size ?? 9.5;
  const font = opts.font ?? ctx.font;
  const color = opts.color ?? INK;
  const gap = opts.gap ?? 3;
  const lines = wrapText(text, font, size, CONTENT_WIDTH);
  for (const line of lines) {
    ensureSpace(ctx, size + gap);
    ctx.page.drawText(line, { x: MARGIN_X, y: ctx.y, size, font, color });
    ctx.y -= size + gap;
  }
};

const drawSectionHeading = (ctx: Ctx, heading: string) => {
  ensureSpace(ctx, 26);
  ctx.y -= 6;
  ctx.page.drawText(heading, {
    x: MARGIN_X,
    y: ctx.y,
    size: 11,
    font: ctx.bold,
    color: BRAND,
  });
  ctx.y -= 4;
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: ctx.y },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: ctx.y },
    thickness: 0.75,
    color: RULE,
  });
  ctx.y -= 12;
};

const drawChecklistItem = (ctx: Ctx, item: PriorAuthPdfChecklistItem) => {
  const boxSize = 8;
  const indent = 16;
  const size = 9.5;
  const lines = wrapText(item.text, ctx.font, size, CONTENT_WIDTH - indent);

  ensureSpace(ctx, size + 4);
  const boxY = ctx.y - boxSize + 1.5;
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: boxY,
    width: boxSize,
    height: boxSize,
    borderWidth: 0.9,
    borderColor: MUTED,
    ...(item.checked ? { color: INK } : {}),
  });

  lines.forEach((line, i) => {
    if (i > 0) ensureSpace(ctx, size + 4);
    ctx.page.drawText(line, {
      x: MARGIN_X + indent,
      y: ctx.y,
      size,
      font: ctx.font,
      color: INK,
    });
    ctx.y -= size + 4;
  });
};

export const buildPriorAuthPdf = async (
  input: PriorAuthPdfInput
): Promise<Uint8Array> => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const ctx: Ctx = {
    doc,
    page,
    y: PAGE_HEIGHT - MARGIN_TOP,
    font,
    bold,
    pageNum: 1,
  };

  ctx.page.drawText("Carete", {
    x: MARGIN_X,
    y: ctx.y,
    size: 18,
    font: bold,
    color: BRAND,
  });
  ctx.page.drawText("Prior Authorization Request", {
    x: MARGIN_X,
    y: ctx.y - 20,
    size: 11,
    font,
    color: MUTED,
  });

  const metaLines = [
    `PA ID: ${input.paId}`,
    `Requested: ${input.requestedOn}`,
    `Status: ${input.statusLabel}`,
  ];
  metaLines.forEach((line, i) => {
    const w = font.widthOfTextAtSize(line, 9);
    ctx.page.drawText(line, {
      x: PAGE_WIDTH - MARGIN_X - w,
      y: ctx.y - i * 12,
      size: 9,
      font,
      color: MUTED,
    });
  });

  ctx.y -= 36;
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN_X, y: ctx.y },
    thickness: 1,
    color: BRAND,
  });
  ctx.y -= 10;

  drawTextLine(ctx, `${input.serviceLabel} — ${input.memberName} (${input.memberId})`, {
    size: 12,
    font: bold,
  });
  drawTextLine(ctx, `Health Plan: ${input.healthPlan}`, {
    size: 9.5,
    color: MUTED,
  });
  ctx.y -= 6;

  for (const section of input.sections) {
    drawSectionHeading(ctx, section.heading);
    for (const row of section.rows ?? []) {
      drawTextLine(ctx, row);
    }
    if (section.checklist?.length) {
      ctx.y -= 2;
      for (const item of section.checklist) {
        drawChecklistItem(ctx, item);
      }
    }
    ctx.y -= 6;
  }

  drawFooter(ctx);
  return doc.save();
};

/** Build + trigger a browser download. */
export const downloadPriorAuthPdf = async (
  input: PriorAuthPdfInput,
  filename: string
): Promise<void> => {
  const bytes = await buildPriorAuthPdf(input);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
