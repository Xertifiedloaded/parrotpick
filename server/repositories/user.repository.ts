import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const userRepository = {
  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
    }),

  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
    }),

  findByUsername: (username: string) =>
    prisma.user.findUnique({
      where: { username },
    }),

  findByReferralCode: (referralCode: string) =>
    prisma.user.findUnique({
      where: { referralCode },
    }),

  // Fetch the user and related profile in one query.
  findByIdWithProfile: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    }),

  create: (data: Prisma.UserCreateInput) =>
    prisma.user.create({
      data,
    }),

  update: (id: string, data: Prisma.UserUpdateInput) =>
    prisma.user.update({
      where: { id },
      data,
    }),
};
