# Prompt maestro para Figma Make
## Plataforma inteligente de marketplace rural, negociación y logística

Crea una aplicación web responsive, completa y navegable para una plataforma peruana que conecta productores rurales, compradores y transportistas. La solución integra marketplace, negociación comercial, contratación de transporte, sugerencia de precios y análisis de riesgo territorial.

No utilices una plantilla SaaS genérica. El resultado debe verse como un producto tecnológico premium, original y listo para presentarse en una hackathon, con una identidad visual inspirada sutilmente en el territorio andino, las rutas, la agricultura y las redes de conexión, sin caer en folclorismos, caricaturas ni exceso de elementos decorativos.

---

# 1. Objetivo del prototipo

Diseñar todas las pantallas necesarias para demostrar este flujo:

1. Un productor publica un producto.
2. La plataforma muestra un rango orientativo de precio.
3. Un comprador explora el marketplace.
4. El comprador utiliza una negociación rápida o conversacional.
5. Se genera un match y una orden comercial.
6. Se elige la modalidad logística.
7. Si se necesita transporte, transportistas o empresas presentan ofertas.
8. Se compara precio, vehículo, tiempo y riesgo.
9. Se selecciona una propuesta.
10. Se registra recojo, viaje y entrega.
11. La plataforma muestra riesgo, confianza, vigencia y explicación.
12. El administrador puede gestionar eventos, precios y usuarios.

---

# 2. Dirección visual

## Concepto

Combinar visualmente:

- producción rural;
- rutas y movimiento;
- conexiones entre actores;
- inteligencia y datos;
- confianza comercial;
- tecnología accesible.

## Personalidad

- moderna;
- minimalista;
- humana;
- profesional;
- confiable;
- territorial;
- tecnológica;
- clara;
- distinta de un ecommerce urbano tradicional.

## Evitar

- gradientes excesivos;
- apariencia de banca o fintech genérica;
- ilustraciones infantiles;
- iconos agrícolas caricaturescos;
- sobrecarga de verdes;
- tarjetas idénticas en todas las páginas;
- fotografías falsas generadas con personas deformes;
- interfaces oscuras difíciles de leer;
- mapas como simple decoración;
- precios presentados como obligatorios;
- etiquetar al productor como “riesgoso”.

---

# 3. Identidad visual

## Paleta principal

Usar una paleta sobria y premium:

- Verde profundo principal: `#0B6B4F`
- Verde bosque oscuro: `#073F32`
- Verde claro funcional: `#DDF5E9`
- Carbón: `#17212B`
- Gris texto: `#52606D`
- Fondo cálido: `#F7F6F1`
- Blanco: `#FFFFFF`
- Arena: `#E7DFC8`
- Ámbar de alerta: `#E99B22`
- Rojo de riesgo crítico: `#C94A4A`
- Azul informativo: `#3676B8`

No utilizar todos los colores simultáneamente. Dar prioridad a fondos claros, verde profundo y carbón.

## Tipografía

- Títulos: `Sora` o `Manrope`
- Texto e interfaz: `Inter`
- Números importantes: Inter con `font-variant-numeric: tabular-nums`

## Forma

- Radios de 16 a 24 px en paneles principales.
- Botones de 12 a 14 px de radio.
- Líneas limpias de 1 px.
- Sombras muy sutiles.
- Uso intencional de espacios negativos.
- Algunos paneles asimétricos para evitar una apariencia repetitiva.
- Mapas y fotografías pueden romper ligeramente la cuadrícula.

---

# 4. Logo e iconografía personalizada mediante scripts

No uses logos prefabricados ni marcas registradas.

Construye un isotipo original mediante SVG programático con estas ideas:

- una ruta curva o sendero;
- dos nodos conectados;
- una hoja abstracta;
- una forma base hexagonal o territorial;
- el símbolo debe funcionar a 24 px y a 512 px;
- no incluir texto dentro del isotipo.

Genera el logo como componente SVG editable, usando `path`, `circle` y `line`, sin imágenes rasterizadas.

Crear variantes:

1. Logo principal verde y carbón.
2. Logo monocromático.
3. Logo blanco para fondos oscuros.
4. App icon cuadrado.
5. Favicon simplificado.

Crear también iconos SVG propios para las categorías:

- papa;
- fibra de alpaca;
- quinua;
- cebolla;
- trucha;
- transporte;
- ruta;
- riesgo;
- oferta;
- negociación.

Los iconos deben compartir grosor, esquinas y proporciones. No copiar logos comerciales.

