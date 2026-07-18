import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hardening = readFileSync(
  new URL("../../supabase/migrations/20260718170000_security_and_integrity_hardening.sql", import.meta.url),
  "utf8",
);
const followup = readFileSync(
  new URL("../../supabase/migrations/20260718172000_followup_integrity.sql", import.meta.url),
  "utf8",
);

describe("security and integrity hardening", () => {
  it("prevents direct verification and unrestricted profile reads", () => {
    expect(hardening).toContain("revoke update on public.actors from authenticated");
    expect(hardening).toContain("user_profiles_select_self");
  });

  it("restricts shipment creation and trip attribution", () => {
    expect(hardening).toContain("shipments_insert_draft");
    expect(followup).toContain("is_assigned_trip_actor");
    expect(followup).toContain("trg_guard_trip_cancellation");
  });

  it("guards request allocation and order synchronization", () => {
    expect(followup).toContain("trg_validate_request_allocation");
    expect(followup).toContain("trg_close_fulfilled_request");
    expect(followup).toContain("trg_confirm_order_inventory_on_shipment");
    expect(hardening).toContain("trg_sync_order_from_trip");
  });

  it("keeps bid selection state transactional through the baseline trigger", () => {
    const baseline = readFileSync(
      new URL("../../supabase/migrations/20260718150000_base_schema.sql", import.meta.url),
      "utf8",
    );
    expect(baseline).toContain("trg_validate_shipment_assignment");
    expect(baseline).toContain("then 'ACCEPTED' else 'REJECTED'");
  });
});
