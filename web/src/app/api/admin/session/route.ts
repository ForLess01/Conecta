import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  constantTimeSecretEquals,
  signAdminSessionToken,
} from "@/lib/auth/admin-session";

const adminSessionRequestSchema = z.strictObject({
  passphrase: z.string().min(1).max(1_024),
});

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
};

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.ADMIN_API_SECRET;

  if (!configuredSecret) {
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = adminSessionRequestSchema.safeParse(body);
  if (!parsed.success || !constantTimeSecretEquals(configuredSecret, parsed.data.passphrase)) {
    return NextResponse.json(
      { error: "Invalid admin credentials." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const response = NextResponse.json(
    { authenticated: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    signAdminSessionToken(configuredSecret),
    { ...cookieOptions, maxAge: ADMIN_SESSION_TTL_SECONDS },
  );

  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    { authenticated: false },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });

  return response;
}
