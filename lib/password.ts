import bcrypt from "bcryptjs";

const COST = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

let dummyHash: string | null = null;

export async function burnPasswordCheck(plain: string) {
  dummyHash ??= await bcrypt.hash("not-a-real-password", COST);
  await bcrypt.compare(plain, dummyHash);
}
