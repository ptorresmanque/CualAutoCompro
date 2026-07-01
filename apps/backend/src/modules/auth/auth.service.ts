import bcrypt from "bcrypt";
import type { PrismaClient } from "@prisma/client";
import { conflict, unauthorized } from "../../shared/errors.js";
import { sign } from "../../infra/jwt.js";
import { registerSchema, loginSchema } from "./auth.dto.js";
import type { z } from "zod";

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
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async login(input: z.infer<typeof loginSchema>) {
    const { email, password } = loginSchema.parse(input);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized("Credenciales inválidas");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized("Credenciales inválidas");
    const token = sign({ sub: user.id, email: user.email, name: user.name, role: user.role });
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }
}