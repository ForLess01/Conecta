import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: { claims: { sub: "user-1" } }, error: null }) },
    rpc: rpcMock,
  }),
}));
vi.mock("@/lib/supabase/session", () => ({
  getMyActorContext: async () => ({ id: "actor-1" }),
}));

import { getOrder, listOrders } from "../lib/server/commerce/commerce";

describe("commerce reservation expiration", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockImplementation(async (name: string) => {
      if (name === "release_expired_inventory_reservations") return { data: 1, error: null };
      if (name === "commerce_get_order") return { data: { id: "order-1", status: "EXPIRED" }, error: null };
      if (name === "commerce_list_orders") return { data: [], error: null };
      throw new Error(`Unexpected RPC: ${name}`);
    });
  });

  it("releases expired inventory before returning an order", async () => {
    await expect(getOrder("order-1")).resolves.toMatchObject({ status: "EXPIRED" });
    expect(rpcMock.mock.calls.map(([name]) => name)).toEqual([
      "release_expired_inventory_reservations",
      "commerce_get_order",
    ]);
  });

  it("releases expired inventory before listing orders", async () => {
    await expect(listOrders()).resolves.toEqual([]);
    expect(rpcMock.mock.calls.map(([name]) => name)).toEqual([
      "release_expired_inventory_reservations",
      "commerce_list_orders",
    ]);
  });
});