---

# 5. Fotografías reales

Usar fotografías reales y documentales, no renders 3D.

Temas visuales:

- productor de papa en el altiplano;
- familia alpaquera y fibra clasificada;
- sacos de quinua;
- camión en carretera andina;
- camioneta rural;
- mercados de Arequipa o Juliaca;
- rutas altoandinas;
- centros de acopio;
- manos pesando o clasificando productos;
- conductor revisando una carga.

Las fotografías deben representar diversidad real, vestimenta cotidiana y contexto peruano. Evitar imágenes estereotipadas.

Usar imágenes con encuadres horizontales y verticales, luz natural y colores sobrios. Aplicar overlays suaves solo cuando sea necesario para legibilidad.

Si se requieren URLs de demostración, utilizar imágenes públicas con consultas equivalentes a:

- “Peru highlands potato farmer”
- “alpaca fiber producer Peru”
- “rural truck Andes Peru”
- “Arequipa wholesale market”
- “Puno rural road”
- “quinoa farmer Peru”

Agregar siempre `alt text` descriptivo.

---

# 6. Sistema de componentes

Crear una página o frame denominado **Design System** con:

## Botones

- Primario.
- Secundario.
- Ghost.
- Destructivo.
- Con icono.
- Estado loading.
- Estado disabled.

## Campos

- Texto.
- Número y moneda.
- Cantidad y unidad.
- Selector.
- Autocomplete.
- Fecha.
- Ubicación.
- Carga de imagen.
- Textarea.
- Campo de precio con controles `−5 %`, referencia y `+5 %`.

## Badges

- Producto.
- Calidad.
- Negociación rápida.
- Negociación conversacional.
- Oferta parcial.
- Múltiples productores.
- Transporte requerido.
- Verificado.
- Riesgo bajo, medio, alto y crítico.
- Confianza de información.
- Actualización temporal.

## Tarjetas

- Product card.
- Purchase request card.
- Freight request card.
- Transporter bid card.
- Proposal card.
- Risk event card.
- Vehicle card.
- Order summary card.
- KPI card.

## Otros

- Stepper.
- Timeline.
- Tabs.
- Drawer móvil.
- Modal.
- Sheet lateral.
- Toast.
- Skeleton.
- Empty state.
- Error state.
- Offline state.
- Tabla.
- Filtros.
- Barra de búsqueda.
- Mapa.
- Chat.
- Comparador.

Todos los componentes deben tener variantes desktop y móvil.

---

# 7. Navegación general

## Desktop

Sidebar compacta con:

- Inicio.
- Marketplace.
- Requerimientos.
- Negociaciones.
- Órdenes.
- Transporte.
- Viajes.
- Mensajes.
- Notificaciones.
- Perfil.

En la parte inferior:

- Rol activo.
- Cambiar rol.
- Ayuda.
- Configuración.

## Móvil

Bottom navigation con máximo cinco elementos:

- Inicio.
- Explorar.
- Publicar.
- Mensajes.
- Perfil.

Las funciones secundarias se muestran en un menú o drawer.

---

# 8. Pantallas completas

Diseña todas las siguientes pantallas y sus estados.

## A. Marketing y acceso

### 1. Landing page

Secciones:

- Hero con fotografía real y mensaje principal.
- Buscador rápido de productos.
- Tres actores conectados: productor, comprador y transportista.
- Explicación de las dos negociaciones.
- Visual de riesgo territorial.
- Beneficios.
- Flujo en cuatro pasos.
- Productos destacados.
- Rutas recientes.
- Testimonios de demostración claramente identificados.
- CTA final.
- Footer.

Mensaje principal sugerido:

> Encuentra el producto, negocia el precio y organiza el transporte con información actualizada sobre costos y riesgos.

### 2. Inicio de sesión

- correo o teléfono;
- contraseña;
- recuperación;
- acceso de demostración por rol.

### 3. Registro

- nombre;
- teléfono;
- correo;
- contraseña;
- aceptación de términos.

### 4. Selección de rol

Tarjetas:

- Soy productor.
- Soy comprador.
- Soy transportista.
- Represento una organización.

Permitir múltiples roles.

---

## B. Onboarding

### 5. Onboarding del productor

Stepper:

1. Identidad.
2. Ubicación aproximada.
3. Productos.
4. Capacidad.
5. Preferencias de negociación.
6. Verificación.

### 6. Onboarding del comprador

