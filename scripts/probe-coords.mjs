// One-off: dump every text run on the template with its PDF-space x/y (origin
// bottom-left, matching pdf-lib). Used to anchor the field map to label text.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync } from "node:fs";

const PDF = "public/forms/healthnet-calaim-invoice.pdf";
const data = new Uint8Array(readFileSync(PDF));
const doc = await getDocument({ data }).promise;
const page = await doc.getPage(1);
const vp = page.getViewport({ scale: 1 });
const content = await page.getTextContent();

const rows = content.items
  .filter((i) => i.str.trim())
  .map((i) => ({
    str: i.str.trim(),
    x: Math.round(i.transform[4]),
    // convert top-left text origin to pdf-lib bottom-left
    y: Math.round(vp.height - i.transform[5]),
  }))
  .sort((a, b) => a.y - b.y || a.x - b.x);

for (const r of rows) console.log(`y=${String(r.y).padStart(3)} x=${String(r.x).padStart(3)}  ${r.str}`);
