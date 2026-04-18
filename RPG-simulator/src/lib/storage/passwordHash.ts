import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function isBcryptHash(stored: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(stored);
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (isBcryptHash(stored)) {
    return bcrypt.compareSync(plain, stored);
  }
  return plain === stored;
}
