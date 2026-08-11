import type { PrismaClient } from "@prisma/client";

/**
 * El `year` de una versión no es un dato del auto: es el año que va a quedar
 * en el padrón de un 0km comprado hoy. Como el catálogo es solo 0km, ese año
 * es el mismo para todas las versiones y sale del calendario, no del alta.
 *
 * En Chile no hay norma que fije la fecha de corte: es una convención
 * comercial del sector, cuyo año va de septiembre a agosto (los 0km de
 * septiembre ya se facturan con el año siguiente). Cada marca puede
 * adelantarse o atrasarse unas semanas; si hace falta correr el corte —a
 * mediados de septiembre, por ejemplo— se cambia acá y nada más.
 */
export const MODEL_YEAR_ROLLOVER = { month: 9, day: 1 };

export function currentModelYear(now: Date = new Date()): number {
  const month = now.getMonth() + 1;
  const rolled =
    month > MODEL_YEAR_ROLLOVER.month ||
    (month === MODEL_YEAR_ROLLOVER.month && now.getDate() >= MODEL_YEAR_ROLLOVER.day);
  return now.getFullYear() + (rolled ? 1 : 0);
}

/**
 * Deja todas las versiones vivas con el año vigente. Se llama al arrancar y
 * una vez al día (ver `index.ts`) porque el valor caduca con el calendario:
 * sin esto, en septiembre el catálogo entero quedaría un año atrás hasta el
 * próximo deploy.
 */
export async function syncModelYear(prisma: PrismaClient): Promise<number> {
  const year = currentModelYear();
  const { count } = await prisma.version.updateMany({
    where: { year: { not: year } },
    data: { year },
  });
  return count;
}
