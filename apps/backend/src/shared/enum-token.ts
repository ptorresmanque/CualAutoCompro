import { badRequest } from "./errors.js";

/**
 * Formato de los "enums abiertos" (Segment, Fuel, Transmission): tokens que el
 * admin puede dar de alta desde la opción "Otro" del formulario.
 *
 * Fuente única: los DTO lo usan como `.regex()` y los services como guard.
 */
export const ENUM_TOKEN_REGEX = /^[A-Z0-9_]+$/;

/**
 * Guard de último recurso para quien llame al service sin pasar por el DTO.
 *
 * La barrera de verdad es el `.regex(ENUM_TOKEN_REGEX)` de los schemas zod, que
 * corre en el borde HTTP y devuelve un 400 con el campo señalado. Esto cubre el
 * otro camino: `ModelsService.create()` y `VersionsService.create()` escriben
 * con `$executeRawUnsafe` porque Prisma rechaza cualquier token fuera del enum
 * generado, y no queremos que un caller interno meta basura en esa columna.
 *
 * (El SQL usa placeholders `?`, así que esto no es lo que frena una inyección;
 * es lo que evita un token corrupto en la DB.)
 */
export function assertEnumToken(field: string, value: string): void {
  if (!ENUM_TOKEN_REGEX.test(value)) {
    throw badRequest(`Valor inválido para ${field}: ${value}`);
  }
}
