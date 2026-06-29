// Deterministic claim-invoice PDF fill engine.
//
// Takes a member + their selected claim lines + org identity + a payer's
// coordinate map, overlays the values onto the payer's flat PDF template, and
// returns the filled bytes. No AI, no network beyond fetching the static
// template — every value is placed at a mapped coordinate, so output is
// byte-reproducible for a given input.

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { FieldPos, PayerForm } from "../data/payers";
import {
  effectiveRendering,
  type OrgSettings,
  type ProviderIdentity,
} from "../data/orgSettings";
import { splitName, type Member } from "../utils/membersUtils";
import type { Claim } from "../data/claimsStore";

export interface InvoiceMeta {
  invoiceNumber: string;
  invoiceDate: string; // display string, e.g. 05-15-2026
  authorizationId?: string;
  controlNumber?: string;
  originalClaimId?: string;
  /** ICD-10 codes for diagnosis slots A.. (max 10). */
  diagnosisCodes: string[];
}

export interface BuildInvoiceInput {
  payer: PayerForm;
  org: OrgSettings;
  member: Member;
  /** Claim lines for this member, already filtered. Truncated to payer max. */
  claims: Claim[];
  meta: InvoiceMeta;
}

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Draw text at a top-origin FieldPos, shrinking to fit maxWidth. */
const drawAt = (
  page: import("pdf-lib").PDFPage,
  font: PDFFont,
  pageHeight: number,
  pos: FieldPos,
  value: string | number | undefined | null
) => {
  if (value === undefined || value === null || value === "") return;
  let text = String(value);
  let size = pos.size ?? 8;

  if (pos.maxWidth) {
    while (size > 4 && font.widthOfTextAtSize(text, size) > pos.maxWidth) {
      size -= 0.5;
    }
    // still too wide at min size → truncate with ellipsis
    while (text.length > 1 && font.widthOfTextAtSize(text, size) > pos.maxWidth) {
      text = text.slice(0, -2) + "…";
    }
  }

  page.drawText(text, {
    x: pos.x,
    y: pageHeight - pos.y, // top-origin → pdf-lib bottom-origin
    size,
    font,
    color: rgb(0.03, 0.05, 0.12),
  });
};

const fillProvider = (
  draw: (pos: FieldPos, v: unknown) => void,
  map: Record<string, FieldPos>,
  p: ProviderIdentity
) => {
  draw(map.npi, p.npi);
  draw(map.tin, p.tin);
  draw(map.orgName, p.orgName);
  draw(map.firstName, p.firstName);
  draw(map.address, p.address);
  draw(map.city, p.city);
  draw(map.zip, p.zip);
  draw(map.phone, p.phone);
};

export const buildInvoicePdf = async ({
  payer,
  org,
  member,
  claims,
  meta,
}: BuildInvoiceInput): Promise<Uint8Array> => {
  const res = await fetch(payer.templateUrl);
  if (!res.ok) throw new Error(`Could not load template: ${payer.templateUrl}`);
  const doc = await PDFDocument.load(await res.arrayBuffer());
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.getPage(0);
  const H = payer.pageHeight;

  // Cover preprinted placeholders (e.g. "$ 0.00") before writing real values.
  for (const m of payer.masks ?? []) {
    page.drawRectangle({
      x: m.x,
      y: H - m.y - m.h,
      width: m.w,
      height: m.h,
      color: rgb(1, 1, 1),
    });
  }

  const draw = (pos: FieldPos | undefined, v: unknown) => {
    if (pos) drawAt(page, font, H, pos, v as string);
  };

  // Section 1a/1b — provider identity
  fillProvider(draw, payer.fields.billing, org.billing);
  fillProvider(draw, payer.fields.rendering, effectiveRendering(org));

  // Section 2 — member
  const { first, last } = splitName(member.name);
  draw(payer.fields.member.cin, member.cin);
  draw(payer.fields.member.homeless, member.homeless ? "1" : "");
  draw(payer.fields.member.last, last);
  draw(payer.fields.member.first, first);
  draw(payer.fields.member.dob, member.dob);
  draw(payer.fields.member.address, member.address);
  draw(payer.fields.member.city, member.city);
  draw(payer.fields.member.zip, member.zip);

  // Section 3 — payor + diagnoses
  draw(payer.fields.billingInfo.payorPrimaryId, org.payorPrimaryIds[payer.id]);
  draw(payer.fields.billingInfo.payorName, payer.payorName);
  meta.diagnosisCodes
    .slice(0, payer.diagnosisSlots.length)
    .forEach((code, i) => draw(payer.diagnosisSlots[i], code));

  // Section 3 — service lines
  const lines = claims.slice(0, payer.maxServiceRows);
  let invoiceTotal = 0;
  const { rowYs, cols } = payer.serviceRows;
  const hasDx = meta.diagnosisCodes.length > 0;

  lines.forEach((c, i) => {
    const y = rowYs[i];
    const at = (col: Omit<FieldPos, "y">, v: unknown) => draw({ ...col, y }, v);
    const charge = c.chargeAmount ?? 0;
    const units = c.units || 1;
    invoiceTotal += charge;

    at(cols.startDate, c.serviceStartDate || c.serviceDate);
    at(cols.endDate, c.serviceEndDate || c.serviceDate);
    at(cols.placeOfService, c.placeOfService);
    at(cols.serviceName, c.service);
    at(cols.procedure, c.hcpcsCode);
    at(cols.modifiers, c.modifiers.join(" "));
    at(cols.diagPointer, hasDx ? "A" : "");
    at(cols.count, units);
    at(cols.cost, charge ? money(charge / units) : "");
    at(cols.charge, charge ? money(charge) : "");
  });

  // Section 4 — administrative
  const a = payer.fields.admin;
  draw(a.invoiceTotal, invoiceTotal ? `$ ${money(invoiceTotal)}` : "");
  draw(a.invoiceDate, meta.invoiceDate);
  draw(a.invoiceNumber, meta.invoiceNumber);
  draw(a.controlNumber, meta.controlNumber);
  draw(a.authorizationId, meta.authorizationId);
  draw(a.originalClaimId, meta.originalClaimId);
  draw(a.signedDate, meta.invoiceDate);

  return doc.save();
};

/** Build + trigger a browser download. */
export const downloadInvoicePdf = async (
  input: BuildInvoiceInput,
  filename?: string
): Promise<void> => {
  const bytes = await buildInvoicePdf(input);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ??
    `${input.payer.id}-invoice-${input.member.id}-${input.meta.invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
