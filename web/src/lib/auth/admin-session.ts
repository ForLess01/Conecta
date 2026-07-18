import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "__Host-conecta-admin-session";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

const TOKEN_VERSION = "v1";
const NONCE_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function constantTimeSecretEquals(expected: string, actual: string): boolean {
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();
  const actualDigest = createHash("sha256").update(actual, "utf8").digest();

  return timingSafeEqual(expectedDigest, actualDigest);
}

export function signAdminSessionToken(
  secret: string,
  options: { now?: number; nonce?: string; ttlSeconds?: number } = {},
): string {
  if (!secret) throw new Error("ADMIN_API_SECRET is required to sign an admin session.");

  const now = options.now ?? Date.now();
  const ttlSeconds = options.ttlSeconds ?? ADMIN_SESSION_TTL_SECONDS;
  const nonce = options.nonce ?? randomBytes(24).toString("base64url");

  if (!Number.isFinite(now) || !Number.isSafeInteger(ttlSeconds) || ttlSeconds < 1) {
    throw new Error("Invalid admin session lifetime.");
  }

  if (!NONCE_PATTERN.test(nonce)) throw new Error("Invalid admin session nonce.");

  const expiresAt = Math.floor(now / 1_000) + ttlSeconds;
  const payload = `${TOKEN_VERSION}.${expiresAt}.${nonce}`;
  const signature = createHmac("sha256", secret).update(payload, "utf8").digest("base64url");

  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): boolean {
  if (!token || !secret || token.length > 512 || !Number.isFinite(now)) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [version, rawExpiresAt, nonce, suppliedSignature] = parts;
  if (
    version !== TOKEN_VERSION
    || !/^\d{10,13}$/.test(rawExpiresAt)
    || !NONCE_PATTERN.test(nonce)
    || !SIGNATURE_PATTERN.test(suppliedSignature)
  ) {
    return false;
  }

  const expiresAt = Number(rawExpiresAt);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1_000)) return false;

  const payload = `${version}.${rawExpiresAt}.${nonce}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64url");

  return constantTimeSecretEquals(expectedSignature, suppliedSignature);
}

export function hasAdminAccess(
  credentials: { headerSecret?: string; sessionToken?: string },
  env: Record<string, string | undefined> = process.env,
): boolean {
  const configuredSecret = env.ADMIN_API_SECRET;

  if (!configuredSecret) return env.NODE_ENV === "development";

  return (
    (credentials.headerSecret !== undefined
      && constantTimeSecretEquals(configuredSecret, credentials.headerSecret))
    || verifyAdminSessionToken(credentials.sessionToken, configuredSecret)
  );
}
