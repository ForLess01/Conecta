import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  constantTimeSecretEquals,
  hasAdminAccess,
  signAdminSessionToken,
  verifyAdminSessionToken,
} from "../lib/auth/admin-session";

const SECRET = "correct horse battery staple";
const NOW = Date.UTC(2026, 6, 18, 18, 0, 0);

describe("admin session signing", () => {
  it("accepts a valid signed token without embedding the admin secret", () => {
    const token = signAdminSessionToken(SECRET, {
      now: NOW,
      nonce: "fixed-test-nonce-1234567890",
      ttlSeconds: 60,
    });

    expect(token).not.toContain(SECRET);
    expect(verifyAdminSessionToken(token, SECRET, NOW + 59_000)).toBe(true);
    expect(verifyAdminSessionToken(token, "wrong secret", NOW + 59_000)).toBe(false);
    expect(verifyAdminSessionToken(token, SECRET, NOW + 60_000)).toBe(false);
    const replacement = token.endsWith("A") ? "B" : "A";
    expect(verifyAdminSessionToken(`${token.slice(0, -1)}${replacement}`, SECRET, NOW)).toBe(false);
  });

  it("accepts the tool header or signed cookie and fails closed in production", () => {
    const token = signAdminSessionToken(SECRET);
    const productionEnv = { ADMIN_API_SECRET: SECRET, NODE_ENV: "production" };

    expect(constantTimeSecretEquals(SECRET, SECRET)).toBe(true);
    expect(hasAdminAccess({ headerSecret: SECRET }, productionEnv)).toBe(true);
    expect(hasAdminAccess({ sessionToken: token }, productionEnv)).toBe(true);
    expect(hasAdminAccess({}, productionEnv)).toBe(false);
    expect(hasAdminAccess({}, { NODE_ENV: "production" })).toBe(false);
    expect(hasAdminAccess({}, { NODE_ENV: "development" })).toBe(true);
  });
});
