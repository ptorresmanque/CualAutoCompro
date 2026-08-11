import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

/**
 * Garantia: el script `dev` tiene que fijar NODE_ENV=development.
 *
 * Importar @prisma/client carga por su cuenta el `.env` que vive junto al
 * schema. Cuando ese archivo es la copia local de la config del deploy trae
 * `NODE_ENV=production`, y como dotenv corre antes de que se evaluen los
 * modulos que leen `process.env.NODE_ENV`, el server de desarrollo arranca en
 * modo produccion sin que nadie lo pida.
 *
 * El sintoma concreto que motivo este test: las cookies salian con `Secure`
 * sobre http://localhost. Chrome las acepta (excepcion de secure-context para
 * localhost), Safari no: descartaba la cookie de sesion, el login respondia
 * 200, el front entraba al panel con el usuario en memoria y despues todas las
 * llamadas volvian 401. Solo en Safari.
 *
 * Fijar la variable en el script alcanza porque dotenv no pisa lo que ya esta
 * en process.env.
 */
describe("script dev", () => {
  it("fija NODE_ENV=development para que el .env del deploy no lo cambie", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(backendRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(pkg.scripts.dev).toMatch(/\bNODE_ENV=development\b/);
  });
});

/**
 * Segunda mitad de la misma garantia: aunque el script fije la variable, basta
 * un `process.env.NODE_ENV` suelto en un modulo que se evalue despues de
 * @prisma/client para volver al bug. `config/env.ts` valida la variable antes
 * de que eso pase y expone `isProduction`; el resto del backend consume ese
 * flag y nunca `process.env`.
 */
describe("lectura de NODE_ENV", () => {
  it("solo config/env.ts lee process.env.NODE_ENV", () => {
    let salida = "";
    try {
      salida = execFileSync(
        "grep",
        ["-rln", "process\\.env\\.NODE_ENV", "src"],
        { cwd: backendRoot, encoding: "utf8" },
      );
    } catch {
      // grep sale con 1 cuando no hay coincidencias.
    }
    const archivos = salida.split("\n").filter(Boolean).sort();

    expect(archivos).toEqual(["src/config/env.ts"]);
  });
});
