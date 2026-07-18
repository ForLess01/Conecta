# Conecta — Demo Data Plan

> Usuarios semilla y flujos de demostración para la hackathon. Sirve de insumo para el seed reproducible (S1-14) y la carga de escenarios (S4-03).

---

## 1. Usuarios semilla

Contraseña demo compartida: `Demo2026!` (solo para el entorno de demo, nunca en producción).

| Rol | Nombre | Email | Ubicación |
|---|---|---|---|
| Productor 1 | Papa — Acora | productor1@conecta.demo | Acora, Puno |
| Productor 2 | Asociación alpaquera | productor2@conecta.demo | Mazocruz, Puno |
| Productor 3 | Quinua — Juli | productor3@conecta.demo | Juli, Puno |
| Comprador 1 | Restaurante | comprador1@conecta.demo | Arequipa |
| Comprador 2 | Acopiador | comprador2@conecta.demo | Juliaca |
| Transportista 1 | Camioneta 4x4 | transportista1@conecta.demo | — |
| Transportista 2 | Camión 8 t | transportista2@conecta.demo | — |
| Transportista 3 | Empresa camión 12 t | transportista3@conecta.demo | — |
| Admin | Admin demo | admin@conecta.demo | — |

---

## 2. Flujo 1 — principal (negociación rápida)

- Producto: papa, publicado por Productor 1.
- Referencia: S/ 1.30/kg. Mínimo privado: S/ 1.20/kg.
- Comprador 1 ofrece S/ 1.24/kg → match automático.
- Se solicita transporte; los 3 transportistas ofertan.
- Se selecciona uno.
- Riesgo alto simulado por evento en ruta; se muestra alternativa y costo adicional.
- Entrega confirmada con evidencias (fotos, peso).

## 3. Flujo 2 — secundario (negociación conversacional)

- Producto: fibra de alpaca, publicado por Productor 2.
- Calidad requiere conversación; se usa negociación conversacional (no rápida).
- Se intercambian fotografías y una tarjeta de propuesta estructurada.
- Comprador 2 acepta la propuesta → se crea la orden.
- Entrega mediante movilidad propia del productor (sin subasta de flete).

---

## 4. Cobertura de aceptación (S0-11)

- [x] 3 productores.
- [x] 2 compradores.
- [x] 3 transportistas.
- [x] 2 flujos (principal y secundario).
