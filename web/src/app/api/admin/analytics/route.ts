import { NextResponse } from "next/server";
import { z } from "zod";
import { analyticsToCsv, getOperationsAnalytics } from "@/lib/server/analytics/operations";
import { adminErrorResponse } from "@/lib/server/admin/http";

const querySchema = z.object({
  days: z.coerce.number().int().refine((value) => [7, 30, 90].includes(value)).default(30),
  format: z.enum(["json", "csv"]).default("json"),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Invalid analytics query." }, { status: 400 });
    const analytics = await getOperationsAnalytics(parsed.data.days);
    if (parsed.data.format === "csv") {
      return new Response(analyticsToCsv(analytics), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="conecta-analytics-${parsed.data.days}d.csv"`,
        },
      });
    }
    return NextResponse.json(analytics);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
