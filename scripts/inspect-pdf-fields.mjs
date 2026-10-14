// One-off: dump AcroForm field names/types from a PDF so we can build a field map.
// Usage: node scripts/inspect-pdf-fields.mjs "<path-to-pdf>"
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("Pass a PDF path.");
  process.exit(1);
}

const doc = await PDFDocument.load(readFileSync(path));
console.log(`Pages: ${doc.getPageCount()}`);

const form = doc.getForm();
const fields = form.getFields();
console.log(`AcroForm fields: ${fields.length}\n`);

for (const f of fields) {
  const type = f.constructor.name;
  let extra = "";
  if (type === "PDFDropdown" || type === "PDFOptionList") {
    try {
      extra = ` options=[${f.getOptions().slice(0, 6).join(" | ")}${
        f.getOptions().length > 6 ? " …" : ""
      }]`;
    } catch {
      /* ignore */
    }
  }
  console.log(`${type.padEnd(16)} ${JSON.stringify(f.getName())}${extra}`);
}
