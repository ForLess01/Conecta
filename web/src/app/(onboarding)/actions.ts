"use server";

import { revalidatePath } from "next/cache";
import { bootstrapAccount, completeOnboarding, submitVerification } from "@/lib/server/account/account";

const ONBOARDING_ROUTE = {
  productor: "/producer",
  comprador: "/buyer",
  transportista: "/transporter",
} as const;

export async function bootstrapAccountAction(profileKind: unknown, roles: unknown) {
  const primary = await bootstrapAccount(profileKind, roles);
  revalidatePath("/", "layout");
  return ONBOARDING_ROUTE[primary];
}

export async function completeOnboardingAction(input: unknown) {
  await completeOnboarding(input);
  revalidatePath("/", "layout");
}

export async function submitVerificationAction(notes?: string) {
  const requestId = await submitVerification(notes);
  revalidatePath("/verification");
  return requestId;
}
