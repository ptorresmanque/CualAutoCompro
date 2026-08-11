import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("Auth endpoints", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("POST /auth/register crea usuario y setea cookie auth", async () => {
    const res = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "pat" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("pat" + "@" + "test.cl");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^auth=/);
  });

  // Con `Domain=localhost` Safari descarta la cookie (localhost no es un
  // dominio registrable) y la sesión se pierde entera: el login responde 200 y
  // el front entra, pero cada request posterior vuelve 401. Host-only alcanza,
  // porque el puerto no forma parte del ámbito de una cookie.
  it("la cookie auth no lleva Domain", async () => {
    const res = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "pat" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    expect(res.headers["set-cookie"]![0]).not.toMatch(/Domain=/i);
  });

  it("POST /auth/login con credenciales válidas retorna usuario + cookie", async () => {
    await request(createApp()).post("/api/v1/auth/register").send({ email: "pat" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    const res = await request(createApp()).post("/api/v1/auth/login").send({ email: "pat" + "@" + "test.cl", password: "secreto123" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("pat" + "@" + "test.cl");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^auth=/);
  });

  it("POST /auth/login con password incorrecto retorna 401 UNAUTHORIZED", async () => {
    await request(createApp()).post("/api/v1/auth/register").send({ email: "pat" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    const res = await request(createApp()).post("/api/v1/auth/login").send({ email: "pat" + "@" + "test.cl", password: "mala" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  // `GET /auth/me` es el sondeo con el que el front decide si hay sesión, y lo
  // corre en cada arranque. Si respondiera 401, el navegador escribiría un
  // error en la consola en toda visita anónima (la pantalla de login incluida)
  // por algo que no es una falla. "No hay nadie" es una respuesta válida.
  it("GET /auth/me sin cookie retorna 200 con data null", async () => {
    const res = await request(createApp()).get("/api/v1/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(res.body.error).toBeNull();
  });

  it("GET /auth/me con cookie inválida retorna 200 con data null", async () => {
    const res = await request(createApp()).get("/api/v1/auth/me").set("Cookie", "auth=no-es-un-jwt");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("GET /auth/me con sesión válida retorna el usuario", async () => {
    const login = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "pat" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    const cookie = login.headers["set-cookie"]!;
    const res = await request(createApp()).get("/api/v1/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("pat" + "@" + "test.cl");
  });
});
