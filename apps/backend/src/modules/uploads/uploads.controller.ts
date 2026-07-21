import type { Request, Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { badRequest } from "../../shared/errors.js";

const ALLOWED_MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const PUBLIC_DIR = path.resolve(process.cwd(), "public", "uploads");

const hasValidImageSignature = (buffer: Buffer, mime: string): boolean => {
  if (mime === "image/jpeg") return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/gif") return buffer.subarray(0, 6).toString("ascii") === "GIF89a" || buffer.subarray(0, 6).toString("ascii") === "GIF87a";
  if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
};

export const uploadsController = {
  upload: ah(async (req: Request, res: Response) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw badRequest("Archivo requerido");
    const ext = ALLOWED_MIMES[file.mimetype];
    if (!ext) throw badRequest(`Mime no permitido: ${file.mimetype}`);
    if (!hasValidImageSignature(file.buffer, file.mimetype)) {
      throw badRequest("El contenido del archivo no coincide con su tipo de imagen");
    }

    const now = new Date();
    const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dir = path.join(PUBLIC_DIR, yyyyMm);
    await mkdir(dir, { recursive: true });

    const filename = `${nanoid(10)}.${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, file.buffer);

    const url = `/uploads/${yyyyMm}/${filename}`;
    res.json(ok({ url, filename, size: file.size, mime: file.mimetype }));
  }),
};
