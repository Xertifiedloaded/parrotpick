
import { prisma } from "@/lib/prisma";

type CodeData = {
  codeHash: string;
  expiresAt: Date;
  resendCount: number;
  lastSentAt: Date;
};

export const verificationRepository = {
  findByUserId: (userId: string) =>
    prisma.emailVerification.findUnique({
      where: { userId },
    }),

  upsert: (userId: string, data: CodeData) =>
    prisma.emailVerification.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
        attempts: 0,
      },
      update: {
        ...data,
        attempts: 0,
      },
    }),

  incrementAttempts: (userId: string) =>
    prisma.emailVerification.update({
      where: { userId },
      data: {
        attempts: { increment: 1 },
      },
    }),

  complete: (userId: string) =>
    prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerification.deleteMany({
        where: { userId },
      }),
    ]),
};
