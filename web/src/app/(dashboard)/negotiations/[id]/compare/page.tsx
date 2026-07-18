import Link from "next/link";
import { notFound } from "next/navigation";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatSoles } from "@/lib/format";
import { getNegotiation } from "@/lib/server/commerce/commerce";
import { uuidSchema } from "@/lib/server/commerce/validation";

export default async function CompareProposalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const negotiation = await getNegotiation(id);
  if (!negotiation || negotiation.proposals.length === 0) notFound();
  const proposals = negotiation.proposals.slice(0, 2);

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Comparar propuestas" description={negotiation.productName} />
      <Card><CardContent className="overflow-x-auto pt-6">
        <table className="w-full min-w-[480px] text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="pb-2">Campo</th>{proposals.map((proposal) => <th key={proposal.id} className="pb-2">{proposal.status}</th>)}</tr></thead>
          <tbody>
            <Row label="Precio por unidad" values={proposals.map((proposal) => formatSoles(proposal.unitPrice))} />
            <Row label="Cantidad" values={proposals.map((proposal) => `${proposal.quantity.toLocaleString("es-PE")} ${proposal.unit}`)} />
            <Row label="Fecha de entrega" values={proposals.map((proposal) => proposal.deliveryDate ? formatDate(proposal.deliveryDate) : "Por acordar")} />
            <Row label="Logística" values={proposals.map((proposal) => proposal.logisticsMode?.replaceAll("_", " ") ?? "Por acordar")} />
          </tbody>
        </table>
      </CardContent></Card>
      <div className="flex justify-end"><Button asChild><Link href={`/negotiations/${id}`}>Volver a la negociación</Link></Button></div>
    </div>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  return <tr className="border-t border-border"><td className="py-3 text-xs text-muted-foreground">{label}</td>{values.map((value, index) => <td key={`${label}-${index}`} className="py-3 font-medium">{value}</td>)}</tr>;
}
