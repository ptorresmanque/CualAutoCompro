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

/**
 * Parse a CSV string into rows of cells. Handles quoted values with embedded
 * commas, escaped double-quotes (`""`), and CRLF/LF line endings.
 */
export const parseCsv = (input: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      // swallow; consumed by \n
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  // Push trailing cell/row if non-empty
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};
