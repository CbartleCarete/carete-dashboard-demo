// Payer registry. Each payer points at a flat (non-fillable) PDF template plus
// a coordinate map telling the fill engine where each canonical value goes.
//
// Coordinates are TOP-ORIGIN (x from left, y from top of page) in PDF points,
// taken straight from scripts/probe-coords.mjs against the template. The fill
// engine converts y to pdf-lib's bottom-left origin. To add a new payer:
// run probe-coords on its template, then write its map the same way — no AI
// in the per-claim path, only in drafting this table once.

export interface FieldPos {
  x: number;
  y: number;
  /** font size, default 8 */
  size?: number;
  /** truncate/shrink to fit this width if set */
  maxWidth?: number;
}

export interface ServiceRowMap {
  /** baseline y (top-origin) for each of the up-to-6 service rows */
  rowYs: number[];
  /** x position + style per column; y comes from rowYs */
  cols: {
    startDate: Omit<FieldPos, "y">;
    endDate: Omit<FieldPos, "y">;
    placeOfService: Omit<FieldPos, "y">;
    serviceName: Omit<FieldPos, "y">;
    procedure: Omit<FieldPos, "y">;
    modifiers: Omit<FieldPos, "y">;
    diagPointer: Omit<FieldPos, "y">;
    count: Omit<FieldPos, "y">;
    cost: Omit<FieldPos, "y">;
    charge: Omit<FieldPos, "y">;
  };
}

export interface PayerForm {
  id: string;
  name: string;
  /** Short name written into the form's "Payor Name" box. */
  payorName: string;
  /** public/ asset path */
  templateUrl: string;
  pageWidth: number;
  pageHeight: number;
  submission: {
    mail?: string;
    email?: string;
    portal?: string;
    fax?: string;
  };
  /** Single-value fields keyed by canonical path. */
  fields: {
    billing: Record<string, FieldPos>;
    rendering: Record<string, FieldPos>;
    member: Record<string, FieldPos>;
    billingInfo: Record<string, FieldPos>;
    admin: Record<string, FieldPos>;
  };
  /** Diagnosis code slots A..J, in order. */
  diagnosisSlots: FieldPos[];
  serviceRows: ServiceRowMap;
  /** Max service lines per invoice page (form has 6). */
  maxServiceRows: number;
  /**
   * White-out boxes (top-origin) drawn before text — used to hide preprinted
   * placeholder values baked into the flat template (e.g. "$ 0.00").
   */
  masks?: { x: number; y: number; w: number; h: number }[];
}

