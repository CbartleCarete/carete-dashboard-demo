// Generic tabular report PDF — the same drawn-from-scratch approach as
// priorAuthPdf.ts, but shaped for the Reports tab: a title + summary
// stat line, then a paginated table. One builder, reused for every
// report in Reports.tsx instead of writing a one-off layout per report.

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export interface ReportPdfStat {
  label: string;
  value: string;
}

export interface ReportPdfColumn {
  header: string;
  /** Column width in points. Widths should sum to roughly the content
   *  width (512pt on a US Letter page with 50pt margins). */
  width: number;
}

export interface ReportPdfInput {
  title: string;
  subtitle?: string;
  generatedOn: string;
  stats?: ReportPdfStat[];
  columns: ReportPdfColumn[];
  rows: string[][];
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
const ROW_RULE = rgb(0.93, 0.94, 0.96);

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
  pageNum: number;
  columns: ReportPdfColumn[];
}

const wrapText = (
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] => {
  const words = String(text).split(/\s+/).filter(Boolean);
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

const drawFooter = (ctx: Ctx, title: string) => {
  ctx.page.drawText(`Carete · ${title} · Page ${ctx.pageNum}`, {
    x: MARGIN_X,
    y: 28,
    size: 7.5,
    font: ctx.font,
    color: MUTED,
  });
};

const columnX = (ctx: Ctx, index: number): number => {
  let x = MARGIN_X;
  for (let i = 0; i < index; i++) x += ctx.columns[i].width;
  return x;
};

const drawTableHeader = (ctx: Ctx) => {
  ctx.y -= 4;
  const headerY = ctx.y;
  ctx.columns.forEach((col, i) => {
    ctx.page.drawText(col.header, {
      x: columnX(ctx, i),
      y: headerY,
      size: 8.5,
      font: ctx.bold,
      color: MUTED,
    });
  });
  ctx.y -= 12;
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: ctx.y },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: ctx.y },
    thickness: 0.75,
    color: RULE,
  });
  ctx.y -= 10;
};

const newPage = (ctx: Ctx, title: string) => {
  drawFooter(ctx, title);
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.pageNum += 1;
  ctx.y = PAGE_HEIGHT - MARGIN_TOP;
  drawTableHeader(ctx);
};

const drawRow = (ctx: Ctx, cells: string[], title: string) => {
  const size = 8.5;
  const lineGap = 3;
  const wrapped = cells.map((cell, i) =>
    wrapText(cell ?? "", ctx.font, size, ctx.columns[i].width - 6)
  );
  const lineCount = Math.max(1, ...wrapped.map((lines) => lines.length));
  const rowHeight = lineCount * (size + lineGap) + 6;

  if (ctx.y - rowHeight < MARGIN_BOTTOM) {
    newPage(ctx, title);
  }

  const topY = ctx.y;
  wrapped.forEach((lines, i) => {
    lines.forEach((line, li) => {
      ctx.page.drawText(line, {
        x: columnX(ctx, i),
        y: topY - li * (size + lineGap),
        size,
        font: ctx.font,
        color: INK,
      });
    });
  });

  ctx.y = topY - lineCount * (size + lineGap) - 2;
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: ctx.y },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: ctx.y },
    thickness: 0.5,
    color: ROW_RULE,
  });
  ctx.y -= 8;
};

export const buildReportPdf = async (
  input: ReportPdfInput
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
    columns: input.columns,
  };

  ctx.page.drawText("Carete", {
    x: MARGIN_X,
    y: ctx.y,
    size: 18,
    font: bold,
    color: BRAND,
  });
  ctx.page.drawText(input.title, {
    x: MARGIN_X,
    y: ctx.y - 20,
    size: 11,
    font,
    color: MUTED,
  });

  const metaLines = [`Generated: ${input.generatedOn}`];
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

  if (input.subtitle) {
    const lines = wrapText(input.subtitle, font, 9.5, CONTENT_WIDTH);
    lines.forEach((line) => {
      ctx.page.drawText(line, {
        x: MARGIN_X,
        y: ctx.y,
        size: 9.5,
        font,
        color: MUTED,
      });
      ctx.y -= 13;
    });
    ctx.y -= 2;
  }

  if (input.stats?.length) {
    const slotWidth = CONTENT_WIDTH / input.stats.length;
    const statsTop = ctx.y;
    input.stats.forEach((stat, i) => {
      const x = MARGIN_X + i * slotWidth;
      ctx.page.drawText(stat.label, {
        x,
        y: statsTop,
        size: 8,
        font,
        color: MUTED,
      });
      ctx.page.drawText(stat.value, {
        x,
        y: statsTop - 16,
        size: 14,
        font: bold,
        color: INK,
      });
    });
    ctx.y = statsTop - 34;
    ctx.page.drawLine({
      start: { x: MARGIN_X, y: ctx.y },
      end: { x: MARGIN_X + CONTENT_WIDTH, y: ctx.y },
      thickness: 0.75,
      color: RULE,
    });
    ctx.y -= 14;
  }

  drawTableHeader(ctx);
  for (const row of input.rows) {
    drawRow(ctx, row, input.title);
  }

  if (input.rows.length === 0) {
    ctx.page.drawText("No records for this period.", {
      x: MARGIN_X,
      y: ctx.y,
      size: 9.5,
      font,
      color: MUTED,
    });
  }

  drawFooter(ctx, input.title);
  return doc.save();
};

/** Build + trigger a browser download. */
export const downloadReportPdf = async (
  input: ReportPdfInput,
  filename: string
): Promise<void> => {
  const bytes = await buildReportPdf(input);
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
