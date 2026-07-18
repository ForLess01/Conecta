import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dedupeRiskCandidates, extractRiskCandidates } from "@/lib/ai/risk-extraction";
import { ADMIN_SESSION_COOKIE_NAME, hasAdminAccess } from "@/lib/auth/admin-session";

export const riskRegions = ["Puno", "Arequipa"] as const;
export const riskCorridors = [
  "Ilave - Juliaca",
  "Acora - Puno",
  "Puno - Arequipa",
  "Juliaca - Arequipa",
  "Mazocruz - Ilave",
  "Juli - Puno",
] as const;

const corridorDetails: Record<
  (typeof riskCorridors)[number],
  { province: string; district: string; crop: string }
> = {
  "Ilave - Juliaca": { province: "El Collao", district: "Ilave", crop: "potato" },
  "Acora - Puno": { province: "Puno", district: "Acora", crop: "quinoa" },
  "Puno - Arequipa": { province: "Puno", district: "Puno", crop: "mixed produce" },
  "Juliaca - Arequipa": { province: "San Roman", district: "Juliaca", crop: "mixed produce" },
  "Mazocruz - Ilave": { province: "El Collao", district: "Santa Rosa", crop: "alpaca products" },
  "Juli - Puno": { province: "Chucuito", district: "Juli", crop: "quinoa" },
};

const corridorsByRegion: Record<(typeof riskRegions)[number], readonly (typeof riskCorridors)[number][]> = {
  Puno: riskCorridors,
  Arequipa: ["Puno - Arequipa", "Juliaca - Arequipa"],
};

export const riskAnalyzeRequestSchema = z
  .strictObject({
    region: z.enum(riskRegions),
    corridors: z.array(z.enum(riskCorridors)).min(1).max(riskCorridors.length),
    windowHours: z.number().int().min(1).max(168).default(48),
    force: z.boolean().default(false),
  })
  .superRefine(({ region, corridors }, context) => {
    const allowed = new Set(corridorsByRegion[region]);

    corridors.forEach((corridor, index) => {
      if (!allowed.has(corridor)) {
        context.addIssue({
          code: "custom",
          path: ["corridors", index],
          message: `Corridor is not supported for ${region}.`,
        });
      }
    });
  });

export async function POST(request: NextRequest) {
  if (!hasAdminAccess({
    headerSecret: request.headers.get("x-admin-secret") ?? undefined,
    sessionToken: request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value,
  })) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = riskAnalyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid risk-analysis request." }, { status: 400 });
  }

  const { region, corridors, windowHours, force } = parsed.data;

  try {
    const results = await Promise.all(
      corridors.map((route) => {
        const details = corridorDetails[route];

        return extractRiskCandidates({
          region,
          province: details.province,
          district: details.district,
          route,
          crop: details.crop,
          lookbackHours: windowHours,
          force,
        });
      }),
    );

    const events = dedupeRiskCandidates(results.flatMap((result) => result.candidates));
    const sources = new Set(results.map((result) => result.source));
    const source = sources.size === 1 ? results[0].source : "mixed";
    const generatedAt = latestTimestamp(results.map((result) => result.generatedAt));
    const cached = results.every((result) => result.cached);

    return NextResponse.json({
      run: {
        status: source === "gemini" ? "completed" : "degraded",
        eventCount: events.length,
      },
      events,
      freshness: {
        generatedAt,
        windowHours,
        cached,
      },
      source,
    });
  } catch {
    return NextResponse.json({ error: "Risk analysis could not be completed." }, { status: 502 });
  }
}

function latestTimestamp(timestamps: string[]): string {
  return timestamps.reduce((latest, candidate) =>
    Date.parse(candidate) > Date.parse(latest) ? candidate : latest,
  );
}
