import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv.js";

describe("toCsv", () => {
  it("serializes a simple header + rows with CRLF line endings", () => {
    const csv = toCsv(
      ["id", "name"],
      [
        ["1", "Toyota"],
        ["2", "Mazda"],
      ],
    );
    expect(csv).toBe("id,name\r\n1,Toyota\r\n2,Mazda\r\n");
  });

  it("quotes values containing commas, quotes, or newlines", () => {
    const csv = toCsv(
      ["a", "b"],
      [
        ["x,y", 'he said "hi"'],
        ["line1\nline2", "plain"],
      ],
    );
    expect(csv).toBe(
      'a,b\r\n"x,y","he said ""hi"""\r\n"line1\nline2",plain\r\n',
    );
  });

  it("renders numbers, booleans, null, undefined, and Dates as strings", () => {
    const csv = toCsv(
      ["n", "b", "nul", "u", "d"],
      [[42, true, null, undefined, new Date("2026-01-15T10:00:00.000Z")]],
    );
    expect(csv).toBe(
      "n,b,nul,u,d\r\n42,true,,,2026-01-15T10:00:00.000Z\r\n",
    );
  });
});

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(parseCsv("a,b,c\r\n1,2,3\r\n4,5,6")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("handles quoted cells with embedded commas", () => {
    expect(parseCsv('a,b\r\n"x,y",z')).toEqual([
      ["a", "b"],
      ["x,y", "z"],
    ]);
  });

  it("decodes escaped double-quotes inside quoted cells", () => {
    expect(parseCsv('a\r\n"he said ""hi"""')).toEqual([
      ["a"],
      ['he said "hi"'],
    ]);
  });

  it("supports LF and CRLF line endings", () => {
    expect(parseCsv("a,b\n1,2\r\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("roundtrips with toCsv for non-trivial values", () => {
    const csv = toCsv(
      ["name", "note"],
      [
        ["Toyota, Inc.", 'has "double" quotes'],
        ["multi\nline", "ok"],
      ],
    );
    expect(parseCsv(csv)).toEqual([
      ["name", "note"],
      ["Toyota, Inc.", 'has "double" quotes'],
      ["multi\nline", "ok"],
    ]);
  });
});
