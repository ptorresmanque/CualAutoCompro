/**
 * Tiny RFC-4180-ish CSV utility: header + rows, quoting values containing
 * commas, quotes, or newlines; CRLF line endings.
 */

export type CsvCell = string | number | boolean | null | undefined | Date;

const escapeCell = (cell: CsvCell): string => {
  if (cell === null || cell === undefined) return "";
  const value = cell instanceof Date ? cell.toISOString() : String(cell);
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const toCsv = (headers: string[], rows: CsvCell[][]): string => {
  const lines: string[] = [];
  lines.push(headers.map(escapeCell).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return lines.join("\r\n") + "\r\n";
};