1. Tipo de comprador.
2. Empresa u organización.
3. Productos buscados.
4. Destinos.
5. Frecuencia de compra.
6. Facturación futura, marcada como próxima función.

### 7. Onboarding del transportista

1. Identidad.
2. Tipo de operación.
3. Vehículo.
4. Capacidad.
5. Rutas frecuentes.
6. Documentos declarados.
7. Disponibilidad de carga de retorno.

### 8. Verificación del perfil

- porcentaje completado;
- documentos;
- estado;
- explicación de los niveles.

---

## C. Inicio por rol

### 9. Dashboard del productor

- ventas potenciales;
- ofertas recibidas;
- productos activos;
- negociaciones;
- pedidos próximos;
- alertas de acceso;
- CTA para publicar.

### 10. Dashboard del comprador

- requerimientos activos;
- propuestas recibidas;
- órdenes;
- gasto estimado;
- alertas de ruta;
- proveedores guardados.

### 11. Dashboard del transportista

- cargas cercanas;
- ofertas enviadas;
- viajes programados;
- retorno disponible;
- ingresos estimados;
- alertas de corredor.

---

## D. Marketplace

### 12. Marketplace — vista de cuadrícula

Header:

- buscador;
- ubicación;
- categorías;
- filtros;
- ordenar;
- alternar cuadrícula/mapa.

Cards con:

- fotografía real;
- producto;
- variedad;
- ubicación aproximada;
- cantidad;
- rango sugerido;
- modo de negociación;
- riesgo;
- confianza;
- actualización;
- productor;
- verificación.

No mostrar un precio fijo como obligatorio.

### 13. Marketplace — vista de mapa

- mapa a la derecha;
- resultados a la izquierda;
- clusters;
- filtros;
- eventos de riesgo;
- leyenda.

### 14. Detalle de producto

- galería;
- datos del producto;
- calidad;
- cantidad;
- productor;
- ubicación aproximada;
- rango sugerido;
- explicación del rango;
- riesgo de acceso;
- opciones de negociación;
- transporte estimado;
- productos similares.

CTA principales:

- Oferta rápida.
- Conversar y negociar.

### 15. Detalle de requerimiento

- comprador;
- producto requerido;
- volumen;
- calidad;
- plazo;
- destino;
- precio inicial;
- acepta oferta parcial;
- acepta varios productores;
- postular.

### 16. Publicar producto

Stepper:

1. Producto.
2. Calidad y atributos.
3. Cantidad.
4. Fotografías.
5. Ubicación.
6. Negociación.
7. Logística.
8. Vista previa.

En negociación:

- habilitar negociación rápida;
- mínimo privado;
- negociación conversacional;
- tiempo máximo;
- texto claro indicando que el mínimo no será visible.

### 17. Publicar requerimiento

Stepper:

1. Producto.
2. Cantidad.
3. Calidad.
4. Precio inicial.
5. Fecha.
6. Destino.
7. Aceptación parcial o múltiple.
8. Logística.
9. Vista previa.

---

## E. Negociación rápida

### 18. Modal de oferta rápida

Mostrar:

- producto;
- cantidad;
- rango sugerido;
- precio central;
- input de precio;
- botones `−5 %`, `Usar referencia`, `+5 %`;
- subtotal;
- advertencia de transporte no incluido;
- intentos disponibles;
- CTA.

### 19. Oferta no aceptada

No indicar cuánto falta.

Mostrar:

- “La propuesta no fue aceptada”.
- Intentos restantes.
- Opción de mejorar.
- Opción de pasar a conversación.
- Opción de cerrar.

### 20. Oferta aceptada

- animación discreta;
- precio acordado;
- cantidad reservada;
- temporizador de reserva;
- siguiente paso: logística.

---

## F. Negociación conversacional

### 21. Bandeja de conversaciones

- foto o logo;
- producto;
- último mensaje;
- propuesta activa;
- tiempo restante;
- filtros.

### 22. Sala de negociación

Dos columnas en desktop:

- chat;
- resumen comercial persistente.

En móvil:

- chat;
- sheet para resumen.

Elementos:

- mensajes;
- imágenes;
- documentos;
- eventos de sistema;
- propuesta activa;
- indicador de lectura;
- temporizador.

### 23. Crear propuesta estructurada

Campos:

- cantidad;
- precio;
- fecha;
- calidad;
- logística;
- vigencia;
- observaciones.

### 24. Comparar propuesta y contraoferta

Mostrar diferencias:

