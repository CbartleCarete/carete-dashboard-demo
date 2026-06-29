// One-off: pull page 1 (the actual ECM/CS invoice claim form) out of the
// combined source PDF and save it as the clean Health Net template asset.
import { PDFDocument } from "pdf-lib";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SRC = process.argv[2];
const OUT = "public/forms/healthnet-calaim-invoice.pdf";

const src = await PDFDocument.load(readFileSync(SRC));
const out = await PDFDocument.create();
const [page] = await out.copyPages(src, [0]);
out.addPage(page);

const p = out.getPage(0);
console.log(`Template page size: ${p.getWidth()} x ${p.getHeight()} pt`);

mkdirSync("public/forms", { recursive: true });
writeFileSync(OUT, await out.save());
console.log(`Wrote ${OUT}`);
