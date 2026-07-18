import { notFound } from "next/navigation";
import { NegotiationRoom } from "@/components/negotiation/negotiation-room";
import { getNegotiation } from "@/lib/server/commerce/commerce";
import { uuidSchema } from "@/lib/server/commerce/validation";

export default async function NegotiationRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const negotiation = await getNegotiation(id);
  if (!negotiation) notFound();
  return <NegotiationRoom key={id} negotiation={negotiation} />;
}
