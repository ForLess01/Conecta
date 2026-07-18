// Domain types shared across the Conecta prototype.
// This is a UI prototype: all data is mocked in src/lib/mock.

export type UserRole = "productor" | "comprador" | "transportista" | "admin";

export type VerificationLevel = "sin_verificar" | "basico" | "verificado" | "confiable";

export type NegotiationMode = "rapida" | "conversacional" | "ambas";

export type RiskLevel = "bajo" | "medio" | "alto" | "critico";

export interface RiskInfo {
  score: number; // 0-100
  level: RiskLevel;
  confidence: number; // 0-100
  updatedAt: string; // ISO date
  reason: string;
  factors: { label: string; detail: string }[];
  sources: { label: string; url: string }[];
  alternativeRouteAvailable: boolean;
  estimatedDelayHours?: number;
  estimatedExtraCostSoles?: number;
}

export interface PriceRange {
  low: number;
  central: number;
  high: number;
  unit: string;
  confidence: number; // 0-100
  updatedAt: string;
  basis: { label: string; value: string }[];
}

export interface Location {
  district: string;
  province: string;
  region: string;
  lat: number;
  lng: number;
}

export interface Producer {
  id: string;
  name: string;
  avatarSeed: string;
  verification: VerificationLevel;
  location: Location;
  responseTimeHours: number;
  operationsCompleted: number;
  memberSince: string;
}

export interface Buyer {
  id: string;
  name: string;
  organization?: string;
  avatarSeed: string;
  verification: VerificationLevel;
  purchaseFrequency: string;
  location: Location;
}

export type VehicleType =
  | "pickup"
  | "camioneta_4x4"
  | "camion_ligero"
  | "camion_8t"
  | "camion_12t"
  | "furgon_cubierto";

export interface Vehicle {
  id: string;
  type: VehicleType;
  label: string;
  plate: string;
  capacityKg: number;
  capacityM3: number;
  covered: boolean;
  refrigerated: boolean;
  is4x4: boolean;
  photos: string[];
  available: boolean;
}

export interface Transporter {
  id: string;
  name: string;
  isCompany: boolean;
  avatarSeed: string;
  verification: VerificationLevel;
  vehicles: Vehicle[];
  frequentRoutes: string[];
  operationsCompleted: number;
  complianceRate: number; // 0-100
  insuranceDeclared: boolean;
}

export type ProductCategory =
  | "papa"
  | "fibra_alpaca"
  | "quinua"
  | "cebolla"
  | "trucha";

export interface Product {
  id: string;
  category: ProductCategory;
  name: string;
  variety: string;
  description: string;
  quality: string;
  photos: string[];
  quantityAvailable: number;
  minOrder: number;
  unit: string;
  location: Location;
  producerId: string;
  negotiationMode: NegotiationMode;
  quickOfferEnabled: boolean;
  conversationalEnabled: boolean;
  negotiationWindowHours: number;
  priceRange: PriceRange;
  risk: RiskInfo;
  deliveryByProducer: boolean;
  status: "activo" | "pausado" | "agotado";
}

export interface PurchaseRequest {
  id: string;
  buyerId: string;
  category: ProductCategory;
  productName: string;
  volume: number;
  unit: string;
  quality: string;
  deadline: string;
  destination: Location;
  initialPrice?: number;
  acceptsPartial: boolean;
  acceptsMultipleProducers: boolean;
  coveredQuantity: number;
  proposalsCount: number;
  logisticsPreference: string;
}

export type OfferStatus = "pendiente" | "aceptada" | "rechazada" | "retirada" | "vencida";

export interface QuickOffer {
  id: string;
  productId: string;
  buyerId: string;
  pricePerUnit: number;
  quantity: number;
  attemptNumber: number;
  maxAttempts: number;
  status: OfferStatus;
  createdAt: string;
}

export type NegotiationStatus = "activa" | "con_propuesta" | "vencida" | "cerrada";

