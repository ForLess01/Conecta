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
const multiRoleVerification = readFileSync(
  new URL("../../supabase/migrations/20260718174000_align_multirole_verification.sql", import.meta.url),
  "utf8",
);
const combinedSupplierOrders = readFileSync(
  new URL("../../supabase/migrations/20260718175000_combine_request_supplier_orders.sql", import.meta.url),
  "utf8",
);
const combinedAllocationTotals = readFileSync(
  new URL("../../supabase/migrations/20260718176000_fix_combined_order_allocation_totals.sql", import.meta.url),
  "utf8",
);

describe("security and integrity hardening", () => {
  it("prevents direct verification and unrestricted profile reads", () => {
    expect(hardening).toContain("revoke update on public.actors from authenticated");
    expect(hardening).toContain("user_profiles_select_self");
  });

  it("requires onboarding details for every assigned operational role", () => {
    expect(multiRoleVerification).toContain("function public.account_get_verification");
    expect(multiRoleVerification).toContain("and not exists (");
    expect(multiRoleVerification).toContain("aod.role_code = case upper(r.code::text)");
    expect(multiRoleVerification).toContain("('PRODUCER', 'BUYER', 'TRANSPORTER')");
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

  it("reuses one open order across suppliers for the same request", () => {
    expect(combinedSupplierOrders).toContain("v_request.accepts_multiple_suppliers");
    expect(combinedSupplierOrders).toContain("existing_negotiation.request_listing_id = v_negotiation.request_listing_id");
    expect(combinedSupplierOrders).toContain("if v_order_id is null then");
    expect(combinedSupplierOrders).toContain("All suppliers in a request order must use the same currency");
  });

  it("counts combined-order allocations once despite multiple negotiation links", () => {
    expect(combinedAllocationTotals).toContain("existing_item.order_id in (");
    expect(combinedAllocationTotals).toContain("select distinct existing_link.order_id");
    expect(combinedAllocationTotals).toContain("select distinct ono.order_id");
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
