import type { PrismaClient } from "@prisma/client";
export class BrandsService {
  constructor(private readonly prisma: PrismaClient) {}
  list() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }
  models(brandId: string) {
    return this.prisma.model.findMany({
      where: { brandId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }
}