export interface Message {
  id: string;
  senderId: string;
  senderRole: UserRole;
  type: "texto" | "imagen" | "documento" | "sistema";
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Proposal {
  id: string;
  negotiationId: string;
  authorId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  deliveryDate: string;
  qualityTerms: string;
  logisticsMode: string;
  validUntil: string;
  notes?: string;
  status: "activa" | "aceptada" | "rechazada" | "contraofertada" | "vencida";
}

export interface Negotiation {
  id: string;
  productId: string;
  buyerId: string;
  producerId: string;
  mode: "rapida" | "conversacional";
  status: NegotiationStatus;
  windowExpiresAt: string;
  messages: Message[];
  proposals: Proposal[];
  lastMessagePreview: string;
}

export type LogisticsMode = "recoge_comprador" | "entrega_productor" | "marketplace_flete";

export type OrderStatus =
  | "pendiente_logistica"
  | "logistica_seleccionada"
  | "en_despacho"
  | "en_transito"
  | "entregado"
  | "completado"
  | "con_incidencia";

export interface OrderSupplierAllocation {
  producerId: string;
  quantity: number;
  pricePerUnit: number;
  distanceKm: number;
  risk: RiskLevel;
}

export interface Order {
  id: string;
  buyerId: string;
  productId: string;
  allocations: OrderSupplierAllocation[];
  total: number;
  status: OrderStatus;
  logisticsMode?: LogisticsMode;
  createdAt: string;
  timeline: { label: string; at: string; done: boolean }[];
}

export type ShipmentStatus =
  | "publicado"
  | "con_ofertas"
  | "asignado"
  | "recojo"
  | "en_transito"
  | "demorado"
  | "entregado";

export interface FreightRequest {
  id: string;
  orderId?: string;
  origin: Location;
  destination: Location;
  distanceKm: number;
  cargoDescription: string;
  weightKg: number;
  volumeM3: number;
  packages: number;
  requiredDate: string;
  suggestedVehicle: VehicleType;
  suggestedRate: number;
  needsHelper: boolean;
  loadingResponsible: "productor" | "transportista" | "comprador";
  risk: RiskInfo;
  status: ShipmentStatus;
  returnLoadAvailable: boolean;
}

export interface FreightBid {
  id: string;
  freightRequestId: string;
  transporterId: string;
  rate: number;
  vehicleId: string;
  departureAt: string;
  estimatedDurationHours: number;
  helperIncluded: boolean;
  insuranceIncluded: boolean;
  conditions?: string;
  status: "pendiente" | "seleccionada" | "rechazada";
}

export type TripStatus =
  | "programado"
  | "recojo"
  | "en_transito"
  | "demorado"
  | "entregado";

export interface Trip {
  id: string;
  freightRequestId: string;
  bidId: string;
  status: TripStatus;
  driverName: string;
  vehicleId: string;
  cargoDescription: string;
  stops: { label: string; done: boolean; at?: string }[];
  timeline: { status: TripStatus; label: string; at: string }[];
  evidencePhotos: string[];
}

export interface RiskEvent {
  id: string;
  type:
    | "bloqueo"
    | "protesta"
    | "lluvia"
    | "accidente"
    | "via_restringida"
    | "puente_danado";
  location: Location;
  radiusKm: number;
  severity: 1 | 2 | 3 | 4 | 5;
  confidence: number;
  startAt: string;
  endAt?: string;
  source: string;
  sourceUrl?: string;
  status: "activo" | "confirmado" | "resuelto";
}

export interface PriceObservation {
  id: string;
  product: string;
  variety: string;
  market: string;
  region: string;
  date: string;
  low: number;
  central: number;
  high: number;
  unit: string;
  quality: string;
  source: string;
}

export interface Notification {
  id: string;
  category: "negociacion" | "orden" | "transporte" | "riesgo" | "sistema";
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
  href: string;
}
