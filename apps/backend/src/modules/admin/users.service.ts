import { Prisma, type PrismaClient } from "@prisma/client";
import { cannotDemoteSelf, notFound } from "../../shared/errors.js";

export class AdminUsersService {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async promote(id: string) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { role: "ADMIN" },
        select: { id: true, email: true, name: true, role: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Usuario no encontrado");
      }
      throw e;
    }
  }

  async demote(id: string, actorId: string) {
    if (id === actorId) {
      throw cannotDemoteSelf();
    }
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { role: "USER" },
        select: { id: true, email: true, name: true, role: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Usuario no encontrado");
      }
      throw e;
    }
  }
}
