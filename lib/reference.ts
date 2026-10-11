import { randomInt } from "node:crypto";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateReference(): string {
  const code = Array.from(
    { length: 6 },
    () => alphabet[randomInt(alphabet.length)],
  ).join("");
  return `FB-${code}`;
}
