# Roadmap de implementaciones de Lizto

> **Status:** Propuesto · **Owner:** Mateo y Joaco · **Última revisión:** 2026-10-20 · **Fuente de verdad:** Para esta propuesta; el comportamiento se verifica en el código.

> **En 30 segundos.** Primero alinear decisiones y contratos, corregir operaciones inseguras y disponer de un entorno reproducible. Después completar acceso y onboarding, Agenda, cierre y pago, y finalmente Urgencia. La meta es una beta acotada con trabajos reales completados. Este documento conserva el contexto de la conversación; no autoriza implementar todas las etapas ni declara tareas verificadas.

## Cómo retomar este trabajo

**Criterio acordado con Mateo (2026-10-11):** este contexto fue elaborado principalmente con la IA de su compañero. Ningún informe, tarjeta, roadmap ni recomendación se considera incuestionable. Evaluar coherencia, evidencia, eficiencia y eficacia; distinguir hechos comprobados, propuestas y decisiones humanas. Si aparece una inconsistencia o una alternativa mejor, explicar el problema, su impacto y las opciones al equipo para resolverlo en conjunto. El código sirve para comprobar qué ocurre hoy, pero su existencia no demuestra que el diseño sea correcto. No sustituir decisiones abiertas por supuestos ni cambiar unilateralmente el negocio o el alcance.

1. Leer este documento y el `AGENTS.md` del repositorio donde se vaya a trabajar.
2. Consultar `lizto-engineering/COMO-TRABAJAMOS.md`, reglas de negocio y bitácora.
3. Revisar la tarjeta correspondiente en Trello, los cambios locales y el código actual del repositorio. Los estados registrados aquí son una fotografía, no una consulta en vivo.
4. Elegir un alcance concreto por ronda, identificar dependencias y comprobar criterios de aceptación.
5. Registrar evidencia y pendientes al cerrar la ronda; no confundir implementación con validación en dispositivo o entorno desplegado.

## Fuentes y repositorios

