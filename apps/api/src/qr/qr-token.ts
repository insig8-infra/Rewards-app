import { createHmac, randomBytes } from "node:crypto";

const DEV_QR_TOKEN_SECRET = "local-dev-qr-token-secret";

export function hashQrToken(tokenValue: string): string {
  const secret = process.env.QR_TOKEN_SECRET ?? DEV_QR_TOKEN_SECRET;
  return createHmac("sha256", secret).update(tokenValue).digest("hex");
}

export function createQrTokenValue(): string {
  return randomBytes(32).toString("base64url");
}