- precio;
- cantidad;
- fecha;
- entrega;
- calidad.

### 25. Match conversacional confirmado

- resumen;
- partes;
- siguiente paso;
- orden creada.

---

## G. Selección de productores y orden

### 26. Selección de múltiples productores

Para requerimientos grandes:

- propuestas recibidas;
- cantidad por productor;
- suma acumulada;
- costo total;
- cobertura faltante;
- riesgo;
- distancia;
- selector.

### 27. Resumen de orden

- comprador;
- uno o varios productores;
- cantidades;
- precio;
- subtotal;
- logística pendiente;
- estado;
- timeline.

### 28. Detalle de orden

Tabs:

- resumen;
- productores;
- logística;
- evidencias;
- incidencias;
- historial.

---

## H. Logística

### 29. Seleccionar modalidad logística

Tres tarjetas grandes:

- Recoge el comprador.
- Entrega el productor.
- Buscar transporte.

Agregar explicación, costo estimado y responsabilidad.

### 30. Crear solicitud de transporte

- puntos de recojo;
- destino;
- peso;
- volumen;
- paquetes;
- fecha;
- vehículo sugerido;
- tarifa inicial;
- riesgo;
- ayudante;
- carga/descarga.

### 31. Marketplace de cargas

Cards con:

- origen;
- destino;
- distancia;
- carga;
- peso;
- tarifa sugerida;
- fecha;
- vehículo recomendado;
- riesgo;
- retorno disponible.

### 32. Detalle de solicitud de transporte

- mapa;
- ruta;
- paradas;
- carga;
- tarifa inicial;
- rango sugerido;
- riesgo;
- confianza;
- vigencia;
- CTA para ofertar.

### 33. Enviar oferta de flete

- tarifa;
- vehículo;
- salida;
- duración;
- servicios;
- contraoferta;
- condiciones.

### 34. Comparar ofertas de transportistas

Tabla o cards comparables:

- tarifa;
- tipo de transportista;
- vehículo;
- capacidad;
- salida;
- duración;
- seguro declarado;
- experiencia;
- riesgo adaptado;
- servicios;
- CTA seleccionar.

### 35. Perfil de transportista o empresa

- fotografía/logo;
- verificación;
- vehículos;
- rutas;
- operaciones;
- cumplimiento;
- documentos declarados;
- reseñas de demostración.

### 36. Detalle de vehículo

- fotografías;
- tipo;
- carrocería;
- capacidad;
- cobertura;
- refrigeración;
- 4x4;
- documentos;
- disponibilidad.

---

## I. Riesgo, ruta y viaje

### 37. Detalle de riesgo

No utilizar solo un número.

Mostrar:

- riesgo 0–100;
- nivel;
- confianza;
- última actualización;
- explicación;
- factores;
- fuentes;
- eventos cercanos;
- ruta alternativa;
- retraso;
- costo adicional.

### 38. Mapa de ruta

- origen;
- múltiples recojos;
- destino;
- ruta principal;
- alternativa;
- eventos;
- leyenda;
- distancia;
- duración.

### 39. Seguimiento del viaje

- timeline;
- mapa;
- conductor;
- vehículo;
- carga;
- paradas;
- estado;
- contacto;
- riesgos activos;
- evidencia.

### 40. Registrar recojo

- peso;
- paquetes;
- fotografías;
- estado;
- firma o confirmación;
- observaciones.

### 41. Registrar entrega

- peso final;
- cantidad aceptada;
- cantidad observada;
- fotografías;
- motivo;
- confirmación.

### 42. Reportar incidencia

Tipos:

- retraso;
- vía bloqueada;
- avería;
- diferencia de peso;
- daño;
- rechazo;
- otro.

---

## J. Perfil y actividad

### 43. Perfil público del productor

- imagen;
- ubicación aproximada;
- productos;
- verificación;
- historial;
- tiempos de respuesta;
- ofertas.

### 44. Perfil público del comprador

- empresa;
- requerimientos;
- pagos declarados;
- frecuencia;
- historial.

### 45. Perfil del transportista

- especialidad;
- flota;
- rutas;
- disponibilidad.

### 46. Favoritos y guardados

- productos;
- requerimientos;
- productores;
- transportistas.

### 47. Notificaciones

Categorías:

- negociación;
- orden;
- transporte;
- riesgo;
- sistema.

### 48. Configuración

- cuenta;
- roles;
- privacidad;
- notificaciones;
- idioma;
- seguridad;
- cerrar sesión.

---

## K. Suscripción y monetización

