import { z } from "zod";
import { ENUM_REGEX } from "./models.dto.admin.js";

export const listModelsQuerySchema = z.object({
  q: z.string().optional(),
  brand: z.string().optional(),
  // segment/transmission/fuel no son `z.enum` de los canónicos: el admin
  // permite dar de alta valores nuevos ("Otro"), y con un enum cerrado filtrar
  // por uno de ellos devolvía 400 y rompía el catálogo. Validamos la forma del
  // token (`ENUM_REGEX`), no la pertenencia a una lista fija. Las opciones
  // reales salen de GET /models/segments, /versions/fuels y
  // /versions/transmissions.
  segment: z.string().max(40).regex(ENUM_REGEX).optional(),
  transmission: z.string().max(40).regex(ENUM_REGEX).optional(),
  fuel: z.string().max(40).regex(ENUM_REGEX).optional(),
  priceMin: z.coerce.number().int().optional(),
  priceMax: z.coerce.number().int().optional(),
  powerMin: z.coerce.number().int().optional(),
  consumptionMax: z.coerce.number().optional(),
  consumptionHighwayMax: z.coerce.number().optional(),
  sort: z.enum(["name", "minPrice", "minConsumption"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});