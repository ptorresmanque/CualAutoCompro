import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { Prisma, type PrismaClient } from "@prisma/client";
import { badRequest, conflict, notFound, unauthorized } from "../../shared/errors.js";
import { sign } from "../../infra/jwt.js";
import { registerSchema, loginSchema } from "./auth.dto.js";
import type { z } from "zod";
import { narrowUserRole } from "../../shared/user-role.js";

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(input: z.infer<typeof registerSchema>) {
    const { email, password, name } = registerSchema.parse(input);
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw conflict("Email ya registrado");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, name, role: "USER" },
    });
    return { id: user.id, email: user.email, name: user.name, role: narrowUserRole(user.role) };
  }

  async login(input: z.infer<typeof loginSchema>) {
    const { email, password } = loginSchema.parse(input);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw unauthorized("Credenciales inválidas");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized("Credenciales inválidas");
    const role = narrowUserRole(user.role);
    const token = sign({ sub: user.id, email: user.email, name: user.name, role });
    return {
      user: { id: user.id, email: user.email, name: user.name, role },
      token,
    };
  }

  async updateProfile(id: string, name: string) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { name: name.trim() },
        select: { id: true, email: true, name: true, role: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw notFound("Usuario no encontrado");
      }
      throw error;
    }
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw notFound("Usuario no encontrado");
    if (!user.passwordHash) throw badRequest("Esta cuenta usa inicio de sesión social");
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw unauthorized("La contraseña actual no es correcta");
    }
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    return { updated: true };
  }

  async deleteAccount(id: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw notFound("Usuario no encontrado");
    if (user.passwordHash && !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw unauthorized("La contraseña actual no es correcta");
    }
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }


  /**
   * Initiate password recovery. Always returns success even if the email is
   * unknown, to avoid leaking whether an account exists.
   */
  async forgotPassword(email: string): Promise<{ token: string | null; expiresAt: Date | null }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return { token: null, expiresAt: null };
    }
    const token = nanoid(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpiresAt: expiresAt },
    });
    return { token, expiresAt };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { resetPasswordToken: token } });
    if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw unauthorized("Token inválido o expirado");
    }
    if (!user.passwordHash) {
      throw badRequest("Esta cuenta usa inicio de sesión social");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });
    return { updated: true };
  }
}
