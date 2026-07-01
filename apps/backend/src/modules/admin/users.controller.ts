import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { unauthorized } from "../../shared/errors.js";
import { prisma } from "../../infra/prisma.js";
import { AdminUsersService } from "./users.service.js";

const svc = new AdminUsersService(prisma);

export const adminUsersController = {
  list: ah(async (_req: Request, res: Response) => res.json(ok(await svc.list()))),

  promote: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.promote(id)));
  }),

  demote: ah(async (req: Request, res: Response) => {
    const actor = req.user;
    if (!actor) throw unauthorized();
    const id = req.params.id ?? "";
    res.json(ok(await svc.demote(id, actor.id)));
  }),
};