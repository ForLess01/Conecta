# Sprint 4 — QA, deploy y pitch (29–36 h)
**Responsable: P (Logística / IA / Riesgo)**

---

## S4-06 · Confiabilidad — Preparar respuestas de IA cacheadas y rutas guardadas
**Prioridad:** Crítica · **Apoyo:** R · **Dependencias:** S3-07, S3-05 · **Entregable:** Fallback

### Preparación
1. **Respuestas de IA cacheadas**: se ejecuta S3-06 una vez sobre el set final de noticias/eventos de demo y se guarda el resultado como JSON estático (`/fallback/risk-events-demo.json`), usado si `OPENAI_API_KEY` falla en vivo durante el pitch.
2. **Rutas guardadas**: se pre-calculan y guardan las geometrías de ruta (Mapbox Directions) para los trayectos de la demo (p. ej. Ilave → Puno, Juli → Arequipa) como GeoJSON estático, evitando depender de la API de Mapbox en el momento del pitch.
3. Ambos fallbacks se activan automáticamente si la llamada en vivo excede el timeout definido en S3-07 (>8 s) o retorna error.

### Criterio de aceptación — cumplido
- ✅ El pitch no depende de servicios externos: toda la demo puede ejecutarse offline con datos cacheados/seed (cumple regla de coordinación #6 y mitiga RSK-05, RSK-06, RSK-14).

---

## S4-07 (apoyo, responsable R) — nota de despliegue
P confirma que `OPENAI_API_KEY` y `NEXT_PUBLIC_MAPBOX_TOKEN` están correctamente configuradas como variables de entorno de producción en Vercel antes del deploy final, y que los límites de presupuesto de OpenAI/Mapbox no bloquearán la demo en vivo.

---

## S4-10 · Presentación — Grabar video de respaldo de 90 segundos
**Prioridad:** Alta · **Apoyo:** D · **Dependencias:** S4-06, S4-08 · **Entregable:** Backup

### Guion del video (90 s)
| Tiempo | Contenido |
|---|---|
| 0–15 s | Problema: dispersión de productores del altiplano, falta de acceso justo a mercado y transporte |
| 15–35 s | Marketplace: publicación de producto, oferta rápida |
| 35–55 s | Negociación conversacional y creación de orden |
| 55–75 s | Solicitud de transporte, oferta de flete, mapa con ruta y nivel de riesgo |
| 75–90 s | Cierre: entrega confirmada, timeline completo, llamado a la acción |

Grabado con los fallbacks de S4-06 activos, para garantizar que el video no falle por dependencia de red durante la grabación. Exportado en formato `.mp4` y guardado localmente (no depende de subida a la nube para el día del pitch).

### Criterio de aceptación — cumplido
- ✅ Video exportado y disponible localmente, usable como respaldo si la demo en vivo falla.

---

## Resumen — checklist final de P
- [x] Catálogo logístico y máquina de estados de envío (S0-08)
- [x] Schema de eventos y fórmula de riesgo (S0-09)
- [x] Mapa base con Mapbox (S1-13)
- [x] Modelo de datos de logística: shipments, stops, cargo, bids (S2-10)
- [x] Solicitud de transporte automática desde orden (S2-11)
- [x] Marketplace de cargas (S2-12)
- [x] Ofertas de flete y selección de transportista (S2-13)
- [x] Precio sugerido con rango y confianza (S3-01)
- [x] Panel de eventos de riesgo (S3-03)
- [x] Cálculo de riesgo con confianza y vigencia (S3-04)
- [x] Integración de eventos con ruta vía Turf.js (S3-05)
- [x] Extracción de eventos con OpenAI Responses API (S3-06)
- [x] Estados del viaje y timeline (S3-09)
- [x] Fallbacks de IA y rutas cacheadas (S4-06)
- [x] Video de respaldo de 90 s (S4-10)
