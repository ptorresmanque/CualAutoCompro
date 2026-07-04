import { describe, expect, it } from "vitest";
import { toGalleryUrls } from "./json.js";

describe("toGalleryUrls", () => {
  it("devuelve [] para null", () => {
    expect(toGalleryUrls(null)).toEqual([]);
  });

  it("devuelve [] para undefined", () => {
    expect(toGalleryUrls(undefined)).toEqual([]);
  });

  it("parsea string JSON con array de strings", () => {
    expect(toGalleryUrls('["a","b"]')).toEqual(["a", "b"]);
  });

  it("devuelve [] para string JSON inválido", () => {
    expect(toGalleryUrls("no es json")).toEqual([]);
  });

  it("devuelve [] para JSON que no es array", () => {
    expect(toGalleryUrls('{"foo":"bar"}')).toEqual([]);
  });

  it("filtra elementos no-string del array", () => {
    expect(toGalleryUrls(["a", 1, null, "b"])).toEqual(["a", "b"]);
  });

  it("devuelve array tal cual si ya es array", () => {
    expect(toGalleryUrls(["x", "y"])).toEqual(["x", "y"]);
  });

  it("devuelve [] para string plano sin JSON", () => {
    expect(toGalleryUrls("plain-string")).toEqual([]);
  });

  it("devuelve [] para número", () => {
    expect(toGalleryUrls(42)).toEqual([]);
  });
});