- [Lizto Development en Trello](https://trello.com/b/C8KEjcAM/lizto-development): se leyeron 14 listas, 186 tarjetas, incluidas 10 archivadas, y 25 checklists. No se modificó el tablero.
- [lizto-api](https://github.com/joaccco/lizto-api): backend Laravel; último commit consultado de `main`, 22-09-2026.
- [lizto](https://github.com/joaccco/lizto): frontend Next.js. El paquete y la documentación lo llaman `lizto-web`; la carpeta local es `../lizto`. Último commit consultado de `main`, 13-09-2026 en Argentina.
- [lizto-app](https://github.com/joaccco/lizto-app): mobile Expo para cliente y profesional; último commit consultado de `main`, 15-09-2026.
- [lizto-engineering](https://github.com/joaccco/lizto-engineering): guía compartida. Se leyó la copia local `../lizto-engineering`; la conexión de GitHub devolvió 404, por lo que no se verificó su estado remoto.
- [Auditoría y primera entrega de correcciones](AUDITORIA-2026-10-07.md).
- [Roadmap móvil anterior](MOBILE_ROADMAP.md): referencia histórica de paridad, contrastar con código y este contexto.

Guía local: `../lizto-engineering/01-product/business-rules.md`, `02-architecture/mobile.md`, `04-workflow/trello-workflow.md`, `09-roadmap/current-state.md` y `09-roadmap/technical-roadmap.md`.

## Punto de partida y límites

**Responsabilidades confirmadas por Mateo (2026-10-11):** Mateo y este agente se encargan de desarrollar la app React Native y la integración con `lizto-api`. Su compañero sigue desarrollando la API y la web. Este roadmap es una vista compartida de dependencias, no una asignación de todo el sistema a Mateo.

Para cada etapa, separar la entrega móvil que podemos implementar del soporte de API que debe coordinarse con el compañero. Un requerimiento de backend debe indicar problema, contrato propuesto, permisos, estados y errores relevantes, criterios de aceptación y entrega bloqueada. Contrastar la propuesta con la API real antes de integrar; no inventar endpoints ni simular su existencia. Las tareas móviles independientes pueden avanzar mientras se resuelven dependencias. No enviar mensajes al compañero ni modificar sus repositorios sin autorización específica.

**Arquitectura confirmada por Mateo (2026-10-11):** toda la experiencia de la app se construye en React Native, con Expo, y consume `lizto-api`. Esto aplica a los dos roles y a los recorridos completos: acceso, onboarding, solicitudes, ofertas, chat, seguimiento, cierre y pago. La API conserva lógica de negocio, permisos y persistencia. La web existente es una referencia funcional; no sustituye entregas móviles ni pruebas en dispositivo. Esta aclaración no autoriza eliminar o migrar la web, ni modifica el alcance de administración sin una decisión específica.

Las etapas siguientes se orientan a entregas **React Native + API**. Cuando una tarjeta de Trello alcance únicamente API/web, su implementación móvil necesita especificación propia y contratos reales; no se da por cubierta por la tarjeta existente.

| Área | Responsable | Cómo se coordina |
|---|---|---|
| App React Native, navegación, estado local, UX y rendimiento móvil | Mateo + este agente | Implementación y validación en este repositorio |
| Consumo de API, esquemas, errores, caché y recorridos integrados | Mateo + este agente | Contratos comprobados y validación contra API real |
| API, reglas de negocio, autorización, persistencia y servicios externos del servidor | Compañero de Mateo | Requerimientos y dependencias explícitos; implementación en lizto-api |
| Web | Compañero de Mateo | Referencia funcional y coordinación de contratos compartidos |
| Decisiones de producto y cambios de contrato entre aplicaciones | Equipo | Señalar impacto y alternativas; acordar antes de implementar cambios dependientes |

Las correcciones prioritarias de mobile están locales, sin commit ni publicación al momento de esta revisión: URLs, privacidad, almacenamiento seguro, horarios, importes, caché, preguntas y presentación. Se reportaron TypeScript sin errores, 80 tests, Expo Doctor 21/21 y exportación del bundle Android. **No se compiló ni ejecutó un build de desarrollo Android**; faltaba SDK/JDK. Tampoco se probó ese recorrido contra una API real.

Actualización 2026-10-20: resolución central del rol implementada, preferencia por cuenta y cambio rápido de vista. Descartar permanece deshabilitado; el endpoint API ya rechaza la tarjeta propia sin cancelar globalmente, pero falta su integración nativa en una entrega propia. Confirmación directa sigue bloqueada por autoadjudicación/precio inventado. Falta lectura recuperable de oferta propia y persiste la deuda de precios decimales. Ver estado vigente en etapa 1.

No modificar `lizto-api` desde este repositorio. Las etapas que involucren API o web se trabajan por separado en sus repositorios. No inventar endpoints, datos, precios ni configuración comercial. No agregar pantallas o dependencias sin alcance justificado.

## Criterio transversal — Rapidez y eficiencia

**Prioridad acordada con Mateo (2026-10-11):** el sistema debe responder rápido en general. Este criterio atraviesa todas las etapas y se evalúa durante cada implementación, no como una limpieza al final.

- Medir tiempos de inicio, navegación, carga, búsqueda y acciones críticas; distinguir espera de red, procesamiento de API y trabajo de interfaz.
- En mobile, cuidar fluidez, memoria, red y batería en dispositivos modestos y conexiones lentas. Revisar listas, renders, imágenes y comportamiento en segundo plano.
- Evitar solicitudes duplicadas y transferencias innecesarias; usar TanStack Query como dueño del estado remoto, con caché, invalidación y paginación acordes al contrato. Revisar la frecuencia y necesidad del polling.
- En API, investigar consultas repetidas o N+1, índices, tamaños de respuesta y tareas que puedan salir del camino de respuesta. Los cambios se realizan en su repositorio y se justifican con medición.
- Definir objetivos medibles por recorrido a partir de una línea de base; no inventar umbrales ni afirmar mejoras sin evidencia. Verificar también errores, concurrencia y consistencia de datos.
- Reportar cuellos de botella y alternativas al equipo. La velocidad no justifica debilitar seguridad, privacidad o corrección, ni incorporar complejidad sin un beneficio comprobable.

## Etapa 1 — Alinear alcance, decisiones y contratos

Entrega iniciada el 2026-10-11: [alcance, contratos revisados y requerimientos de integración](ETAPA-1-ALCANCE-Y-CONTRATOS.md). El inventario se revisó contra API `db4f1e6`; beta confirmada con ambos roles, Agenda/Urgencia y Android/iOS. M1/M2 están implementadas en código y M3 en validación. Contratos B1–B8 definidos como requerimientos con responsable y aceptación, pendientes de ratificar con API. El estado vigente y los límites están en el documento enlazado; no se declara la etapa cerrada.

**Implementaciones y acuerdos:** definir los recorridos y plataformas nativas de la beta de la app; asignar responsables; actualizar tarjetas contradictorias; documentar contratos reales de identificadores, paginación, importes, estados y permisos. Resolver vinculación con Google, facturación y precio en Urgencia antes de implementar las partes dependientes.

**Por qué:** Trello contiene referencias a Flutter, propuestas de comisión incompatibles con las reglas vigentes y tareas listas que aún tienen dependencias. Programar sobre esas diferencias genera alcance inventado y retrabajo.

**Salida comprobable:** cada tarea próxima tiene dueño, resultado esperado, contrato y bloqueantes explícitos. Las decisiones abiertas quedan identificadas, sin resolverlas mediante código.

## Etapa 2 — Corregir operaciones que alteran permisos o consentimiento

**Implementaciones:** disponibilidad profesional con petición correcta y fallo visible; rechazo individual separado de cancelación global; impedir autoadjudicación en Agenda y eliminar precios inventados; revisar autorización de detalle y privacidad; resolver el rol una sola vez en mobile, con preferencia asociada al usuario; aplicar las decisiones de revocación de identidad y sanciones.

**Por qué:** estos errores pueden asignar trabajos sin consentimiento, cancelar pedidos ajenos o afirmar una disponibilidad falsa. Contaminan cualquier recorrido posterior.

**Evidencia existente:** [la web usa PUT y availability_status, y actualiza también en el catch](https://github.com/joaccco/lizto/blob/936aaa65e2af807066c38b45efb48c6813546a82/src/app/provider/page.tsx); [confirmación conserva un precio de 15.000 y decline transiciona a Cancelled](https://github.com/joaccco/lizto-api/blob/131d9c734044cbb256b2d0f6306372f5a6ef05ad/app/Http/Controllers/Api/V1/Provider/ProviderDashboardController.php).

**Salida comprobable:** cada actor puede realizar solo las acciones autorizadas; rechazar una oportunidad no cancela el pedido del cliente; los errores no simulan éxito. Pruebas de regresión con cambios realistas que las hagan fallar.

## Etapa 3 — Entorno compartido y reproducible

**Implementaciones:** staging de API con base, colas y almacenamiento; CI de API y mobile; monitoreo, health checks y backups con restauración probada; ambientes separados; build de desarrollo Android reproducible y preparación de iOS según alcance de beta. El despliegue web se trata por separado si el equipo lo requiere.

**Por qué:** un entorno compartido permite validar entre dos personas y detectar regresiones antes de integrar. Un bundle o HTTP simulado no demuestra funcionamiento nativo contra la API.

**Dependencias:** cuentas, credenciales y decisiones de infraestructura. Puede avanzar en paralelo con la etapa 2, en alcances separados.

**Salida comprobable:** despliegue reproducible, controles automáticos y restauración demostrada; app instalada y funcionando en Android con la API del ambiente.

## Etapa 4 — Acceso y habilitación profesional

Recuperación (2026-10-21): app/API implementadas y SMTP local validado mediante Mailpit; ver [contrato](PASSWORD-RECOVERY-CONTRATO.md). Mateo confirmó en iPhone código de seis dígitos, verificación previa, espera de reenvío e ingreso automático. Correo externo y Android siguen pendientes.

Avance OAuth (2026-10-21): Google y Facebook cuentan con contrato implementado en API `7b16507` e integración React Native de ingreso/vinculación. Ver [contrato y evidencia](OAUTH-MOBILE-CONTRATO.md). La autorización completa con proveedor en dispositivo sigue pendiente; Apple requiere membresía paga. Esto no completa recuperación de contraseña, verificación de correo ni habilitación profesional.

**Implementaciones:** acceso en React Native con soporte de API: Google, recuperación y verificación de correo con vinculación segura; registro y onboarding; perfil, rubros, horarios y disponibilidad; Didit con inicio, retorno a la app, estado y recuperación de errores; webhook real en Sandbox. Verificar los contratos y la configuración nativa antes de implementar cada integración.

**Por qué:** un profesional debe registrarse, quedar habilitado y recuperar acceso sin asistencia. Google verifica una cuenta de correo; Didit sigue siendo la autoridad de identidad profesional.

**Dependencias:** política de vinculación, proyecto OAuth, correo real y Sandbox. [La tarjeta de acceso actual](https://trello.com/c/RIMKuvPH) cubre API/web y excluye mobile: su integración nativa necesita alcance propio. [La tarjeta mobile](https://trello.com/c/Yx9AvObY) reúne onboarding, push y ubicación; conviene dividir su ejecución en entregas verificables.

**Salida comprobable:** recorrido de registro a profesional habilitado, incluyendo rechazo y reintento, sin editar la base manualmente.

## Etapa 5 — Agenda de punta a punta

**Implementaciones:** solicitud con descripción, preguntas, ubicación, horario y confirmación; candidatos compatibles con horarios y trabajos; pedir presupuestos, recibir ofertas y aceptar una; recuperar negociación al reabrir; seguimiento y chat; notificaciones persistidas además de push.

**Por qué:** Agenda permite una beta más controlable con poca oferta y construye las piezas reutilizables por Urgencia. El estado debe sobrevivir a cierre de app, pérdida de conexión y push no entregado.

**Dependencias:** permisos y habilitación corregidos; contratos verificados para ofertas y notificaciones. Los contratos faltantes se implementan primero en API.

**Salida comprobable:** cliente y profesional concretan un trabajo de Agenda, vuelven a abrir sus sesiones y encuentran el estado correcto, sin adjudicaciones duplicadas.

## Etapa 6 — Cierre, pago y reputación

**Implementaciones:** profesional informa finalización; cliente confirma resultado e importe; efectivo con declaraciones de ambas partes y disputa ante diferencias; finalización condicionada; reseñas y reglas del chat. Después, MercadoPago con cuentas conectadas, webhook validado e idempotencia.

**Por qué:** el cierre debe funcionar antes de integrar una pasarela. El circuito en efectivo permite validar mientras se resuelven credenciales y decisiones contables. [WorkPolicy permite actualmente completar a ambos participantes](https://github.com/joaccco/lizto-api/blob/131d9c734044cbb256b2d0f6306372f5a6ef05ad/app/Policies/WorkPolicy.php).

**Dependencias:** [Ronda C](https://trello.com/c/qq4gXjzi) precede a [Ronda D](https://trello.com/c/tMrnf2fU). Disputas, cancelaciones y calificación inversa requieren alcance y soporte de API.

**Salida comprobable:** el profesional no completa unilateralmente; el cliente puede confirmar o disputar; reintentos no duplican pagos. Cargo de lanzamiento cero y configurable según reglas vigentes.

## Etapa 7 — Urgencia sobre un recorrido estable

**Implementaciones:** rondas de profesionales, temporizador, aceptación con protección de concurrencia, próxima disponibilidad real, salida a Agenda si nadie acepta y parámetros operativos desde servidor.

**Por qué:** Urgencia suma simultaneidad, vencimientos y expectativas de respuesta inmediata. Sin disponibilidad confiable y cobertura, puede dejar al cliente esperando un servicio imposible.

**Dependencias:** disponibilidad y matching corregidos; decisión de precio resuelta; cobertura mínima. Las cantidades y ventanas definidas por negocio no se queman en el código móvil.

**Salida comprobable:** un solo adjudicatario por solicitud; expiraciones y reintentos consistentes; nadie queda esperando indefinidamente cuando no hay oferta.

## Etapa 8 — Beta acotada y medición

**Implementaciones y operación:** elegir zona y rubros; asegurar oferta habilitada; publicar políticas y definir soporte; recorrer casos reales felices y adversos; probar push, permisos y ubicación en dispositivos; medir registro, verificación, oferta, adjudicación, completado, tiempos y cancelaciones.

**Por qué:** la meta es un trabajo real completado de forma repetible, con evidencia y soporte. Medir permite ampliar captación donde exista capacidad para atender. La instrumentación mínima se incorpora durante las etapas anteriores, no recién al final.

**Salida comprobable:** participantes externos completan el recorrido sin asistencia técnica y quedan registrados fallos, tiempos y feedback. La beta de Agenda puede comenzar antes de Urgencia si el equipo decide ese alcance.

## Postergar hasta tener evidencia

Reemplazo del parser por IA, búsqueda avanzada, expansión regional y nuevas funciones del asistente. Primero medir dónde falla el recorrido actual. Suscripciones y comisión del 15–20% presentes en tarjetas antiguas no se consideran decisiones vigentes: contradicen las reglas actuales de negocio.

## Registro de actualización

| Fecha | Cambio |
|---|---|
| 2026-10-11 | Mateo confirma responsabilidades: app e integración junto a este agente; API y web a cargo de su compañero. |
| 2026-10-11 | Mateo confirma React Native consumiendo lizto-api como arquitectura de toda la experiencia de la app; se orientan las etapas a mobile + API. |
| 2026-10-11 | Roadmap guardado a pedido de Mateo, a partir de auditoría mobile, guía de engineering, lectura de Trello y revisión de repositorios. Sin nuevas implementaciones, ejecución de suites ni cambios en Trello. |


### Acuerdo de beta y Urgencia · 2026-10-19

Mateo confirma que la primera beta incluye Agenda y Urgencia, cliente y profesional, Android e iOS. La secuencia por etapas es de implementación; no habilita lanzar una beta exclusiva de Agenda o Android. Ambas plataformas deben avanzar a la par. Usar `../lizto` como referencia de paridad, contrastada con su código y la API, sin reemplazar implementación ni validación nativas.

En Urgencia el profesional acepta atender y envía precio antes de comenzar; el cliente acepta el precio para confirmar el trabajo. Si lo rechaza, se retoma la búsqueda en el anillo donde quedó, luego se amplía al siguiente y se ofrece Agenda al agotar profesionales elegibles. Detalle y pendientes de contrato en [el registro de la etapa 1](ETAPA-1-ALCANCE-Y-CONTRATOS.md#decisiones-de-mateo--2026-10-19). Esta actualización resuelve el precio a nivel de producto; no demuestra soporte de API ni cierra la etapa 1.


Plazos de Urgencia acordados por Mateo el 2026-10-19: máximo de 5 minutos para que el profesional prepare y envíe presupuesto después de aceptar, y 2 minutos para que el cliente acepte el precio. Configuración y vencimientos bajo autoridad del servidor. Pausa de búsqueda y comportamiento al vencer pendientes de acuerdo; ver el registro de etapa 1.


Precisión confirmada por Mateo tras revisar engineering (2026-10-19): en Urgencia el precio inicial del cliente es opcional. Aceptarlo confirma directamente el trabajo; la propuesta de precio del profesional requiere aceptación del cliente dentro de 2 minutos. La búsqueda se pausa durante los plazos y continúa por anillos ante rechazo o vencimiento. Este acuerdo precisa los registros anteriores de confirmación del precio; los contratos siguen pendientes de verificación.


Actualización de contexto `ecc6aea` (2026-10-19): engineering reemplaza anillos fijos por grupos de 3 elegibles más cercanos, filtrados por radio de traslado del profesional. Ubicación y radio (T7) preceden al reparto (T2); consentimiento, permiso y disponibilidad gobiernan el envío de ubicación. Se mantienen los plazos y el consentimiento acordados en esta conversación; el registro detallado y las diferencias pendientes están en la etapa 1. Las menciones anteriores a anillos son históricas.


Aclaración posterior de Mateo (2026-10-19): no hay temporizador por grupo de tres; el límite total de búsqueda es configurable desde Super Admin. El primero que toma la solicitud dispone de hasta 5 minutos para presupuestar; una propuesta del profesional requiere aceptación del cliente y, ante rechazo, se continúa con los profesionales pendientes. Se conservan los 2 minutos del cliente y la confirmación directa al aceptar el precio inicial del cliente. Esta aclaración sustituye las referencias anteriores a definir una espera por grupo; queda pendiente conciliar engineering y comprobar el contrato de API.
