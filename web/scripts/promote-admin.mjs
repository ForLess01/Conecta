import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

if (!url || !serviceRoleKey || !email) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ADMIN_EMAIL are required.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let page = 1;
let user;
while (!user) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (user || data.users.length < 100) break;
  page += 1;
}

if (!user) throw new Error(`No Supabase Auth user exists for ${email}. Register the account first.`);

const { data: role, error: roleError } = await admin
  .from("app_roles")
  .select("id")
  .ilike("code", "ADMIN")
  .single();
if (roleError) throw roleError;

const { error: grantError } = await admin
  .from("user_roles")
  .upsert({ user_id: user.id, role_id: role.id }, { onConflict: "user_id,role_id" });
if (grantError) throw grantError;

console.log(JSON.stringify({ promoted: true, userId: user.id, email }));
