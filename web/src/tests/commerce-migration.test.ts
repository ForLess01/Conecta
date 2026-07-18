import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260718162000_commerce_workflows.sql", import.meta.url),
  "utf8",
);
const realtimeMigration = readFileSync(
  new URL("../../supabase/migrations/20260718180000_enable_negotiation_realtime.sql", import.meta.url),
  "utf8",
);
const broadcastMigration = readFileSync(
  new URL("../../supabase/migrations/20260718181000_broadcast_negotiation_changes.sql", import.meta.url),
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

  it("publishes persisted negotiation changes to realtime clients", () => {
    expect(realtimeMigration).toContain("alter publication supabase_realtime add table");
    expect(realtimeMigration).toContain("array['messages', 'commercial_proposals', 'negotiations']");
    expect(realtimeMigration).toContain("trg_touch_negotiation_from_message");
    expect(broadcastMigration).toContain("realtime.broadcast_changes");
    expect(broadcastMigration).toContain("negotiation_participants_receive_broadcasts");
    expect(broadcastMigration).toContain("public.can_act_as(n.buyer_actor_id)");
  });
});
