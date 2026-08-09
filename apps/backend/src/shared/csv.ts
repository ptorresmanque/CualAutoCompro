import type { Response } from "express";

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
 * Responde una descarga CSV. Los 8 `exportCsv` del admin tenían estas tres
 * líneas copiadas; lo único que cambia entre ellos son el nombre del archivo,
 * los headers y las filas.
 */
export const sendCsv = (
  res: Response,
  filename: string,
  headers: string[],
  rows: CsvCell[][],
): void => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, rows));
};

