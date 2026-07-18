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
let producerUserId;
let producerActorId;
let secondProducerUserId;
let secondProducerActorId;
let requestListingId;
let requestLocationId;
let requestNegotiationId;
let secondRequestNegotiationId;
let requestOrderId;
let chatChannel;

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
  for (const field of ["actor_verification_code", "currency_symbol", "price_low", "price_mid", "price_high", "price_confidence", "price_calculated_at"]) {
    if (!(field in listings[0])) throw new Error(`Marketplace metadata field ${field} was not returned.`);
  }

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

  const producerEmail = `smoke-producer-${Date.now()}@conecta.test`;
  const producerPassword = `Smoke-${crypto.randomUUID()}!`;
  const { data: createdProducer, error: producerCreateError } = await admin.auth.admin.createUser({
    email: producerEmail,
    password: producerPassword,
    email_confirm: true,
    user_metadata: { full_name: "Conecta Producer Smoke" },
  });
  if (producerCreateError) throw producerCreateError;
  producerUserId = createdProducer.user.id;
  const producerClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: producerLoginError } = await producerClient.auth.signInWithPassword({
    email: producerEmail,
    password: producerPassword,
  });
  if (producerLoginError) throw producerLoginError;
  const { data: producerActor, error: producerBootstrapError } = await producerClient.rpc("bootstrap_actor", {
    p_profile_kind: "person",
    p_role_codes: ["productor"],
    p_display_name: "Conecta Producer Smoke",
  });
  if (producerBootstrapError) throw producerBootstrapError;
  producerActorId = producerActor;

  const secondProducerEmail = `smoke-producer-2-${Date.now()}@conecta.test`;
  const secondProducerPassword = `Smoke-${crypto.randomUUID()}!`;
  const { data: createdSecondProducer, error: secondProducerCreateError } = await admin.auth.admin.createUser({
    email: secondProducerEmail,
    password: secondProducerPassword,
    email_confirm: true,
    user_metadata: { full_name: "Conecta Second Producer Smoke" },
  });
  if (secondProducerCreateError) throw secondProducerCreateError;
  secondProducerUserId = createdSecondProducer.user.id;
  const secondProducerClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: secondProducerLoginError } = await secondProducerClient.auth.signInWithPassword({
    email: secondProducerEmail,
    password: secondProducerPassword,
  });
  if (secondProducerLoginError) throw secondProducerLoginError;
  const { data: secondProducerActor, error: secondProducerBootstrapError } = await secondProducerClient.rpc("bootstrap_actor", {
    p_profile_kind: "person",
    p_role_codes: ["productor"],
    p_display_name: "Conecta Second Producer Smoke",
  });
  if (secondProducerBootstrapError) throw secondProducerBootstrapError;
  secondProducerActorId = secondProducerActor;

  const [{ data: product }, { data: unit }] = await Promise.all([
    admin.from("products").select("id").ilike("code", "POTATO").single(),
    admin.from("units_of_measure").select("id").ilike("code", "KG").single(),
  ]);
  if (!product || !unit) throw new Error("Product catalogs are incomplete.");
  const { data: requestId, error: requestError } = await userClient.rpc("create_purchase_request", {
    p_actor_id: actorId,
    p_product_id: product.id,
    p_variety_id: null,
    p_title: "Smoke test potato request",
    p_description: "Temporary request used by the integration smoke test.",
    p_quantity: 100,
    p_unit_id: unit.id,
    p_location_label: "Smoke destination",
    p_latitude: -15.84,
    p_longitude: -70.02,
    p_deadline_at: new Date(Date.now() + 86_400_000).toISOString(),
    p_delivery_deadline: new Date(Date.now() + 172_800_000).toISOString().slice(0, 10),
    p_accepts_partial_offers: true,
    p_accepts_multiple_suppliers: true,
    p_publish: true,
  });
  if (requestError) throw requestError;
  requestListingId = requestId;
  const { data: requestRow } = await admin.from("market_listings").select("location_point_id").eq("id", requestListingId).single();
  requestLocationId = requestRow?.location_point_id;

  const { data: requestConversation, error: requestConversationError } = await producerClient.rpc(
    "commerce_create_conversation",
    { p_listing_id: requestListingId, p_actor_id: producerActorId },
  );
  if (requestConversationError) throw requestConversationError;
  requestNegotiationId = requestConversation?.[0]?.negotiation_id;
  if (!requestNegotiationId) throw new Error("Request conversation was not created.");

  const chatBody = `Realtime smoke ${crypto.randomUUID()}`;
  let resolveChatReady;
  let rejectChatReady;
  const chatReady = new Promise((resolve, reject) => {
    resolveChatReady = resolve;
    rejectChatReady = reject;
  });
  await userClient.realtime.setAuth();
  const realtimeMessage = new Promise((resolve) => {
    chatChannel = userClient
      .channel(`negotiation:${requestNegotiationId}`, { config: { private: true } })
      .on(
        "broadcast",
        { event: "INSERT" },
        ({ payload }) => {
          if (payload.table === "messages" && payload.record?.body === chatBody) {
            resolve(payload.record);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") resolveChatReady();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          const error = new Error(`Realtime chat subscription failed: ${status}`);
          rejectChatReady(error);
        }
      });
  });
  await Promise.race([
    chatReady,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Realtime chat subscription did not become ready.")), 10_000)),
  ]);
  const { error: chatMessageError } = await producerClient.rpc("commerce_send_message", {
    p_negotiation_id: requestNegotiationId,
    p_actor_id: producerActorId,
    p_body: chatBody,
  });
  if (chatMessageError) throw chatMessageError;
  await Promise.race([
    realtimeMessage,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Realtime chat message was not delivered.")), 15_000)),
  ]);
  await userClient.removeChannel(chatChannel);
  chatChannel = undefined;

  const { data: proposal, error: proposalError } = await producerClient.rpc("commerce_create_proposal", {
    p_negotiation_id: requestNegotiationId,
    p_actor_id: producerActorId,
    p_quantity: 60,
    p_unit_price: 2.2,
    p_currency_code: "PEN",
    p_logistics_mode: "BUYER_PICKUP",
  });
  if (proposalError) throw proposalError;
  const proposalId = proposal?.id;
  if (!proposalId) throw new Error("Request proposal was not created.");
  const { data: accepted, error: acceptanceError } = await userClient.rpc("commerce_respond_to_proposal", {
    p_negotiation_id: requestNegotiationId,
    p_proposal_id: proposalId,
    p_actor_id: actorId,
    p_accept: true,
  });
  if (acceptanceError) throw acceptanceError;
  requestOrderId = accepted?.[0]?.order_id;
  if (!requestOrderId) throw new Error("Request proposal did not create an order.");

  const { data: secondRequestConversation, error: secondRequestConversationError } = await secondProducerClient.rpc(
    "commerce_create_conversation",
    { p_listing_id: requestListingId, p_actor_id: secondProducerActorId },
  );
  if (secondRequestConversationError) throw secondRequestConversationError;
  secondRequestNegotiationId = secondRequestConversation?.[0]?.negotiation_id;
  if (!secondRequestNegotiationId) throw new Error("Second request conversation was not created.");
  const { data: secondProposal, error: secondProposalError } = await secondProducerClient.rpc("commerce_create_proposal", {
    p_negotiation_id: secondRequestNegotiationId,
    p_actor_id: secondProducerActorId,
    p_quantity: 40,
    p_unit_price: 2.1,
    p_currency_code: "PEN",
    p_logistics_mode: "BUYER_PICKUP",
  });
  if (secondProposalError) throw secondProposalError;
  const { data: secondAccepted, error: secondAcceptanceError } = await userClient.rpc("commerce_respond_to_proposal", {
    p_negotiation_id: secondRequestNegotiationId,
    p_proposal_id: secondProposal?.id,
    p_actor_id: actorId,
    p_accept: true,
  });
  if (secondAcceptanceError) throw secondAcceptanceError;
  if (secondAccepted?.[0]?.order_id !== requestOrderId) throw new Error("Request suppliers were split across orders.");
  const { count: supplierItemCount, error: supplierItemError } = await admin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("order_id", requestOrderId);
  if (supplierItemError || supplierItemCount !== 2) throw supplierItemError ?? new Error("Combined supplier order is incomplete.");

  console.log(JSON.stringify({
    authenticated: true,
    actorBootstrapped: true,
    listingsReturned: listings.length,
    marketplaceMetadataReturned: true,
    savedToggle: true,
    conversationCreated: true,
    realtimeChatDelivered: true,
    quickOfferProtected: true,
    adminAuthorization: true,
    dashboardLoaded: true,
    requestProposalAccepted: true,
    multiSupplierOrderCombined: true,
  }));
} finally {
  if (chatChannel) await userClient.removeChannel(chatChannel);
  if (requestOrderId) {
    const { data: items } = await admin.from("order_items").select("id").eq("order_id", requestOrderId);
    const itemIds = (items ?? []).map((item) => item.id);
    if (itemIds.length) await admin.from("order_supplier_allocations").delete().in("order_item_id", itemIds);
    await admin.from("order_items").delete().eq("order_id", requestOrderId);
    await admin.from("order_negotiations").delete().eq("order_id", requestOrderId);
    await admin.from("commercial_orders").delete().eq("id", requestOrderId);
  }
  if (requestNegotiationId) {
    await admin.from("commercial_proposals").delete().eq("negotiation_id", requestNegotiationId);
    await admin.from("messages").delete().eq("negotiation_id", requestNegotiationId);
    await admin.from("negotiation_participants").delete().eq("negotiation_id", requestNegotiationId);
    await admin.from("negotiations").delete().eq("id", requestNegotiationId);
  }
  if (secondRequestNegotiationId) {
    await admin.from("commercial_proposals").delete().eq("negotiation_id", secondRequestNegotiationId);
    await admin.from("messages").delete().eq("negotiation_id", secondRequestNegotiationId);
    await admin.from("negotiation_participants").delete().eq("negotiation_id", secondRequestNegotiationId);
    await admin.from("negotiations").delete().eq("id", secondRequestNegotiationId);
  }
  if (requestListingId) {
    await admin.from("purchase_requests").delete().eq("listing_id", requestListingId);
    await admin.from("market_listings").delete().eq("id", requestListingId);
  }
  if (requestLocationId) await admin.from("location_points").delete().eq("id", requestLocationId);
  if (producerActorId) {
    await admin.from("actor_roles").delete().eq("actor_id", producerActorId);
    await admin.from("actors").delete().eq("id", producerActorId);
  }
  if (producerUserId) {
    await admin.from("user_roles").delete().eq("user_id", producerUserId);
    await admin.auth.admin.deleteUser(producerUserId);
  }
  if (secondProducerActorId) {
    await admin.from("actor_roles").delete().eq("actor_id", secondProducerActorId);
    await admin.from("actors").delete().eq("id", secondProducerActorId);
  }
  if (secondProducerUserId) {
    await admin.from("user_roles").delete().eq("user_id", secondProducerUserId);
    await admin.auth.admin.deleteUser(secondProducerUserId);
  }
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
