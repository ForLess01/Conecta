# Sprint 1 — Identidad y marketplace (3–11 h)
**Responsable: P (Logística / IA / Riesgo)**

---

## S1-13 · Mapas — Configurar Mapbox y componente base de mapa
**Prioridad:** Alta · **Apoyo:** D · **Dependencia:** S0-10 (app shell) · **Entregable:** Map

### Configuración
- `NEXT_PUBLIC_MAPBOX_TOKEN`: token público con **restricción de dominio** (producción Vercel + `localhost:3000` para desarrollo), scope de solo lectura (`styles:read`, `fonts:read`, `tiles:read`).
- Estilo base: `mapbox://styles/mapbox/streets-v12` (liviano, buen contraste para overlays de riesgo).
- Librería: `react-map-gl` sobre `mapbox-gl` para integración con React/Next.js.

### Componente base (`<MapBase />`)
Responsabilidades:
1. Renderiza el mapa centrado en el altiplano puneño (lat/lng por defecto: Puno, `-15.84, -70.02`, zoom 8).
2. Acepta `markers: {lat, lng, label, type}[]` como prop — reutilizable para productos, cargas y rutas.
3. Responsive: en móvil ocupa el 100% del ancho con altura fija (`60vh`); en desktop se integra en layout de dos columnas (mapa + lista).
4. Maneja el estado `sin conexión` con fallback a una imagen estática (`mapbox-static-images API`) cacheada — enlaza con S4-06 (confiabilidad).

### Puntos de demo (coordenadas aproximadas — ver Accounts & Data)
Acora, Ilave, Mazocruz, Juli, Puno, Arequipa — cada uno con lat/lng aproximada (no exacta, por regla DB-15 de separación de ubicación pública vs. exacta).

### Criterio de aceptación — cumplido
- ✅ Mapa muestra puntos de demo (6 ubicaciones del altiplano/ruta a Arequipa).
- ✅ Funciona en móvil (probado en viewport 390 px).

---

## Datos y cuentas a cargo de P (Sprint 1)
| Elemento | Resolución |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Generado y restringido por dominio; agregado a `.env.local` y a Vercel (env de producción) |
| Ubicaciones y coordenadas aproximadas | Acora, Ilave, Mazocruz, Juli, Puno, Arequipa — jitter aleatorio de ±300 m sobre la coordenada real para no exponer ubicación exacta en el marketplace público |
| Vehículos de demostración | 1 Pickup, 1 4x4, 1 camión 8 t, 1 camión 12 t, 1 furgón — asociados a los 3 transportistas semilla definidos en S1-14 |

**Nota de coordinación:** S1-13 depende de S0-10 (app shell de R) y provee la base para S2-12/S2-13 (marketplace de cargas) y S3-05 (integración de riesgo con ruta vía Turf.js). No bloquea a D ni a M en este sprint.
