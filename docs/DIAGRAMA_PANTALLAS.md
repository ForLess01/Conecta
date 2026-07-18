# Conecta — Diagrama completo de pantallas por rol

> Diagrama maestro de navegación y contenido. Cada nodo lista el contenido de la pantalla y sus botones/CTAs. Leyenda de acceso: 🌱 Productor · 🛒 Comprador · 🚚 Transportista · 🛡 Admin · 🌐 Público.

```mermaid
flowchart TD

%% ============================================================
%% A. MARKETING Y ACCESO — 🌐 Público
%% ============================================================
subgraph ACCESO["A. MARKETING Y ACCESO 🌐"]
    S01["1. LANDING
    ─ Contenido ─
    Hero con foto real altiplano + mensaje principal
    Buscador rápido de productos
    3 actores conectados: productor, comprador, transportista
    Explicación de negociación rápida vs conversacional
    Visual de riesgo territorial con mapa
    Beneficios + flujo en 4 pasos
    Productos destacados + rutas recientes
    Testimonios marcados como demo
    Footer con enlaces
    ─ Botones ─
    Comenzar ahora · Explorar marketplace
    Iniciar sesión · Registrarse · Buscar"]

    S02["2. INICIAR SESIÓN
    ─ Contenido ─
    Campo correo o teléfono
    Campo contraseña
    Enlace recuperar contraseña
    Bloque acceso demo por rol
    ─ Botones ─
    Ingresar
    Demo Productor · Demo Comprador
    Demo Transportista · Demo Admin
    Ir a registro"]

    S03["3. REGISTRO
    ─ Contenido ─
    Nombre completo · Teléfono
    Correo · Contraseña
    Checkbox términos y condiciones
    ─ Botones ─
    Crear cuenta · Ya tengo cuenta"]
end

%% ============================================================
%% B. ONBOARDING — según rol elegido
%% ============================================================
subgraph ONBOARD["B. ONBOARDING"]
    S04["4. SELECCIÓN DE ROL 🌐
    ─ Contenido ─
    4 tarjetas grandes con icono y descripción:
    Soy productor · Soy comprador
    Soy transportista · Represento una organización
    Nota: se permiten múltiples roles
    ─ Botones ─
    Seleccionar tarjeta o varias · Continuar"]

    S05["5. ONBOARDING PRODUCTOR 🌱
    ─ Stepper 6 pasos ─
    1 Identidad: nombre, foto, teléfono
    2 Ubicación aproximada: mapa + distrito, provincia, región
    3 Productos que ofrece: selector de catálogo
    4 Capacidad productiva: cantidad y unidad
    5 Preferencias de negociación: rápida sí/no, ventana horas
    6 Verificación: documentos declarados
    ─ Botones ─
    Atrás · Siguiente · Omitir paso · Finalizar"]

    S06["6. ONBOARDING COMPRADOR 🛒
    ─ Stepper 6 pasos ─
    1 Tipo de comprador: restaurante, acopiador, transformador
    2 Empresa u organización: RUC opcional
    3 Productos buscados
    4 Destinos de entrega con mapa
    5 Frecuencia de compra
    6 Facturación: marcada como próxima función
    ─ Botones ─
    Atrás · Siguiente · Finalizar"]

    S07["7. ONBOARDING TRANSPORTISTA 🚚
    ─ Stepper 7 pasos ─
    1 Identidad · 2 Tipo de operación: independiente o empresa
    3 Vehículo: tipo, placa, carrocería
    4 Capacidad: kg y m3
    5 Rutas frecuentes
    6 Documentos declarados
    7 Disponibilidad de carga de retorno
    ─ Botones ─
    Atrás · Siguiente · Agregar otro vehículo · Finalizar"]

    S08["8. VERIFICACIÓN DE PERFIL 🌱🛒🚚
    ─ Contenido ─
    Barra de porcentaje completado
    Lista de documentos y su estado
    Explicación de niveles de verificación
    ─ Botones ─
    Subir documento · Completar perfil · Ir al inicio"]
end

%% ============================================================
%% C. DASHBOARDS POR ROL
%% ============================================================
subgraph DASH["C. INICIO POR ROL"]
    S09["9. DASHBOARD PRODUCTOR 🌱
    ─ Contenido ─
    KPI ventas potenciales · KPI ofertas recibidas
    Productos activos con estado
    Negociaciones en curso con temporizador
    Pedidos próximos a despachar
    Alertas de acceso a su zona con riesgo y vigencia
    ─ Botones ─
    Publicar producto · Ver ofertas
    Abrir negociación · Ver alertas"]

    S10["10. DASHBOARD COMPRADOR 🛒
    ─ Contenido ─
    Requerimientos activos · Propuestas recibidas
    Órdenes en curso con estado
    Gasto estimado del mes
    Alertas de ruta hacia sus destinos
    Proveedores guardados
    ─ Botones ─
    Explorar marketplace · Publicar requerimiento
    Ver propuestas · Ver órdenes"]

    S11["11. DASHBOARD TRANSPORTISTA 🚚
    ─ Contenido ─
    Cargas cercanas a su ubicación
    Ofertas enviadas y su estado
    Viajes programados con fecha
    Retorno disponible sugerido
    Ingresos estimados
    Alertas de corredor con riesgo
    ─ Botones ─
    Ver cargas · Mis ofertas · Mis viajes
    Registrar vehículo · Activar retorno"]
end

%% ============================================================
%% D. MARKETPLACE
%% ============================================================
subgraph MKT["D. MARKETPLACE"]
    S12["12. MARKETPLACE GRID 🌱🛒🚚🛡
    ─ Header ─
    Buscador · Selector de ubicación · Chips de categoría
    Filtros: precio, cantidad, calidad, riesgo, modo negociación
    Ordenar por · Toggle cuadrícula/mapa
    ─ Card de producto ─
    Foto real · Producto y variedad · Ubicación aproximada
    Cantidad disponible · Rango sugerido nunca precio fijo
    Badge modo negociación · Badge riesgo con nivel
    Badge confianza % · Vigencia de actualización
    Nombre del productor + verificación
    ─ Botones ─
    Abrir producto · Guardar · Filtrar · Cambiar a mapa"]

    S13["13. MARKETPLACE MAPA 🌱🛒🚚🛡
    ─ Contenido ─
    Lista de resultados a la izquierda
    Mapa Mapbox a la derecha con clusters
    Marcadores de eventos de riesgo
    Leyenda de niveles de riesgo
    Filtros persistentes
    ─ Botones ─
    Expandir marcador · Abrir producto
    Volver a cuadrícula · Aplicar filtros"]

    S14["14. DETALLE DE PRODUCTO 🛒 principal
    ─ Contenido ─
    Galería de fotos · Producto, variedad, descripción
    Calidad y atributos · Cantidad disponible y mínimo
    Card del productor con verificación y respuesta
    Ubicación aproximada en mini-mapa
    Rango sugerido: bajo, central, alto
    Explicación del rango + confianza + fecha base
    Desglose: origen + transporte + contingencia = destino
    Riesgo de acceso: puntaje, nivel, motivo, vigencia
    Transporte estimado · Productos similares
    ─ Botones ─
    OFERTA RÁPIDA · CONVERSAR Y NEGOCIAR
    Guardar · Compartir · Ver perfil productor · Ver riesgo"]

    S15["15. DETALLE DE REQUERIMIENTO 🌱 postula
    ─ Contenido ─
    Comprador y verificación · Producto requerido
    Volumen total · Calidad exigida · Plazo de entrega
    Destino con mapa · Precio inicial referencial
    Badge acepta oferta parcial
    Badge acepta múltiples productores
    Propuestas ya recibidas: cantidad cubierta
    ─ Botones ─
    POSTULAR CON PROPUESTA · Conversar
    Guardar · Ver perfil comprador"]

    S16["16. PUBLICAR PRODUCTO 🌱
    ─ Stepper 8 pasos ─
    1 Producto: catálogo + variedad
    2 Calidad y atributos dinámicos
    3 Cantidad, unidad, pedido mínimo
    4 Fotografías con carga múltiple
    5 Ubicación aproximada
    6 Negociación: toggle rápida, MÍNIMO PRIVADO
      con texto: nunca será visible al comprador,
      toggle conversacional, ventana 12/24/48/72 h
    7 Logística: entrega propia sí/no
    8 Vista previa de la card
    ─ Botones ─
    Atrás · Siguiente · Guardar borrador · PUBLICAR"]

    S17["17. PUBLICAR REQUERIMIENTO 🛒
    ─ Stepper 9 pasos ─
    1 Producto · 2 Cantidad y unidad · 3 Calidad
    4 Precio inicial opcional · 5 Fecha límite
    6 Destino con mapa
    7 Acepta parcial / múltiples productores
    8 Logística preferida
    9 Vista previa
    ─ Botones ─
    Atrás · Siguiente · Guardar borrador · PUBLICAR"]
end

%% ============================================================
%% E. NEGOCIACIÓN RÁPIDA — 🛒 inicia, 🌱 configura
%% ============================================================
subgraph QUICK["E. NEGOCIACIÓN RÁPIDA"]
    S18["18. MODAL OFERTA RÁPIDA 🛒
    ─ Contenido ─
    Producto y foto · Cantidad seleccionable
    Rango sugerido S/ bajo – alto · Referencia central
    Input de precio por unidad
    Subtotal calculado en vivo
    Advertencia: transporte no incluido
    Intentos disponibles: n de 3
    ─ Botones ─
    Menos 5% · Usar referencia · Más 5%
    Ingresar otro monto · ENVIAR OFERTA RÁPIDA · Cancelar"]

    S19["19. OFERTA NO ACEPTADA 🛒
    ─ Contenido ─
    Mensaje: la propuesta no fue aceptada
    NUNCA muestra cuánto faltó ni el mínimo
    Intentos restantes
    ─ Botones ─
    Mejorar oferta · Pasar a conversación · Cerrar"]

    S20["20. OFERTA ACEPTADA — MATCH 🛒🌱
    ─ Contenido ─
    Animación discreta de éxito
    Precio acordado · Cantidad reservada
    Temporizador de reserva 15 min
    Resumen de la operación
    ─ Botones ─
    CONTINUAR A LOGÍSTICA · Ver orden"]
end

%% ============================================================
%% F. NEGOCIACIÓN CONVERSACIONAL — 🛒🌱
%% ============================================================
subgraph CONV["F. NEGOCIACIÓN CONVERSACIONAL"]
    S21["21. BANDEJA DE CONVERSACIONES 🛒🌱
    ─ Por conversación ─
    Foto/logo contraparte · Producto negociado
    Último mensaje · Badge propuesta activa
    Tiempo restante de la ventana
    Filtros: activas, con propuesta, vencidas
    ─ Botones ─
    Abrir sala · Filtrar · Buscar"]

    S22["22. SALA DE NEGOCIACIÓN 🛒🌱
    ─ Desktop 2 columnas ─
    Izq: chat con mensajes, imágenes, documentos,
    eventos de sistema, indicador de lectura,
    estado escribiendo, temporizador de ventana
    Der: resumen comercial persistente con
    propuesta activa y datos del producto
    ─ Móvil: chat + sheet de resumen ─
    ─ Botones ─
    Enviar mensaje · Adjuntar imagen · Adjuntar documento
    CREAR PROPUESTA · Aceptar propuesta activa
    Contraofertar · Rechazar · Solicitar muestra"]

    S23["23. CREAR PROPUESTA ESTRUCTURADA 🛒🌱
    ─ Campos ─
    Cantidad y unidad · Precio por unidad
    Fecha de entrega · Términos de calidad
    Modalidad logística · Vigencia de la propuesta
    Observaciones
    ─ Botones ─
    ENVIAR PROPUESTA · Cancelar"]

    S24["24. COMPARAR PROPUESTA VS CONTRAOFERTA 🛒🌱
    ─ Contenido ─
    Tabla lado a lado con diferencias resaltadas:
    precio · cantidad · fecha · entrega · calidad
    ─ Botones ─
    Aceptar esta · Contraofertar · Volver al chat"]

    S25["25. MATCH CONVERSACIONAL CONFIRMADO 🛒🌱
    ─ Contenido ─
    Resumen del acuerdo · Partes involucradas
    Orden creada con número
    Siguiente paso: logística
    ─ Botones ─
    CONTINUAR A LOGÍSTICA · Ver orden"]
end

%% ============================================================
%% G. PRODUCTORES MÚLTIPLES Y ORDEN
%% ============================================================
subgraph ORDER["G. SELECCIÓN DE PRODUCTORES Y ORDEN"]
    S26["26. SELECCIÓN MÚLTIPLES PRODUCTORES 🛒
    ─ Contenido ─
    Propuestas recibidas por productor:
    cantidad, precio, distancia, riesgo de acceso
    Suma acumulada vs requerido
    Cobertura faltante visual
    Costo total combinado
    ─ Botones ─
    Seleccionar propuesta · Quitar
    Combinar y crear orden · Esperar más ofertas"]

    S27["27. RESUMEN DE ORDEN 🛒🌱
    ─ Contenido ─
    Comprador · Productores con aportes
    Cantidades y precios por productor
    Subtotales y total comercial
    Estado actual · Logística pendiente
    Timeline de la operación
    ─ Botones ─
    SELECCIONAR LOGÍSTICA · Ver detalle completo"]

    S28["28. DETALLE DE ORDEN 🛒🌱🛡
    ─ Tabs ─
    Resumen: partes, montos, estado
    Productores: aportes y estados
    Logística: modalidad, envío, transportista
    Evidencias: fotos de despacho y recepción
    Incidencias: reportes y resolución
    Historial: timeline completo de estados
    ─ Botones ─
    Confirmar despacho · Confirmar recepción
    Reportar incidencia · Contactar contraparte"]
end

%% ============================================================
%% H. LOGÍSTICA
%% ============================================================
subgraph LOGI["H. LOGÍSTICA"]
    S29["29. SELECCIONAR MODALIDAD LOGÍSTICA 🛒🌱
    ─ 3 tarjetas grandes ─
    RECOGE EL COMPRADOR: vehículo propio,
    responsabilidad del comprador, costo cero plataforma
    ENTREGA EL PRODUCTOR: precio con entrega,
    fecha estimada, vehículo del productor
    BUSCAR TRANSPORTE: solicitud a marketplace,
    tarifa sugerida, ofertas de transportistas
    Cada tarjeta: explicación + costo estimado + responsable
    ─ Botones ─
    Elegir modalidad · Continuar"]

    S30["30. CREAR SOLICITUD DE TRANSPORTE 🛒🌱
    ─ Campos ─
    Puntos de recojo uno o varios · Destino
    Peso kg · Volumen m3 · Número de bultos
    Fecha requerida · Vehículo sugerido por sistema
    Tarifa inicial sugerida editable
    Riesgo de ruta previo · Ayudante requerido
    Responsable de carga y descarga
    ─ Botones ─
    PUBLICAR SOLICITUD · Guardar borrador · Cancelar"]

    S31["31. MARKETPLACE DE CARGAS 🚚
    ─ Card por carga ─
    Origen → destino · Distancia km
    Descripción de carga · Peso
    Tarifa sugerida S/ · Fecha
    Vehículo recomendado · Badge riesgo de ruta
    Badge retorno disponible
    Filtros: cerca de mí, fecha, vehículo, tarifa
    ─ Botones ─
    Ver detalle · OFERTAR · Filtrar"]

    S32["32. DETALLE SOLICITUD DE TRANSPORTE 🚚
    ─ Contenido ─
    Mapa con ruta completa y paradas
    Detalle de carga: producto, peso, volumen, bultos
    Tarifa inicial + rango sugerido
    Riesgo de ruta: puntaje, nivel, confianza, vigencia
    Motivo del riesgo y eventos activos
    ─ Botones ─
    ENVIAR OFERTA DE FLETE · Ver riesgo completo · Volver"]

    S33["33. ENVIAR OFERTA DE FLETE 🚚
    ─ Campos ─
    Tarifa propuesta · Vehículo de mi flota selector
    Fecha y hora de salida · Duración estimada
    Servicios incluidos: ayudante, cobertura
    Condiciones adicionales
    Nota: máximo una contraoferta
    ─ Botones ─
    ENVIAR OFERTA · Cancelar"]

    S34["34. COMPARAR OFERTAS DE FLETE 🛒🌱
    ─ Tabla comparativa por transportista ─
    Tarifa S/ · Tipo: independiente o empresa
    Vehículo y capacidad · Fecha de salida
    Duración estimada · Seguro declarado
    Experiencia simulada · Riesgo adaptado al vehículo
    Servicios incluidos
    ─ Botones ─
    SELECCIONAR TRANSPORTISTA · Ver perfil
    Contraofertar · Rechazar"]

    S35["35. PERFIL TRANSPORTISTA/EMPRESA 🛒🌱🛡
    ─ Contenido ─
    Foto o logo · Nivel de verificación
    Flota de vehículos · Rutas frecuentes
    Operaciones completadas · Cumplimiento %
    Documentos declarados · Reseñas de demostración
    ─ Botones ─
    Ver vehículo · Contactar · Seleccionar"]

    S36["36. DETALLE DE VEHÍCULO 🚚 dueño 🛡
    ─ Contenido ─
    Fotografías · Tipo y carrocería
    Capacidad kg y m3 · Cobertura: abierto/cerrado
    Refrigeración sí/no · 4x4 sí/no
    Documentos declarados · Disponibilidad
    ─ Botones ─
    Editar · Cambiar disponibilidad · Eliminar"]
end

%% ============================================================
%% I. RIESGO, RUTA Y VIAJE
%% ============================================================
subgraph RISK["I. RIESGO, RUTA Y VIAJE"]
    S37["37. DETALLE DE RIESGO 🌱🛒🚚🛡
    ─ Contenido: nunca solo un número ─
    Riesgo 0-100 con gauge · Nivel semáforo
    Confianza de información % separada
    Última actualización relativa
    Explicación en lenguaje claro
    Factores: eventos, acceso, clima, operativo
    Fuentes citadas con enlace
    Eventos cercanos a la ruta con severidad
    Ruta alternativa disponible sí/no
    Retraso estimado · Costo adicional estimado S/
    ─ Botones ─
    Ver en mapa · Actualizar análisis · Reportar estado de vía"]

    S38["38. MAPA DE RUTA 🌱🛒🚚🛡
    ─ Contenido ─
    Origen · Recojos múltiples numerados · Destino
    Ruta principal trazada · Ruta alternativa punteada
    Marcadores de eventos con severidad por color
    Leyenda de riesgo · Distancia total · Duración estimada
    ─ Botones ─
    Alternar ruta · Ver evento · Cerrar"]

    S39["39. SEGUIMIENTO DEL VIAJE 🚚 actualiza 🛒🌱 ven
    ─ Contenido ─
    Timeline de estados: programado, recojo,
    en tránsito, demorado, entregado
    Mapa con ruta · Datos del conductor y vehículo
    Carga transportada · Paradas completadas
    Riesgos activos en la ruta · Evidencias subidas
    ─ Botones ─
    ACTUALIZAR ESTADO solo transportista
    Contactar conductor · Reportar incidencia
    Registrar recojo · Registrar entrega"]

    S40["40. REGISTRAR RECOJO 🚚🌱
    ─ Campos ─
    Peso cargado · Número de bultos
    Fotografías de la carga
    Estado de la mercadería
    Confirmación de las partes
    Observaciones
    ─ Botones ─
    CONFIRMAR RECOJO · Cancelar"]

    S41["41. REGISTRAR ENTREGA 🚚🛒
    ─ Campos ─
    Peso final · Cantidad aceptada
    Cantidad observada con motivo
    Fotografías de recepción
    Confirmación del receptor
    ─ Botones ─
    CONFIRMAR ENTREGA · Registrar observación"]

    S42["42. REPORTAR INCIDENCIA 🚚🌱🛒
    ─ Tipos ─
    Retraso · Vía bloqueada · Avería
    Diferencia de peso · Daño · Rechazo · Otro
    ─ Campos ─
    Descripción · Fotografías · Ubicación
    ─ Botones ─
    ENVIAR REPORTE · Cancelar"]
end

%% ============================================================
%% J. PERFIL Y ACTIVIDAD
%% ============================================================
subgraph PROFILE["J. PERFIL Y ACTIVIDAD"]
    S43["43. PERFIL PÚBLICO PRODUCTOR 🌐
    ─ Contenido ─
    Imagen · Ubicación aproximada nunca exacta
    Productos activos · Nivel de verificación
    Historial de operaciones · Tiempo de respuesta
    Ofertas vigentes
    ─ Botones ─
    Ver producto · Conversar · Guardar productor"]

    S44["44. PERFIL PÚBLICO COMPRADOR 🌐
    ─ Contenido ─
    Empresa u organización · Requerimientos activos
    Pagos declarados · Frecuencia de compra · Historial
    ─ Botones ─
    Ver requerimiento · Postular · Guardar"]

    S45["45. PERFIL PÚBLICO TRANSPORTISTA 🌐
    ─ Contenido ─
    Especialidad · Flota resumida
    Rutas frecuentes · Disponibilidad
    ─ Botones ─
    Ver flota · Contactar"]

    S46["46. FAVORITOS Y GUARDADOS 🌱🛒🚚
    ─ Tabs ─
    Productos · Requerimientos
    Productores · Transportistas
    ─ Botones ─
    Abrir · Quitar de guardados"]

    S47["47. NOTIFICACIONES 🌱🛒🚚🛡
    ─ Categorías con filtro ─
    Negociación: ofertas, propuestas, vencimientos
    Orden: cambios de estado
    Transporte: ofertas de flete, asignación
    Riesgo: alertas de ruta y zona
    Sistema
    ─ Botones ─
    Marcar leída · Marcar todas · Abrir origen"]

    S48["48. CONFIGURACIÓN 🌱🛒🚚🛡
    ─ Secciones ─
    Cuenta: datos, foto · Roles: activar, cambiar
    Privacidad: visibilidad de ubicación
    Notificaciones por categoría
    Idioma: español, quechua y aimara futuros
    Seguridad: contraseña
    ─ Botones ─
    Guardar cambios · CERRAR SESIÓN"]
end

%% ============================================================
%% K. MONETIZACIÓN — próxima fase
%% ============================================================
subgraph MONEY["K. SUSCRIPCIÓN Y MONETIZACIÓN — próxima fase"]
    S49["49. PLANES COMPRADOR 🛒
    ─ 3 tarjetas sin dark patterns ─
    Gratuito: funciones base
    Profesional: filtros avanzados, alertas
    Empresarial: multi-usuario, analítica
    ─ Botones ─
    Elegir plan deshabilitado + badge próxima fase"]

    S50["50. CRÉDITOS TRANSPORTISTA 🚚
    ─ Contenido ─
    Saldo actual · Paquetes de créditos
    Qué desbloquea cada uno · Regla de devolución
    Historial de consumo
    ─ Botones ─
    Comprar deshabilitado + badge próxima fase"]

    S51["51. PUBLICIDAD PATROCINADA 🌐
    Componente discreto etiquetado Patrocinado
    dentro del marketplace, nunca invasivo"]
end

%% ============================================================
%% L. ADMINISTRACIÓN — 🛡
%% ============================================================
subgraph ADMIN["L. ADMINISTRACIÓN 🛡"]
    S52["52. DASHBOARD ADMIN
    ─ KPIs ─
    Usuarios por rol · Publicaciones activas
    Negociaciones en curso · Órdenes por estado
    Envíos activos · Eventos de riesgo vigentes
    Cobertura de precios · Incidencias abiertas
    ─ Botones ─
    Ir a cada módulo · ACTUALIZAR RIESGOS con IA"]

    S53["53. GESTIÓN DE EVENTOS DE RIESGO
    ─ Contenido ─
    Tabla de eventos: tipo, lugar, severidad,
    confianza, fuente, estado, vigencia
    Mapa con todos los eventos
    ─ Botones ─
    CREAR EVENTO · Confirmar · Resolver
    Editar · Ejecutar análisis IA Gemini"]

    S54["54. CREAR/EDITAR EVENTO DE RIESGO
    ─ Campos ─
    Tipo: bloqueo, protesta, lluvia, accidente,
    vía restringida, puente dañado
    Ubicación con mapa · Radio afectado km
    Severidad 1-5 · Confianza de fuente
    Inicio y fin estimado · Fuente y URLs
    Evidencia fotográfica
    ─ Botones ─
    GUARDAR EVENTO · Cancelar"]

    S55["55. OBSERVACIONES DE PRECIOS
    ─ Contenido ─
    Tabla de observaciones por producto
    Formulario: producto, variedad, mercado,
    región, fecha, precio bajo/medio/alto,
    unidad, calidad, fuente
    ─ Botones ─
    IMPORTAR CSV · Registrar observación
    Editar · Eliminar"]

    S56["56. VERIFICACIÓN DE USUARIOS
    ─ Contenido ─
    Cola de solicitudes pendientes
    Documentos presentados · Estado · Notas internas
    ─ Botones ─
    APROBAR · RECHAZAR con motivo · Pedir más datos"]

    S57["57. MODERACIÓN
    ─ Contenido ─
    Publicaciones reportadas con motivo
    Historial del usuario reportado
    ─ Botones ─
    Pausar publicación · Eliminar · Descartar reporte"]

    S58["58. ANALÍTICA
    ─ Gráficos ─
    Matches por día · Tiempo medio de negociación
    Precios acordados vs sugeridos · Uso de transporte
    Riesgo promedio por corredor · Retorno vacío
    Productos top · Regiones activas
    ─ Botones ─
    Filtrar rango · Exportar"]
end

%% ============================================================
%% NAVEGACIÓN
%% ============================================================
S01 --> S02
S01 --> S03
S02 --> S04
S03 --> S04
S04 -->|productor| S05
S04 -->|comprador| S06
S04 -->|transportista| S07
S05 --> S08
S06 --> S08
S07 --> S08
S08 -->|rol productor| S09
S08 -->|rol comprador| S10
S08 -->|rol transportista| S11
S02 -->|demo admin| S52

S09 -->|publicar| S16
S09 -->|negociaciones| S21
S09 -->|requerimientos| S15
S10 -->|explorar| S12
S10 -->|publicar requerimiento| S17
S10 -->|propuestas| S26
S11 -->|cargas| S31
S11 -->|vehículos| S36
S11 -->|viajes| S39

S12 <-->|toggle| S13
S12 --> S14
S12 --> S15
S16 -->|publicado| S12
S17 -->|publicado| S12

S14 -->|oferta rápida| S18
S14 -->|conversar| S22
S15 -->|postular| S23
S14 -->|ver riesgo| S37

S18 -->|precio bajo mínimo| S19
S18 -->|precio alcanza mínimo| S20
S19 -->|mejorar| S18
S19 -->|conversar| S22
S20 --> S29

S21 --> S22
S22 --> S23
S23 --> S24
S24 -->|acepta| S25
S24 -->|contraoferta| S23
S25 --> S29

S26 --> S27
S27 --> S28
S27 --> S29

S29 -->|recoge comprador| S28
S29 -->|entrega productor| S28
S29 -->|buscar transporte| S30
S30 -->|publicada| S31
S31 --> S32
S32 --> S33
S32 --> S37
S33 -->|ofertas recibidas| S34
S34 -->|ver perfil| S35
S35 --> S36
S34 -->|seleccionado| S39

S37 --> S38
S39 --> S40
S39 --> S41
S39 --> S42
S40 --> S39
S41 -->|entrega confirmada| S28

S12 -->|productor| S43
S15 -->|comprador| S44
S34 -->|transportista| S45

S52 --> S53
S53 --> S54
S52 --> S55
S52 --> S56
S52 --> S57
S52 --> S58

%% Estilos por rol
classDef publico fill:#F7F6F1,stroke:#52606D,color:#17212B
classDef productor fill:#DDF5E9,stroke:#0B6B4F,color:#073F32
classDef comprador fill:#E8F0FA,stroke:#3676B8,color:#17212B
classDef transportista fill:#FDF3E3,stroke:#E99B22,color:#17212B
classDef admin fill:#FBEAEA,stroke:#C94A4A,color:#17212B
classDef compartida fill:#FFFFFF,stroke:#17212B,color:#17212B

class S01,S02,S03,S04,S43,S44,S45,S51 publico
class S05,S09,S16 productor
class S06,S10,S17,S18,S19,S26,S49 comprador
class S07,S11,S31,S32,S33,S36,S50 transportista
class S52,S53,S54,S55,S56,S57,S58 admin
class S08,S12,S13,S14,S15,S20,S21,S22,S23,S24,S25,S27,S28,S29,S30,S34,S35,S37,S38,S39,S40,S41,S42,S46,S47,S48 compartida
```

---

## Estados transversales obligatorios

Toda pantalla con datos debe diseñar sus variantes: **loading/skeleton · vacío · error · sin conexión · información desactualizada · riesgo crítico · publicación pausada · reserva vencida · negociación vencida · oferta retirada · stock insuficiente · sin transportistas · ruta no disponible · permiso denegado · banner de datos simulados**.

## Reglas de producto no negociables en UI

1. El precio sugerido es orientativo: nunca se presenta como obligatorio ni bloquea ofertas fuera del rango.
2. El mínimo privado del productor jamás se muestra, ni cuánto faltó para alcanzarlo.
3. El riesgo se etiqueta como "riesgo actual de acceso y transporte", nunca "productor riesgoso".
4. Riesgo, confianza y vigencia siempre se muestran como tres indicadores separados.
5. No se muestran coordenadas exactas antes del match.
6. Todo dato simulado se marca como demostración.