const healthNet: PayerForm = {
  id: "healthnet",
  name: "Health Net / CalViva — CalAIM Invoice",
  payorName: "Health Net",
  templateUrl: "/forms/healthnet-calaim-invoice.pdf",
  pageWidth: 612,
  pageHeight: 792,
  submission: {
    mail: "Health Net – Cal AIM Invoice, PO Box 10439, Van Nuys, CA 91410-0439",
    email: "CalAIM_CS_invoicesubmission@centene.com",
    portal: "https://CalAim.portal.conduent.com/",
    fax: "(833) 386-1043",
  },
  fields: {
    billing: {
      npi: { x: 165, y: 217 },
      tin: { x: 455, y: 217 },
      orgName: { x: 170, y: 232, maxWidth: 420 },
      firstName: { x: 120, y: 247 },
      address: { x: 70, y: 263, maxWidth: 280 },
      city: { x: 395, y: 263 },
      zip: { x: 218, y: 277 },
      phone: { x: 445, y: 278 },
    },
    rendering: {
      npi: { x: 165, y: 310 },
      tin: { x: 455, y: 310 },
      orgName: { x: 170, y: 325, maxWidth: 420 },
      firstName: { x: 120, y: 340 },
      address: { x: 70, y: 356, maxWidth: 280 },
      city: { x: 395, y: 356 },
      zip: { x: 218, y: 371 },
      phone: { x: 445, y: 371 },
    },
    member: {
      cin: { x: 215, y: 403 },
      homeless: { x: 470, y: 403 },
      last: { x: 70, y: 418, maxWidth: 115 },
      first: { x: 240, y: 418, maxWidth: 120 },
      dob: { x: 490, y: 418 },
      address: { x: 115, y: 433, maxWidth: 460 },
      city: { x: 50, y: 447, maxWidth: 130 },
      zip: { x: 500, y: 449 },
    },
    billingInfo: {
      payorPrimaryId: { x: 110, y: 517 },
      payorName: { x: 365, y: 518, maxWidth: 230 },
    },
    admin: {
      invoiceDate: { x: 140, y: 711 },
      invoiceNumber: { x: 275, y: 711 },
      controlNumber: { x: 385, y: 711 },
      authorizationId: { x: 110, y: 726 },
      originalClaimId: { x: 460, y: 726 },
      signedDate: { x: 415, y: 757 },
      invoiceTotal: { x: 538, y: 678, size: 7 },
    },
  },
  diagnosisSlots: [
    { x: 115, y: 533, size: 6 },
    { x: 165, y: 533, size: 6 },
    { x: 215, y: 533, size: 6 },
    { x: 265, y: 533, size: 6 },
    { x: 315, y: 533, size: 6 },
    { x: 366, y: 533, size: 6 },
    { x: 416, y: 533, size: 6 },
    { x: 466, y: 533, size: 6 },
    { x: 516, y: 533, size: 6 },
    { x: 566, y: 533, size: 6 },
  ],
  serviceRows: {
    rowYs: [592, 606, 621, 636, 651, 665],
    cols: {
      startDate: { x: 38, size: 6 },
      endDate: { x: 96, size: 6 },
      placeOfService: { x: 150, size: 6 },
      serviceName: { x: 196, size: 5, maxWidth: 108 },
      procedure: { x: 311, size: 6 },
      modifiers: { x: 350, size: 5, maxWidth: 58 },
      diagPointer: { x: 421, size: 6 },
      count: { x: 447, size: 6 },
      cost: { x: 482, size: 6 },
      charge: { x: 536, size: 6 },
    },
  },
  maxServiceRows: 6,
  // Hide preprinted placeholders baked into the flat template: the per-row
  // "$ 0.00", "SelectPlac", "Select Service name", "SelectProc/Mod/Diag",
  // plus the admin "Select Submission Type" / "Select Yes/No".
  masks: [
    // Charge column "$ 0.00" (6 rows + Invoice Amount)
    { x: 555, y: 580, w: 52, h: 15 },
    { x: 555, y: 594, w: 52, h: 15 },
    { x: 555, y: 609, w: 52, h: 15 },
    { x: 555, y: 624, w: 52, h: 15 },
    { x: 555, y: 639, w: 52, h: 15 },
    { x: 555, y: 653, w: 52, h: 15 },
    { x: 555, y: 667, w: 52, h: 15 },
    // "SelectPlac" — place of service column
    { x: 146, y: 580, w: 47, h: 15 },
    { x: 146, y: 594, w: 47, h: 15 },
    { x: 146, y: 609, w: 47, h: 15 },
    { x: 146, y: 624, w: 47, h: 15 },
    { x: 146, y: 639, w: 47, h: 15 },
    { x: 146, y: 653, w: 47, h: 15 },
    // "Select Service name" — service name column
    { x: 194, y: 580, w: 114, h: 15 },
    { x: 194, y: 594, w: 114, h: 15 },
    { x: 194, y: 609, w: 114, h: 15 },
    { x: 194, y: 624, w: 114, h: 15 },
    { x: 194, y: 639, w: 114, h: 15 },
    { x: 194, y: 653, w: 114, h: 15 },
    // "SelectProc SelectMod SelectDiag" — procedure/modifier/diag cluster
    { x: 305, y: 580, w: 138, h: 15 },
    { x: 305, y: 594, w: 138, h: 15 },
    { x: 305, y: 609, w: 138, h: 15 },
    { x: 305, y: 624, w: 138, h: 15 },
    { x: 305, y: 639, w: 138, h: 15 },
    { x: 305, y: 653, w: 138, h: 15 },
    // Admin selects
    { x: 510, y: 705, w: 58, h: 12 }, // Attachments "Select Yes/No"
    { x: 279, y: 720, w: 98, h: 12 }, // "Select Submission Type"
  ],
};

export const payers: PayerForm[] = [healthNet];

export const getPayer = (id: string): PayerForm | undefined =>
  payers.find((p) => p.id === id);
