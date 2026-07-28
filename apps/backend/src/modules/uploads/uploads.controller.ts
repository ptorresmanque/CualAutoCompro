import type { Request, Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { badRequest } from "../../shared/errors.js";

const PUBLIC_DIR = path.resolve(process.cwd(), "public", "uploads");

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

type ImageFormat = { ext: string; mime: string };

/**
 * Detecta el formato leyendo los magic bytes del archivo.
 *
 * El `Content-Type` que manda el browser NO es confiable: lo deriva de la
 * extensión del archivo según el registro del SO, no del contenido. Casos
 * reales que llegaban como 400 cuando validábamos contra el mime declarado:
 *
 *   - un `.png` que en realidad es WebP/JPEG (típico al guardar imágenes
 *     bajadas de la web) → el browser declara `image/png` y no coincidía;
 *   - Windows con el registro tocado manda `image/x-png`, y Chrome manda
 *     `image/apng` para PNG animados: ninguno estaba en la whitelist;
 *   - archivos sin extensión o desde ciertos pickers llegan como
 *     `application/octet-stream`.
 *
 * Validar por contenido cubre los tres casos y además es más estricto desde
 * el punto de vista de seguridad: la extensión con la que guardamos sale de
 * los bytes, no de lo que afirme el cliente.
 */
export const detectImageFormat = (buffer: Buffer): ImageFormat | null => {
  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return { ext: "png", mime: "image/png" };
  // Sólo SOI + marcador: exigir que termine en FFD9 rechaza JPEGs reales con
  // bytes de padding al final (se observó en fotos de cámaras Android).
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  const head6 = buffer.subarray(0, 6).toString("ascii");
  if (head6 === "GIF89a" || head6 === "GIF87a") return { ext: "gif", mime: "image/gif" };
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  if (buffer.length >= 12) {
    // ISOBMFF file type box: "ftyp" + brand. `avis` es la variante secuencia.
    const brand = buffer.subarray(4, 12).toString("ascii");
    if (brand === "ftypavif" || brand === "ftypavis") return { ext: "avif", mime: "image/avif" };
  }
  return null;
};

export const uploadsController = {
  upload: ah(async (req: Request, res: Response) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw badRequest("Archivo requerido");
    const format = detectImageFormat(file.buffer);
    if (!format) {
      throw badRequest(
        `El archivo no es una imagen válida (tipo declarado: ${file.mimetype || "desconocido"}). Formatos aceptados: JPG, PNG, WebP, GIF, AVIF.`,
      );
    }
    const { ext } = format;

    const now = new Date();
    const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dir = path.join(PUBLIC_DIR, yyyyMm);
    await mkdir(dir, { recursive: true });

    const filename = `${nanoid(10)}.${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, file.buffer);

    const url = `/uploads/${yyyyMm}/${filename}`;
    res.json(ok({ url, filename, size: file.size, mime: format.mime }));
  }),
};
