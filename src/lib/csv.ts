// Minimal CSV builder + browser download. No library needed for this —
// just header row + data rows, properly quoted/escaped.

const escapeCsvValue = (value: string | number | undefined | null): string => {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const buildCsv = (
  headers: string[],
  rows: (string | number | undefined | null)[][]
): string => {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvValue).join(",")
  );
  // Leading BOM so Excel opens UTF-8 CSVs without mangling special chars.
  return "﻿" + lines.join("\r\n");
};

export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
): void => {
  const csv = buildCsv(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
