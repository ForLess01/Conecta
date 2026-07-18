# Sprint 3 — Inteligencia e integración (20–29 h)
**Responsable: P (Logística / IA / Riesgo)**

---

## S3-01 · Precios — Implementar algoritmo inicial de rango sugerido con datos históricos
**Prioridad:** Crítica · **Apoyo:** M · **Dependencia:** S1-14 · **Entregable:** Service

### Algoritmo
Con 20–30 observaciones de precio por producto (fecha, mercado, región, bajo/medio/alto, fuente):

```
mediana = percentil(observaciones.precio, 50)
bajo    = percentil(observaciones.precio, 25)
alto    = percentil(observaciones.precio, 75)

confianza =
  "alta"  si n_observaciones ≥ 20 y desviación relativa < 20%
  "media" si n_observaciones ≥ 10
  "baja"  si n_observaciones < 10

explicación = "Rango calculado sobre {n} observaciones de {mercados} entre {fecha_min} y {fecha_max}."
```

Devuelve: `{ bajo, medio: mediana, alto, confianza, explicacion }`.

### Criterio de aceptación — cumplido
- ✅ Devuelve bajo, medio, alto, confianza y explicación trazable a los datos fuente.

---

## S3-02 (apoyo, responsable M) — nota de integración
El servicio de S3-01 se consume vía `GET /api/precio-sugerido?producto_id=...`; el precio sigue siendo un campo editable en el formulario, nunca de solo lectura — evita el riesgo RSK-11 (precio sugerido percibido como impuesto).

---

## S3-03 · Riesgo — Crear datos semilla y panel manual de eventos de riesgo
**Prioridad:** Crítica · **Apoyo:** D · **Dependencias:** S0-09, S1-14 · **Entregable:** Feature

### Datos semilla (según schema de S0-09)
5 eventos precargados cubriendo los 5 tipos: bloqueo (Ilave–Juli), protesta (Puno centro), lluvia (ruta Mazocruz–Arequipa), accidente (Acora), ruta_libre (control, severidad 0).

### Panel manual (admin)
- Formulario para crear evento: tipo, descripción, ubicación (click en mapa), radio de afectación, severidad, vigencia.
- Acción "confirmar": marca `confirmado = true`, sube la confianza del score.
- Acción "resolver": fuerza `fecha_expiracion = now()`.

### Criterio de aceptación — cumplido
- ✅ El admin puede crear, confirmar y resolver eventos manualmente, sin depender de SQL directo.

---

## S3-04 · Riesgo — Implementar cálculo de riesgo, confianza y vigencia
**Prioridad:** Crítica · **Apoyo:** R · **Dependencias:** S3-03, S1-13 · **Entregable:** Service

Implementa en backend la fórmula definida en S0-09 (`riesgo_ruta`, 0–100), expuesta como `getRiesgoRuta(ruta_geojson)`:
1. Filtra eventos vigentes (`fecha_evento ≤ now ≤ fecha_expiracion`).
2. Calcula distancia evento–ruta (delegado a Turf.js, ver S3-05).
3. Aplica la fórmula ponderada y retorna `{ score, confianza, vigencia, eventos_relevantes[] }`, con cada paso trazable (reproducible: mismos inputs → mismo output).

### Criterio de aceptación — cumplido
- ✅ Puntaje 0–100 con explicación reproducible (lista de eventos que contribuyeron y su peso).

---

## S3-05 · Riesgo — Integrar eventos con ruta usando Turf.js
**Prioridad:** Alta · **Apoyo:** R · **Dependencias:** S3-04, S1-13, S2-11 · **Entregable:** Map logic

### Lógica
```ts
import * as turf from "@turf/turf";

function eventosCercanosARuta(ruta: GeoJSON.LineString, eventos: RiskEvent[]) {
  return eventos.filter(ev => {
    const punto = turf.point([ev.ubicacion.lng, ev.ubicacion.lat]);
    const distanciaKm = turf.pointToLineDistance(punto, ruta, { units: "kilometers" });
    return distanciaKm <= ev.radio_afectacion_km;
  });
}
```
Solo los eventos dentro de su propio radio de afectación respecto a la línea de ruta entran al cálculo de S3-04 — evita que eventos lejanos infecten el score (mitiga RSK-12: riesgo mal interpretado).

### Criterio de aceptación — cumplido
- ✅ Solo eventos cercanos a la ruta afectan el score.

---

## S3-06 · IA — Implementar OpenAI Responses API para extraer eventos de noticias
**Prioridad:** Alta · **Apoyo:** R · **Dependencia:** S0-09 · **Entregable:** AI

### Enfoque
- Se usa `OPENAI_API_KEY` (solo servidor) con la **Responses API**, `response_format` estructurado (JSON Schema = `RiskEventSchema` de S0-09, sin campos `id`/`confirmado` que el sistema asigna).
- Prompt: entrega titulares/snippets de noticias de la región (Puno/altiplano) y pide clasificar en los 5 tipos definidos, con severidad estimada 0–1 y radio de afectación por defecto según tipo.
- **Ningún proveedor Gemini** se integra (regla de coordinación #5 y DB-19): la tabla de análisis solo acepta `OPENAI`, `RULE_ENGINE`, `MANUAL` como `fuente`.

### Criterio de aceptación — cumplido
- ✅ Salida estructurada validada contra el schema Zod; no usa Gemini.

---

## S3-07 (apoyo, responsable R) — Caché, timeout y fallback manual
P provee los eventos semilla (S3-03) como fallback: si OpenAI falla o hace timeout (>8 s), el sistema usa el último resultado cacheado o, en su ausencia, los eventos manuales cargados por el admin — la demo nunca depende de la disponibilidad de la API externa.

---

## S3-08 (apoyo, responsable D) — nota de datos
Provee a D los campos ya calculados por S3-04/S3-05 (`score`, `confianza`, `vigencia`, `eventos_relevantes` con su `fuente`) para que la pantalla de riesgo (UI-32) los muestre sin lógica adicional en el frontend.

---

## S3-09 · Viajes — Implementar estados del viaje y timeline
**Prioridad:** Alta · **Apoyo:** D · **Dependencia:** S2-13 · **Entregable:** Feature

### Estados del viaje (alineados a la máquina de S0-08)
`asignado → en_recojo → en_transito → entregado → cerrado`, más rama `incidencia` si `riesgo_ruta.score` supera un umbral (p. ej. 70) mientras el viaje está `en_transito`.

### Timeline
Cada transición registra: timestamp, actor que la ejecutó, y (si aplica) el evento de riesgo que causó una `incidencia`. Ambas partes (productor/comprador y transportista) ven el mismo timeline en tiempo real.

### Criterio de aceptación — cumplido
- ✅ El transportista actualiza el estado y todas las partes ven el timeline actualizado.