### 49. Planes para comprador

- Gratuito.
- Profesional.
- Empresarial.

No utilizar dark patterns.

### 50. Créditos para transportistas

- saldo;
- paquetes;
- qué desbloquean;
- regla de devolución;
- historial.

Marcar como función de próxima fase cuando sea necesario.

### 51. Publicidad especializada

Crear un componente discreto y etiquetado como “Patrocinado”.

---

## L. Administración

### 52. Dashboard administrativo

- usuarios;
- publicaciones;
- negociaciones;
- órdenes;
- envíos;
- eventos;
- precio;
- incidencias.

### 53. Gestión de eventos de riesgo

- tabla;
- mapa;
- crear evento;
- confirmar;
- resolver;
- fuente;
- confianza.

### 54. Crear o editar evento

- tipo;
- lugar;
- radio;
- severidad;
- confianza;
- inicio;
- fin;
- fuente;
- evidencia.

### 55. Observaciones de precios

- importar CSV;
- registrar observación;
- producto;
- variedad;
- mercado;
- región;
- fecha;
- precios;
- fuente.

### 56. Verificación de usuarios

- cola;
- documentos;
- estado;
- notas;
- aprobar/rechazar.

### 57. Moderación

- publicaciones reportadas;
- motivos;
- historial;
- acción.

### 58. Analítica

- matches;
- tiempo de negociación;
- precios acordados;
- transporte;
- riesgo;
- retorno vacío;
- productos;
- regiones.

---

# 9. Estados obligatorios

Diseñar variantes para:

- loading;
- skeleton;
- vacío;
- error;
- sin conexión;
- información desactualizada;
- riesgo crítico;
- publicación pausada;
- reserva vencida;
- negociación vencida;
- oferta retirada;
- stock insuficiente;
- sin transportistas;
- ruta no disponible;
- permiso denegado;
- datos simulados.

---

# 10. Microinteracciones

- Animación breve al realizar match.
- Actualización suave de rango de precio.
- Badge de riesgo que cambia sin movimiento brusco.
- Timeline progresiva.
- Hover informativo sobre confianza.
- Skeleton realista.
- Confirmación antes de acciones irreversibles.
- Feedback inmediato al enviar oferta.
- Contador de reserva.
- Estado de escritura en chat.
- Marcador que se expande en mapa.

No utilizar animaciones decorativas lentas.

---

# 11. Accesibilidad

- Contraste WCAG AA.
- Tamaño mínimo 16 px en inputs móviles.
- Áreas táctiles de 44 px.
- Navegación por teclado.
- Focus visible.
- No depender únicamente del color.
- Etiquetas para lectores de pantalla.
- Alt text.
- Estados de error descriptivos.
- No mostrar coordenadas exactas antes del match.

---

# 12. Responsive

Diseñar en:

- Desktop: 1440 px.
- Tablet: 1024 px.
- Móvil: 390 px.

Las pantallas críticas deben tener versión móvil:

- marketplace;
- detalle;
- oferta rápida;
- chat;
- orden;
- transporte;
- riesgo;
- viaje.

---

# 13. Contenido de demostración

Usar datos coherentes, no lorem ipsum.

## Productos

- Papa Canchán.
- Papa Imilla.
- Fibra de alpaca.
- Quinua blanca.
- Cebolla.
- Trucha.

## Lugares

- Acora.
- Ilave.
- Mazocruz.
- Juli.
- Juliaca.
- Puno.
- Arequipa.

## Vehículos

- Pickup.
- Camioneta 4x4.
- Camión ligero.
- Camión de 8 toneladas.
- Camión de 12 toneladas.
- Furgón cubierto.

## Riesgos

- tránsito restringido;
- protesta anunciada;
- lluvia intensa;
- trocha con barro;
- accidente;
- ruta despejada.

---

# 14. Resultado esperado

Genera:

1. Design System completo.
2. Todas las pantallas enumeradas.
3. Prototipo navegable.
4. Componentes reutilizables.
5. Versiones desktop y móvil.
6. Datos realistas.
7. SVGs originales.
8. Fotografías reales.
9. Estados vacíos, error y loading.
10. Anotaciones breves para handoff de desarrollo.

El producto final debe sentirse como una plataforma peruana nueva y ambiciosa, no como una copia literal de inDrive, Airbnb o un marketplace existente. Se pueden tomar referencias de sus patrones de negociación y conversación, pero la identidad, navegación, componentes y experiencia deben ser originales.
