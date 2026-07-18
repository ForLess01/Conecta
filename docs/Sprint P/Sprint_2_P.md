# Sprint 2 — Negociación y órdenes (11–20 h)
**Responsable: P (Logística / IA / Riesgo)**

---

## S2-10 · Logística — Corregir shipment_requests, stops, cargo items y bids
**Prioridad:** Crítica · **Apoyo:** R · **Dependencias:** S1-11, S1-02 · **Entregable:** Migration

### Modelo de datos corregido
```sql
create table shipment_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  requester_id uuid not null references actors(id),
  modality text not null check (modality in ('directo','multi_recojo','ruta_compartida')),
  status text not null default 'creado'
    check (status in ('creado','publicado','ofertado','asignado','en_recojo','en_transito','entregado','cerrado','cancelado','incidencia')),
  created_at timestamptz not null default now()
);

create table shipment_stops (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references shipment_requests(id) on delete cascade,
  stop_type text not null check (stop_type in ('pickup','delivery')),
  sequence int not null,
  location_approx geography(point) not null,
  unique (shipment_request_id, sequence)
);

create table cargo_items (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references shipment_requests(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric not null check (quantity > 0),
  unit text not null
);

create table freight_bids (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references shipment_requests(id) on delete cascade,
  carrier_id uuid not null references actors(id),
  vehicle_id uuid not null references vehicles(id),
  price numeric not null check (price > 0),
  status text not null default 'pendiente' check (status in ('pendiente','aceptada','rechazada')),
  created_at timestamptz not null default now()
);
```

### Reglas de integridad (cubren DB-12, DB-13, DB-14)
- **Secuencia de stops**: al menos un `pickup` y un `delivery`, `sequence` único y consecutivo — validado por trigger.
- **Un solo bid aceptado por envío**: índice único parcial `where status = 'aceptada'` sobre `shipment_request_id`.
- **Vehículo del bid pertenece al transportista**: constraint validada vía función `security definer` que verifica `vehicle.owner_id = carrier_id`.

### Criterio de aceptación — cumplido
- ✅ Múltiples recojos y un solo destino son válidos (modalidad `multi_recojo`).
- ✅ Migración lista para ejecutar desde base vacía (cumple DB-01).

---

## S2-11 · Logística — Crear solicitud de transporte desde una orden
**Prioridad:** Crítica · **Apoyo:** M · **Dependencias:** S2-10, S2-07 · **Entregable:** Backend

### Flujo
1. Al crear una orden (S2-07), se ofrece la acción "Solicitar transporte".
2. El backend genera automáticamente:
   - Un `shipment_request` con `modality = 'directo'` por defecto (editable).
   - `shipment_stops`: pickup en la ubicación del/los productor(es) de la orden, delivery en la ubicación del comprador.
   - `cargo_items`: copiados desde las líneas de la orden (producto + cantidad).
3. El `shipment_request` queda en estado `creado` hasta que el solicitante lo publica.

### Criterio de aceptación — cumplido
- ✅ Genera paradas y carga automáticamente a partir de los datos de la orden, sin intervención manual adicional.

---

## S2-12 · Logística — Implementar marketplace de cargas y detalle
**Prioridad:** Crítica · **Apoyo:** D · **Dependencias:** S2-11, S1-13 · **Entregable:** Feature

### Marketplace de cargas
- Listado filtrable por: origen aproximado, destino aproximado, tipo de vehículo requerido (según peso/volumen de `cargo_items`), rango de fechas.
- Cada tarjeta muestra: modalidad, número de paradas, producto(s) agregados (sin exponer datos exactos del productor — regla DB-15).
- Detalle de carga: mapa (`<MapBase />` de S1-13) con paradas, lista de `cargo_items`, botón "Ofertar flete" (habilita S2-13).

### Criterio de aceptación — cumplido
- ✅ El transportista puede explorar cargas disponibles y abrir el detalle de cada una.

---

## S2-13 · Logística — Implementar oferta de flete y selección de transportista
**Prioridad:** Crítica · **Apoyo:** M · **Dependencia:** S2-12 · **Entregable:** Feature

### Flujo
1. Transportista envía `freight_bid` (precio, vehículo, tiempo estimado) sobre un `shipment_request` en estado `publicado` u `ofertado`.
2. Solicitante ve todas las ofertas ordenadas por precio, con comparador (vehículo, transportista, tiempo).
3. Al aceptar una oferta:
   - `freight_bid.status = 'aceptada'` (único posible por DB-13).
   - `shipment_request.status = 'asignado'`.
   - Las demás ofertas pasan a `rechazada` automáticamente.

### Criterio de aceptación — cumplido
- ✅ El solicitante puede comparar múltiples ofertas y aceptar una, con exclusividad garantizada a nivel de base de datos.
