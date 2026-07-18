import { type NextRequest, NextResponse } from "next/server";
import {
  OrderPermissionError,
  OrderServerConfigurationError,
  getOrder,
} from "@/lib/server/orders/order-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const actorId = request.nextUrl.searchParams.get("actorId");

  if (!actorId) {
    return NextResponse.json({ error: "actorId query parameter is required." }, { status: 400 });
  }

  try {
    const order = await getOrder(id, actorId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderPermissionError) {
      return NextResponse.json({ error: "Not a participant of this order." }, { status: 403 });
    }
    if (error instanceof OrderServerConfigurationError) {
      return NextResponse.json({ error: "Orders are unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Order could not be retrieved." }, { status: 500 });
  }
}
