import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/roles", () => ({
  SELF_SERVICE_ROLES: ["productor", "comprador", "transportista"],
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/session", () => ({ getMyActorContext: vi.fn(), requireUser: vi.fn() }));

import { rolesSchema, settingsSchema } from "../lib/server/account/account";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260718165000_account_workflows.sql", import.meta.url),
  "utf8",
);

describe("account workflows", () => {
  it("accepts only unique operational roles and keeps at least one", () => {
    expect(rolesSchema.parse(["productor", "productor", "comprador"])).toEqual(["productor", "comprador"]);
    expect(() => rolesSchema.parse([])).toThrow();
    expect(() => rolesSchema.parse(["admin"])).toThrow();
  });

  it("validates persisted account preferences", () => {
    expect(settingsSchema.parse({
      name: "Rosa Quispe",
      phone: "+51 999 999 999",
      language: "qu",
      approximateLocationOnly: true,
      notifications: { negotiation: true, order: true, transport: false, risk: true, system: false },
    }).language).toBe("qu");
  });

  it("guards account RPCs and never includes admin in self-service role synchronization", () => {
    for (const name of [
      "account_get_settings",
      "account_update_settings",
      "account_set_operational_roles",
      "account_complete_onboarding",
      "account_submit_verification",
      "account_get_verification",
      "account_get_dashboard",
    ]) {
      expect(migration).toContain(`function public.${name}`);
      expect(migration).toContain(`grant execute on function public.${name}`);
    }

    const roleRpc = migration.slice(
      migration.indexOf("function public.account_set_operational_roles"),
      migration.indexOf("function public.account_complete_onboarding"),
    );
    expect(roleRpc).toContain("At least one operational role is required");
    expect(roleRpc).toContain("Role cannot be self-assigned");
    expect(roleRpc).toContain("('PRODUCER', 'BUYER', 'TRANSPORTER')");
    expect(roleRpc).not.toContain("'ADMIN'");
  });
});
