import type { Negotiation } from "@/types/domain";

export const NEGOTIATIONS: Negotiation[] = [
  {
    id: "neg-1",
    productId: "prod-quinua",
    buyerId: "buyer-2",
    producerId: "prod-2",
    mode: "conversacional",
    status: "con_propuesta",
    windowExpiresAt: "2026-07-20T18:00:00-05:00",
    lastMessagePreview: "Te envío una propuesta con el volumen completo.",
    messages: [
      {
        id: "msg-1",
        senderId: "buyer-2",
        senderRole: "comprador",
        type: "texto",
        content: "Buenos días, me interesa la quinua blanca. ¿Tienen los 3000 kg disponibles esta semana?",
        createdAt: "2026-07-17T09:00:00-05:00",
        read: true,
      },
      {
        id: "msg-2",
        senderId: "prod-2",
        senderRole: "productor",
        type: "texto",
        content: "Buenos días Juan Pablo. Sí, tenemos disponible. Podemos coordinar el precio y la fecha de entrega.",
        createdAt: "2026-07-17T09:20:00-05:00",
        read: true,
      },
      {
        id: "msg-3",
        senderId: "buyer-2",
        senderRole: "comprador",
        type: "sistema",
        content: "Juan Pablo Rojas creó una propuesta estructurada.",
        createdAt: "2026-07-17T09:45:00-05:00",
        read: true,
      },
    ],
    proposals: [
      {
        id: "prop-1",
        negotiationId: "neg-1",
        authorId: "buyer-2",
        quantity: 3000,
        unit: "kg",
        pricePerUnit: 6.5,
        deliveryDate: "2026-07-24",
        qualityTerms: "Grano grande, humedad máxima 13%",
        logisticsMode: "Buscar transporte en marketplace",
        validUntil: "2026-07-19T18:00:00-05:00",
        notes: "Pago 50% adelanto, saldo contra entrega.",
        status: "activa",
      },
    ],
  },
  {
    id: "neg-2",
    productId: "prod-fibra-alpaca",
    buyerId: "buyer-3",
    producerId: "prod-2",
    mode: "conversacional",
    status: "activa",
    windowExpiresAt: "2026-07-19T12:00:00-05:00",
    lastMessagePreview: "¿Podrían enviar fotos de la clasificación por finura?",
    messages: [
      {
        id: "msg-4",
        senderId: "buyer-3",
        senderRole: "comprador",
        type: "texto",
        content: "Hola, ¿podrían enviar fotos de la clasificación por finura de la fibra?",
        createdAt: "2026-07-18T08:10:00-05:00",
        read: false,
      },
    ],
    proposals: [],
  },
  {
    id: "neg-3",
    productId: "prod-trucha",
    buyerId: "buyer-1",
    producerId: "prod-4",
    mode: "conversacional",
    status: "vencida",
    windowExpiresAt: "2026-07-15T12:00:00-05:00",
    lastMessagePreview: "La ventana de negociación venció sin acuerdo.",
    messages: [
      {
        id: "msg-5",
        senderId: "buyer-1",
        senderRole: "comprador",
        type: "sistema",
        content: "La ventana de negociación venció sin acuerdo.",
        createdAt: "2026-07-15T12:00:00-05:00",
        read: true,
      },
    ],
    proposals: [],
  },
];

export function getNegotiationById(id: string): Negotiation | undefined {
  return NEGOTIATIONS.find((n) => n.id === id);
}
