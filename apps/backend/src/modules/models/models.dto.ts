import { z } from "zod";
import { ENUM_REGEX } from "./models.dto.admin.js";

/**
 * Lista de tokens separados por coma: `SUV` o `SUV,CROSSOVER`.
 *
 * Acepta un solo valor (la forma histórica del param, así que los links viejos
 * y el admin siguen funcionando) y devuelve siempre un array para que el
 * service no tenga que distinguir los dos casos. Cada token se valida con
 * `ENUM_REGEX` — y no contra una lista cerrada — porque el admin puede dar de
 * alta valores nuevos con la opción "Otro".
 */
const enumTokenList = z
  .string()
  .max(400)
  .transform((raw) => raw.split(",").map((t) => t.trim()).filter(Boolean))
  .refine((tokens) => tokens.length > 0, { message: "lista vacía" })
  .refine((tokens) => tokens.every((t) => t.length <= 40 && ENUM_REGEX.test(t)), {
    message: "token inválido",
  });

export const listModelsQuerySchema = z.object({
  q: z.string().optional(),
  brand: z.string().optional(),
  // Multi-selección: el catálogo manda `segment=SUV,CROSSOVER` cuando el
  // usuario marca más de una opción. Ver `enumTokenList`.
  segment: enumTokenList.optional(),
  transmission: enumTokenList.optional(),
  fuel: enumTokenList.optional(),
  priceMin: z.coerce.number().int().optional(),
  priceMax: z.coerce.number().int().optional(),
  powerMin: z.coerce.number().int().optional(),
  // OJO con la semántica: `consumptionCityKmL` está en km/L, donde MÁS es
  // MEJOR. Los filtros `*Max` (lte) existen desde el principio y se mantienen
  // por compatibilidad, pero expresan "gasta al menos tanto", que es lo
  // contrario de lo que pide un usuario que busca un auto eficiente: pedir
  // "consumptionMax=15" descarta un auto de 18 km/L.
  // Los `*Min` (gte) son los que corresponden a "rendimiento mínimo".
  consumptionMax: z.coerce.number().optional(),
  consumptionHighwayMax: z.coerce.number().optional(),
  consumptionMinKmL: z.coerce.number().optional(),
  consumptionHighwayMinKmL: z.coerce.number().optional(),
  // `minConsumption` ordena por el peor rendimiento del modelo (Math.min de los
  // km/L) y quedó por compatibilidad. `efficiency` ordena por el mejor
  // (Math.max), que es lo que la UI llama "Rendimiento".
  sort: z.enum(["name", "minPrice", "minConsumption", "efficiency"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});