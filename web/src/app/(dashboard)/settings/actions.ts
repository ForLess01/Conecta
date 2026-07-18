"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setOperationalRoles, signOutAccount, updateAccountSettings } from "@/lib/server/account/account";

export async function saveSettingsAction(input: unknown) {
  await updateAccountSettings(input);
  revalidatePath("/settings");
  revalidatePath("/home");
}

export async function saveRolesAction(input: unknown) {
  const roles = await setOperationalRoles(input);
  revalidatePath("/", "layout");
  return roles;
}

export async function signOutAction() {
  await signOutAccount();
  redirect("/login");
}
