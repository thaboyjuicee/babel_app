import { PrismaClient } from "@prisma/client";

declare global {
  var __babelPrisma: PrismaClient | undefined;
}

export const prisma = global.__babelPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__babelPrisma = prisma;
}
