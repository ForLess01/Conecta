# Sprint 0 — Fundación (0–3 h)
**Responsable: P (Logística / IA / Riesgo)**

---

## S0-08 · Logística — Definir catálogo de vehículos, modalidades y estados del envío
**Prioridad:** Alta · **Apoyo:** M · **Entregable:** Logistics spec

### Catálogo de vehículos
| Tipo | Capacidad de carga | Uso típico |
|---|---|---|
| Pickup | hasta 1 t | Cargas pequeñas, corta distancia |
| 4x4 | hasta 1.5 t | Zonas rurales / trocha, altiplano |
| Camión 8 t | 8 t | Carga media, rutas provinciales |
| Camión 12 t | 12 t | Carga pesada, rutas interprovinciales |
| Furgón | hasta 2 t (volumen) | Carga que requiere protección climática (perecibles) |

### Modalidades de transporte
1. **Directo** — un solo recojo, un solo destino.
2. **Multi-recojo, un destino** — varios productores consolidan en un punto de entrega.
3. **Ruta compartida** — un transportista cubre varias solicitudes en una misma ruta (optimización de flete).

### Máquina de estados del envío (shipment)
```
CREADO
  → PUBLICADO (visible en marketplace de cargas)
  → OFERTADO (uno o más transportistas ofertaron flete)
  → ASIGNADO (oferta de flete aceptada)
  → EN_RECOJO (transportista llegó al primer punto de recojo)
  → EN_TRANSITO (todos los recojos completados, en ruta al destino)
  → ENTREGADO (evidencia de entrega registrada)
  → CERRADO (confirmado por ambas partes, sin incidencias)

Transiciones alternas:
  OFERTADO → CANCELADO (solicitante cancela antes de asignar)
  ASIGNADO → INCIDENCIA (evento de riesgo bloquea la ruta)
  INCIDENCIA → EN_TRANSITO (incidencia resuelta)
```

### Criterio de aceptación — cumplido
- ✅ Catálogo de vehículos y capacidades definido.
- ✅ 3 modalidades logísticas cubiertas (directo, multi-recojo, ruta compartida).
- ✅ Máquina de estados completa y determinística, sin estados huérfanos.

---

## S0-09 · IA/Riesgo — Definir esquema JSON de eventos y fórmula inicial de riesgo
**Prioridad:** Crítica · **Apoyo:** R · **Entregable:** Risk spec

### Schema (Zod) de evento de riesgo
```ts
import { z } from "zod";

export const RiskEventSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(["bloqueo", "protesta", "lluvia", "accidente", "ruta_libre"]),
  descripcion: z.string().max(300),
  ubicacion: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  radio_afectacion_km: z.number().min(0).max(50),
  severidad: z.number().min(0).max(1), // 0 = sin impacto, 1 = bloqueo total
  fuente: z.enum(["OPENAI", "RULE_ENGINE", "MANUAL"]), // sin GEMINI, ver DB-19
  fecha_evento: z.string().datetime(),
  fecha_expiracion: z.string().datetime(),
  confirmado: z.boolean().default(false),
});

export type RiskEvent = z.infer<typeof RiskEventSchema>;
```

### Fórmula inicial de riesgo (0–100)
Para una ruta con eventos cercanos (dentro del `radio_afectacion_km` de cada evento, calculado con Turf.js en Sprint 3):

```
riesgo_ruta = min(100, Σ (severidad_i × peso_tipo_i × factor_vigencia_i) × 100)
```

- `peso_tipo`: bloqueo = 1.0, protesta = 0.8, accidente = 0.6, lluvia = 0.4, ruta_libre = 0
- `factor_vigencia`: 1.0 si el evento está vigente (fecha_evento ≤ ahora ≤ fecha_expiracion), decae linealmente a 0 en las 6 h posteriores a la expiración.
- Confianza del score: `alta` si `confirmado = true` en ≥1 evento relevante; `media` si solo hay eventos de fuente OPENAI/RULE_ENGINE sin confirmar; `baja` si no hay eventos y el score es 0 por ausencia de datos (no por ruta segura verificada).

### Criterio de aceptación — cumplido
- ✅ Schema Zod documentado y tipado.
- ✅ Fórmula de riesgo reproducible y explicable (score + confianza + vigencia).
- ✅ Sin dependencia de Gemini (cumple regla de coordinación #5).

---

## Cuentas y variables de entorno a cargo de P (Sprint 0)
| Elemento | Estado propuesto | Nota |
|---|---|---|
| Cuenta OpenAI API project | Crear con presupuesto límite mensual y alertas de gasto | Solo Responses API |
| Cuenta Mapbox | Crear token restringido por dominio (producción + localhost) | Ver S1-13 |

**Bloqueo evitado:** ambas cuentas se crean en Sprint 0 aunque su uso productivo (OPENAI_API_KEY, NEXT_PUBLIC_MAPBOX_TOKEN) se active en Sprints 1 y 3, para no bloquear al equipo por falta de credenciales cuando lleguen esas tareas.
