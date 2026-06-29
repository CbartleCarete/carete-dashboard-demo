// Calibration harness: fills the template with obvious sample data using the
// SAME coordinate logic as src/lib/claimPdf.ts so we can eyeball alignment.
// Reads the field map straight out of src/data/payers.ts via a tiny strip.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFileSync, writeFileSync } from "node:fs";

// Pull the healthNet object literal out of payers.ts (it's plain data).
const srcTs = readFileSync("src/data/payers.ts", "utf8");
const body = srcTs.slice(
  srcTs.indexOf("const healthNet: PayerForm = {") + "const healthNet: PayerForm = ".length,
  srcTs.indexOf("export const payers")
);
const objText = body.slice(0, body.lastIndexOf("};") + 1);
// strip TS-only bits → valid JS object
const payer = eval("(" + objText + ")");

const doc = await PDFDocument.load(readFileSync(payer.templateUrl.replace(/^\//, "public/")));
const font = await doc.embedFont(StandardFonts.Helvetica);
const page = doc.getPage(0);
const H = payer.pageHeight;

for (const m of payer.masks ?? [])
  page.drawRectangle({ x: m.x, y: H - m.y - m.h, width: m.w, height: m.h, color: rgb(1, 1, 1) });

const draw = (pos, v) => {
  if (!pos || v === "" || v == null) return;
  let text = String(v);
  let size = pos.size ?? 8;
  if (pos.maxWidth) {
    while (size > 4 && font.widthOfTextAtSize(text, size) > pos.maxWidth) size -= 0.5;
    while (text.length > 1 && font.widthOfTextAtSize(text, size) > pos.maxWidth)
      text = text.slice(0, -2) + "…";
  }
  page.drawText(text, { x: pos.x, y: H - pos.y, size, font, color: rgb(0.85, 0, 0) });
};

const fillP = (m, p) => {
  draw(m.npi, p.npi); draw(m.tin, p.tin); draw(m.orgName, p.orgName);
  draw(m.firstName, p.firstName); draw(m.address, p.address);
  draw(m.city, p.city); draw(m.zip, p.zip); draw(m.phone, p.phone);
};

const sampleProv = {
  npi: "1234567890", tin: "94-1234567", orgName: "Carete Health Services",
  firstName: "", address: "123 Wellness Blvd", city: "Fresno", zip: "93721",
  phone: "(559) 555-0142",
};
fillP(payer.fields.billing, sampleProv);
fillP(payer.fields.rendering, sampleProv);

const M = payer.fields.member;
draw(M.cin, "98765432A"); draw(M.homeless, "1");
draw(M.last, "Garcia"); draw(M.first, "Maria");
draw(M.dob, "04-12-1979"); draw(M.address, "456 Hope St Apt 2");
draw(M.city, "Fresno"); draw(M.zip, "93706");

draw(payer.fields.billingInfo.payorPrimaryId, "PPID-00042");
draw(payer.fields.billingInfo.payorName, payer.payorName);
["E119", "Z591", "F329"].forEach((c, i) => draw(payer.diagnosisSlots[i], c));

const rows = [
  ["09-01-2025", "09-01-2025", "12", "Housing Transition / Navigation — Supported housing", "H0043", "U6", "A", "3", "75.00", "225.00"],
  ["09-15-2025", "09-15-2025", "12", "ECM — Care Management — Clinical in person", "G9008", "U1", "A", "1", "210.00", "210.00"],
];
const { rowYs, cols } = payer.serviceRows;
rows.forEach((r, i) => {
  const y = rowYs[i];
  const at = (c, v) => draw({ ...c, y }, v);
  at(cols.startDate, r[0]); at(cols.endDate, r[1]); at(cols.placeOfService, r[2]);
  at(cols.serviceName, r[3]); at(cols.procedure, r[4]); at(cols.modifiers, r[5]);
  at(cols.diagPointer, r[6]); at(cols.count, r[7]); at(cols.cost, r[8]); at(cols.charge, r[9]);
});

const A = payer.fields.admin;
draw(A.invoiceTotal, "$ 435.00");
draw(A.invoiceDate, "05-15-2026"); draw(A.invoiceNumber, "INV-2026-0007");
draw(A.authorizationId, "AUTH-555"); draw(A.signedDate, "05-15-2026");

writeFileSync("/tmp/calibrate.pdf", await doc.save());
console.log("Wrote /tmp/calibrate.pdf");
