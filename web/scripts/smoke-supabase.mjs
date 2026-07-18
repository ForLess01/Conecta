import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase smoke test environment is incomplete.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const userClient = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const email = `smoke-${Date.now()}@conecta.test`;
const password = `Smoke-${crypto.randomUUID()}!`;
let userId;
let actorId;
let negotiationId;
let quickNegotiationId;

try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Conecta Smoke Test", phone: "999999999" },
  });
  if (createError) throw createError;
  userId = created.user.id;

  const { error: loginError } = await userClient.auth.signInWithPassword({ email, password });
  if (loginError) throw loginError;

  const { data: bootstrappedActor, error: bootstrapError } = await userClient.rpc("bootstrap_actor", {
    p_profile_kind: "person",
    p_role_codes: ["comprador"],
    p_display_name: "Conecta Smoke Test",
  });
  if (bootstrapError) throw bootstrapError;
  actorId = bootstrappedActor;

  const { data: listings, error: listingsError } = await userClient.rpc("get_active_marketplace_listings", {
    p_limit: 5,
    p_listing_type: "OFFER",
  });
  if (listingsError) throw listingsError;
  if (!listings?.length) throw new Error("Seeded marketplace offer was not returned.");

  const listingId = listings[0].id;
  const { data: saved, error: saveError } = await userClient.rpc("toggle_saved_listing", {
    p_listing_id: listingId,
  });
  if (saveError || saved !== true) throw saveError ?? new Error("Listing was not saved.");
  const { data: unsaved, error: unsaveError } = await userClient.rpc("toggle_saved_listing", {
    p_listing_id: listingId,
  });
  if (unsaveError || unsaved !== false) throw unsaveError ?? new Error("Listing was not unsaved.");

  const { data: conversation, error: conversationError } = await userClient.rpc(
    "commerce_create_conversation",
    { p_listing_id: listingId, p_actor_id: actorId },
  );
  if (conversationError) throw conversationError;
  negotiationId = conversation?.[0]?.negotiation_id;
  if (!negotiationId) throw new Error("Conversation was not created.");

  const { data: quickOffer, error: quickOfferError } = await userClient.rpc(
    "commerce_submit_quick_offer",
    {
      p_offer_listing_id: listingId,
      p_buyer_actor_id: actorId,
      p_quantity: 100,
      p_unit_price: 0.01,
      p_currency_code: "PEN",
    },
  );
  if (quickOfferError) throw quickOfferError;
  if (quickOffer?.[0]?.result !== "NOT_ACCEPTED") {
    throw new Error("Quick-offer rejection boundary did not behave as expected.");
  }
  quickNegotiationId = quickOffer[0].negotiation_id;

  const { data: adminRole, error: adminRoleError } = await admin
    .from("app_roles")
    .select("id")
    .ilike("code", "ADMIN")
    .single();
  if (adminRoleError) throw adminRoleError;
  const { error: grantAdminError } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role_id: adminRole.id }, { onConflict: "user_id,role_id" });
  if (grantAdminError) throw grantAdminError;
  const { data: isAdmin, error: isAdminError } = await userClient.rpc("is_admin");
  if (isAdminError || !isAdmin) throw isAdminError ?? new Error("Admin role was not recognized.");

  const { data: dashboard, error: dashboardError } = await userClient.rpc("account_get_dashboard", {
    p_actor_id: actorId,
  });
  if (dashboardError || !dashboard) throw dashboardError ?? new Error("Dashboard was not returned.");

  console.log(JSON.stringify({
    authenticated: true,
    actorBootstrapped: true,
    listingsReturned: listings.length,
    savedToggle: true,
    conversationCreated: true,
    quickOfferProtected: true,
    adminAuthorization: true,
    dashboardLoaded: true,
  }));
} finally {
  if (actorId) {
    await admin.from("quick_offer_attempts").delete().eq("buyer_actor_id", actorId);
  }
  if (quickNegotiationId) {
    await admin.from("negotiation_participants").delete().eq("negotiation_id", quickNegotiationId);
    await admin.from("negotiations").delete().eq("id", quickNegotiationId);
  }
  if (negotiationId) {
    await admin.from("negotiation_participants").delete().eq("negotiation_id", negotiationId);
    await admin.from("negotiations").delete().eq("id", negotiationId);
  }
  if (actorId) {
    await admin.from("saved_actors").delete().eq("actor_id", actorId);
    await admin.from("actor_roles").delete().eq("actor_id", actorId);
    await admin.from("actors").delete().eq("id", actorId);
  }
  if (userId) {
    await admin.from("saved_listings").delete().eq("user_id", userId);
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
}
