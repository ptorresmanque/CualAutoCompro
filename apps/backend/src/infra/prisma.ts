// El import de la config va PRIMERO a propósito: carga el .env que
// corresponde al entorno antes de que @prisma/client cargue por su cuenta el
// `.env` del deploy, que en local no debe influir.
import { isProduction } from "../config/env.js";
import { PrismaClient } from "@prisma/client";

export const prisma = globalThis.__prisma ?? new PrismaClient();
if (!isProduction) {
  globalThis.__prisma = prisma;
}
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}