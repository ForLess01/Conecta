import "server-only";

import { z } from "zod";
import { SELF_SERVICE_ROLES, type SelfServiceRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { getMyActorContext, requireUser } from "@/lib/supabase/session";
import type { Database } from "@/lib/supabase/types.gen";

const notificationsSchema = z.object({
  negotiation: z.boolean(),
  order: z.boolean(),
  transport: z.boolean(),
  risk: z.boolean(),
  system: z.boolean(),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30),
  language: z.enum(["es", "qu", "ay"]),
  approximateLocationOnly: z.boolean(),
  notifications: notificationsSchema,
});

export const rolesSchema = z.array(z.enum(SELF_SERVICE_ROLES as [SelfServiceRole, ...SelfServiceRole[]]))
  .min(1)
  .transform((roles) => [...new Set(roles)]);

const personFields = {
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^(?:\+?51)?9\d{8}$/),
};

const onboardingSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("productor"),
    ...personFields,
    details: z.object({
      location: z.object({ district: z.string().trim().min(2), province: z.string().trim().min(2), region: z.string().trim().min(2) }),
      products: z.array(z.string().trim().min(1)).min(1),
      capacity: z.number().positive(),
      unit: z.string().trim().min(1),
      quickNegotiation: z.boolean(),
      negotiationWindowHours: z.number().int().min(1).max(168),
      declaredDocuments: z.array(z.string()),
    }),
  }),
  z.object({
    role: z.literal("comprador"),
    details: z.object({
      buyerType: z.string().trim().min(2),
      organization: z.string().trim().max(160),
      ruc: z.string().trim().max(11),
      products: z.array(z.string().trim().min(1)).min(1),
      destination: z.string().trim().min(2),
      frequency: z.string().trim().min(2),
    }),
  }),
  z.object({
    role: z.literal("transportista"),
    ...personFields,
    details: z.object({
      operationType: z.string().trim().min(2),
      routes: z.array(z.string().trim().min(1)).min(1),
      declaredDocuments: z.array(z.string()).min(1),
      returnAvailable: z.boolean(),
    }),
    vehicle: z.object({
      plate: z.string().trim().min(5).max(12),
      vehicleTypeCode: z.string().trim().min(1),
      bodyTypeCode: z.string().trim().min(1),
      capacityKg: z.number().positive(),
      capacityM3: z.union([z.string(), z.number()]),
      covered: z.boolean(),
      refrigerated: z.boolean(),
      fourWheelDrive: z.boolean(),
    }),
  }),
]);

export type AccountSettings = z.infer<typeof settingsSchema>;

export interface AccountDashboard {
  producer: {
    potentialSales: number;
    offersReceived: number;
    activeNegotiations: number;
    ordersToDispatch: number;
    products: Array<{ id: string; name: string; quantity: number; unit: string; location: string }>;
  };
  buyer: {
    activeRequests: number;
    proposalsReceived: number;
    activeOrders: number;
    monthlySpend: number;
    savedProviders: number;
    orders: Array<{ id: string; status: string; createdAt: string }>;
    requests: Array<{ id: string; name: string; quantity: number; unit: string }>;
  };
  transporter: {
    openLoads: number;
    sentBids: number;
    scheduledTrips: number;
    estimatedIncome: number;
    loads: Array<{ id: string; origin: string | null; destination: string | null; cargo: string | null; weightKg: number | null }>;
    trips: Array<{ id: string; status: string; cargo: string | null }>;
  };
  negotiations: Array<{ id: string; preview: string; expiresAt: string | null }>;
}

type AccountFunctionName = Extract<keyof Database["public"]["Functions"], `account_${string}`>;
type FunctionArgs<Name extends AccountFunctionName> = Database["public"]["Functions"][Name]["Args"];

async function actorRpc<Name extends AccountFunctionName, T>(
  name: Name,
  getArgs: (actorId: string) => FunctionArgs<Name>,
) {
  const actor = await getMyActorContext();
  if (!actor) throw new Error("Actor context required");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, getArgs(actor.id));
  if (error) throw new Error(error.message);
  return { data: data as T, actor };
}

export async function bootstrapAccount(profileKind: unknown, roles: unknown) {
  const parsedKind = z.enum(["person", "organization"]).parse(profileKind);
  const parsedRoles = rolesSchema.parse(roles);
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("bootstrap_actor", {
    p_profile_kind: parsedKind,
    p_role_codes: parsedRoles,
  });
  if (error) throw new Error(error.message);
  return parsedRoles[0];
}

export async function getAccountSettings() {
  const { data } = await actorRpc<"account_get_settings", AccountSettings>(
    "account_get_settings",
    (actorId) => ({ p_actor_id: actorId }),
  );
  return settingsSchema.parse(data);
}

export async function updateAccountSettings(input: unknown) {
  const settings = settingsSchema.parse(input);
  await actorRpc<"account_update_settings", undefined>("account_update_settings", (actorId) => ({
    p_actor_id: actorId,
    p_name: settings.name,
    p_phone: settings.phone,
    p_language: settings.language,
    p_approximate_location_only: settings.approximateLocationOnly,
    p_notifications: settings.notifications,
  }));
}

export async function setOperationalRoles(input: unknown) {
  const roles = rolesSchema.parse(input);
  const { data } = await actorRpc<"account_set_operational_roles", string[]>(
    "account_set_operational_roles",
    (actorId) => ({ p_actor_id: actorId, p_role_codes: roles }),
  );
  return rolesSchema.parse(data);
}

export async function completeOnboarding(input: unknown) {
  const onboarding = onboardingSchema.parse(input);
  await actorRpc<"account_complete_onboarding", undefined>("account_complete_onboarding", (actorId) => ({
    p_actor_id: actorId,
    p_role_code: onboarding.role,
    p_details: onboarding.details,
    ...(onboarding.role !== "comprador" && { p_name: onboarding.name, p_phone: onboarding.phone }),
    ...(onboarding.role === "transportista" && { p_vehicle: onboarding.vehicle }),
  }));
}

export async function getVerification() {
  const { data } = await actorRpc<"account_get_verification", {
    level: string | null;
    requestId: string | null;
    requestStatus: string | null;
    reviewerNotes: string | null;
    createdAt: string | null;
    profileComplete: boolean;
  }>("account_get_verification", (actorId) => ({ p_actor_id: actorId }));
  return data;
}

export async function submitVerification(notes?: string) {
  const parsedNotes = z.string().trim().max(1000).optional().parse(notes);
  const { data } = await actorRpc<"account_submit_verification", string>(
    "account_submit_verification",
    (actorId) => ({ p_actor_id: actorId, ...(parsedNotes && { p_notes: parsedNotes }) }),
  );
  return data;
}

export async function getAccountDashboard() {
  const { data, actor } = await actorRpc<"account_get_dashboard", AccountDashboard>(
    "account_get_dashboard",
    (actorId) => ({ p_actor_id: actorId }),
  );
  return { actor, dashboard: data };
}

export async function signOutAccount() {
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
