import { prisma } from "@/lib/prisma";

type ResetData = {
  tokenHash: string;
  expiresAt: Date;
  lastSentAt: Date;
};

export const passwordResetRepository = {
  findByUserId: (userId: string) =>
    prisma.passwordReset.findUnique({
      where: { userId },
    }),

  findByTokenHash: (tokenHash: string) =>
    prisma.passwordReset.findUnique({
      where: { tokenHash },
    }),

  upsert: (userId: string, data: ResetData) =>
    prisma.passwordReset.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    }),

  consume: (tokenHash: string) =>
    prisma.passwordReset.deleteMany({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    }),

  deleteByUserId: (userId: string) =>
    prisma.passwordReset.deleteMany({
      where: { userId },
    }),
};