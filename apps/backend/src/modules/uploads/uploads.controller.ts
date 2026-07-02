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

export const uploadsController = {
  upload: ah(async (req: Request, res: Response) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw badRequest("Archivo requerido");
    const ext = ALLOWED_MIMES[file.mimetype];
    if (!ext) throw badRequest(`Mime no permitido: ${file.mimetype}`);

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