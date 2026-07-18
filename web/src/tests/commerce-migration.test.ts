import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260718162000_commerce_workflows.sql", import.meta.url),
  "utf8",
);

describe("commerce workflow migration", () => {
  it("defines and protects every commerce RPC", () => {
    for (const name of [
      "commerce_create_conversation",
      "commerce_submit_quick_offer",
      "commerce_send_message",
      "commerce_create_proposal",
      "commerce_respond_to_proposal",
      "commerce_list_negotiations",
      "commerce_get_negotiation",
      "commerce_list_orders",
      "commerce_get_order",
    ]) {
      expect(migration).toContain(`function public.${name}`);
      expect(migration).toContain(`grant execute on function public.${name}`);
    }
  });

  it("locks inventory and creates the accepted order and reservation in one function", () => {
    const decisionRpc = migration.slice(
      migration.indexOf("function public.commerce_respond_to_proposal"),
      migration.indexOf("function public.commerce_list_negotiations"),
    );
    expect(decisionRpc).toContain("for update");
    expect(decisionRpc).toContain("insert into public.commercial_orders");
    expect(decisionRpc).toContain("insert into public.inventory_reservations");
    expect(decisionRpc).not.toContain("hidden_floor_price");
  });
});
