import { describe, expect, it } from "vitest";
import { imageUrl, imageUrlArray } from "./image-url.js";

describe("imageUrl", () => {
  it("acepta URL absoluta con protocolo http", () => {
    expect(imageUrl.safeParse("http://localhost:3000/uploads/x.png").success).toBe(true);
    expect(imageUrl.safeParse("https://cdn.example.com/x.png").success).toBe(true);
  });

  it("acepta URL relativa /uploads/", () => {
    expect(imageUrl.safeParse("/uploads/2026-07/abc.png").success).toBe(true);
    expect(imageUrl.safeParse("/uploads/x.jpg").success).toBe(true);
  });

  it("rechaza string vacío", () => {
    expect(imageUrl.safeParse("").success).toBe(false);
  });

  it("rechaza URL malformada", () => {
    expect(imageUrl.safeParse("not a url").success).toBe(false);
    expect(imageUrl.safeParse("/some/other/path.png").success).toBe(false);
  });

  it("rechaza relative URL que no es /uploads/", () => {
    expect(imageUrl.safeParse("./local.png").success).toBe(false);
    expect(imageUrl.safeParse("../escape.png").success).toBe(false);
  });
});

describe("imageUrlArray", () => {
  it("acepta array vacío", () => {
    expect(imageUrlArray.safeParse([]).success).toBe(true);
  });

  it("acepta mix de absolutas y relativas /uploads/", () => {
    const r = imageUrlArray.safeParse([
      "/uploads/2026-07/abc.png",
      "https://cdn.example.com/x.jpg",
    ]);
    expect(r.success).toBe(true);
  });

  it("rechaza si algún elemento es inválido", () => {
    const r = imageUrlArray.safeParse(["/uploads/a.png", "bad"]);
    expect(r.success).toBe(false);
  });
});
