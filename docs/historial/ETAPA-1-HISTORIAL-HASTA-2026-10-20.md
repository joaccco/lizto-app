> **Histórico — reemplazado por [la etapa 1 vigente](../ETAPA-1-ALCANCE-Y-CONTRATOS.md).** Conserva decisiones y resultados en orden cronológico; sus pendientes antiguos no describen el estado actual. Los enlaces relativos originales se conservan como referencia histórica.

# Etapa 1 — Alcance, contratos y próximas entregas móviles

> **Status:** Contratos preparados; decisiones existentes referenciadas y pendientes delimitados · **Owner:** Mateo (mobile e integración); compañero de Mateo (API/web) · **Última revisión:** 2026-10-11 · **Fuente de verdad:** Para esta propuesta de trabajo; los contratos vigentes son el código.

> **En 30 segundos.** La app dispone de acceso con contraseña, catálogo, solicitudes, ofertas y chat parciales. Se documentaron los contratos consumidos y los bloqueantes antes de agregar pantallas. Engineering define ambos roles, Android/iOS y los caminos Agenda/Urgencia. Mateo confirmó el 2026-10-19 una primera beta con Agenda y Urgencia, ambos roles, Android e iOS; ver el registro de decisiones al final. El inventario original fue estático; los avances posteriores se registran al final. La política de contraseñas se actualizó en API y app el 2026-10-20. Sin cambios en web/Trello ni validación de integración en vivo.

## Base de revisión

- [Roadmap compartido](ROADMAP-IMPLEMENTACIONES.md) y [auditoría previa](AUDITORIA-2026-10-07.md).
- API local limpia al leerla, commit `131d9c734044cbb256b2d0f6306372f5a6ef05ad`; rutas, controladores, recursos y enums contrastados con los adaptadores y esquemas móviles actuales.
- Referencias de backend: [rutas](https://github.com/joaccco/lizto-api/blob/131d9c734044cbb256b2d0f6306372f5a6ef05ad/routes/api.php), [solicitudes](https://github.com/joaccco/lizto-api/blob/131d9c734044cbb256b2d0f6306372f5a6ef05ad/app/Http/Controllers/Api/V1/ServiceRequests/ServiceRequestController.php), [ofertas](https://github.com/joaccco/lizto-api/blob/131d9c734044cbb256b2d0f6306372f5a6ef05ad/app/Http/Controllers/Api/V1/Offers/OfferController.php), [chat](https://github.com/joaccco/lizto-api/blob/131d9c734044cbb256b2d0f6306372f5a6ef05ad/app/Http/Controllers/Api/V1/Conversations/ConversationController.php).
- Trello: lectura anterior de esta conversación. **No se refrescó el tablero en esta entrega**; las observaciones son propuestas para coordinar, no estados nuevos del tablero.
- No se levantaron aplicaciones, ejecutaron suites ni realizaron peticiones de negocio. Los contratos futuros de onboarding, pagos y matching requieren una revisión específica antes de implementarlos: una ruta existente no basta para afirmar que un recorrido funciona.

## Alcance y decisiones de engineering

Referencias: [reglas de negocio](../../lizto-engineering/01-product/business-rules.md), [producto](../../lizto-engineering/00-start-here/project-overview.md) y [arquitectura móvil](../../lizto-engineering/02-architecture/mobile.md). Se usan como guía de decisiones documentadas; su implementación se verifica contra código. La arquitectura móvil está marcada Draft y no prueba recorridos nativos actuales.

**Alcance documentado:** una app React Native/Expo para cliente y profesional, Android e iOS; producto con Agenda y Urgencia. No corresponde volver a consultar esos puntos como si no estuvieran definidos. **Decisión de Mateo (2026-10-19):** la primera beta incluye Agenda y Urgencia, ambos roles, Android e iOS. La secuencia interna por etapas conserva sus dependencias; ambas plataformas avanzan a la par y Urgencia es condición de salida de beta.

**Recorrido objetivo:** registro/ingreso → habilitación profesional → solicitud de cliente → oferta → aceptación del cliente → trabajo/chat → finalización informada → confirmación del cliente → registro de pago → calificación.

Es un objetivo de varias entregas, no el alcance de un solo prompt. El pago digital es opcional y el efectivo está permitido según engineering. Implementar efectivo antes de MercadoPago es una propuesta de secuencia; no implica retirar el pago digital del producto.

| Tema | Decisión documentada / pendiente real | Consecuencia para mobile |
|---|---|---|
| Caminos, roles y plataformas | Agenda y Urgencia; cliente y profesional; Android e iOS. Primera beta con ambos caminos y ambas plataformas, confirmada por Mateo el 2026-10-19 | Mantener alcance completo; distinguir orden de implementación de alcance de lanzamiento |
| Vinculación Google con cuenta local no verificada | Política no encontrada en engineering revisado; pendiente señalado en lectura anterior de Trello, no refrescada | Verificar política al abordar OAuth; no bloquea sesión actual |
| Monetización | Cliente gratis; profesional por oportunidad adjudicada; lanzamiento con cargo cero y registro del evento. Sin suscripción, monedas, deuda ni cobro por ofertar | No reabrir modelo ni construir cobro de lanzamiento; parámetros comerciales desde servidor |
| Facturación | Engineering conserva TODO: emisor del comprobante, efectos fiscales, costos de procesamiento y facturación futura de Lizto | Pendiente acotado a esas cuestiones; no equivale a modelo de monetización indefinido |
| Urgencia | Rondas y anillos según engineering; profesional acepta atender y envía precio; cliente confirma ese precio antes del trabajo; rechazo reanuda búsqueda; fallback Agenda al agotar elegibles | Precio decidido por Mateo el 2026-10-19; verificar soporte real y acordar estados, tiempos y concurrencia con API |
| Domicilio exacto | Sección «Qué ve el profesional»: revelar al adjudicar; auditor de seguridad: no enviar a profesional sin trabajo confirmado. No prohíbe al cliente ver su propio domicilio | La regla móvil general no distingue propietario de tercero: inconsistencia de redacción a resolver antes de cambiarla. Conservar protección actual y no ocultar esta diferencia |

No se considera que la ausencia de una decisión en los archivos revisados pruebe que nadie la tomó: se registra dónde falta su referencia. No se modifican las reglas de privacidad del repositorio desde esta entrega documental.

## Contratos que la app consume hoy

Todas las rutas de esta tabla son relativas a la base configurada `/api/v1`. Cada respuesta exitosa se valida con Zod. El token es Bearer; la API aplica autenticación y suspensión en rutas protegidas. La sesión nativa persiste en Secure Store; el cliente HTTP no navega.

| Método y ruta | Entrada y salida relevantes | Consumo móvil |
|---|---|---|
| POST `/auth/login` | email y password; `{data:{user,token},message}` | Pantalla de ingreso |
| POST `/auth/register` | name/email/password/password_confirmation/phone; mismo envelope, HTTP 201; asigna `client` | Adaptador disponible; pantalla pendiente |
| GET `/auth/me` | `{data:user}`; id UUID, roles, has_provider_profile, status; campos personales anulables | Perfil vía TanStack Query |
| POST `/auth/logout` | `{message}`; revoca token actual; acepta device_token para revocar dispositivo | Cuenta y cierre local; integración push futura debe coordinar revocación |
| GET `/categories` | Público; `{data:[categorías]}`; identificador slug, children opcional | Inicio/categorías |
| GET `/providers?category=…&page=…` | Público; UUID profesional; rating nullable; `{data:[],meta:{current_page,per_page,total}}` | Catálogo paginado |
| GET `/requests?page=…` | Solo solicitudes del cliente autenticado; `{data:[],meta:{current_page,per_page,total,last_page}}`; conversación nullable | Listado cliente |
| GET `/requests/{uuid}` | `{data:detalle}`; id y uuid; categoría nullable; fecha/franja y ubicación; status efectivo del trabajo si existe | Detalle profesional; revisión de autorización pendiente |
| GET `/provider/work-requests` | `{data:[]}`; id UUID; work_id/conversation_id nullable; zona con is_approximate | Bandeja; backend limita a 10, sin meta ni páginas |
| POST `/service-requests/{uuid}/offers` | pricing_mode, moneda, importe/rango, notas, inicio y duración; `{data:oferta,message}`, HTTP 201 | Oferta con precio o visita |
| POST `/offers/{offerUuid}/questions` | question_key y question_text; `{data:{id numérico,question_key,question_text},message}`, HTTP 201 | Pregunta solo tras crear oferta; ID numérico descartado en app |
| GET `/conversations/{uuid}/messages` | `{data:{contexto,messages}}`; mensaje UUID, sender_name, is_me, created_at | Historial completo con polling |
| POST `/conversations/{uuid}/messages` | `{content}`; `{data:mensaje,message}`, HTTP 201; no devuelve sender_name | Envío seguido de invalidación/lectura |

**Adaptadores que no deben habilitarse por su sola existencia:** POST `/provider/work-requests/{uuid}/confirm` y `/decline`. Confirmar conserva autoadjudicación/precio por defecto; declinar cancela toda la solicitud. La interfaz móvil tiene Descartar deshabilitado. Recuperar la oferta propia al reabrir no dispone de ruta de lectura en las rutas inspeccionadas ni de ofertas en el detalle revisado.

### Validación de acceso: diferencia encontrada

**Actualizado por decisión explícita de Mateo (2026-10-20):** registro exige en API y app **mínimo 8 caracteres, al menos una mayúscula `A–Z`, un número `0–9` y confirmación coincidente**. No exige símbolo ni minúscula. Se modificó `RegisterRequest.php` en `lizto-api` y `registerSchema` en mobile, con mensajes i18n para cada requisito. Antes de este cambio, la API exigía 10 caracteres y mobile sólo 8 y coincidencia.

Login exige contraseña no vacía, sin aplicar la política de creación: una credencial existente debe llegar al servidor para su validación. Se retiró el mínimo móvil de 6, alineándolo con `LoginRequest.php`, que exige únicamente string requerido. Nombre y teléfono conservan diferencias independientes: API tiene máximos de 255 y 50 que el esquema móvil no refleja; no se modifican en esta entrega.

**Estado:** política de contraseñas alineada en código de ambos repositorios por autorización explícita de Mateo. La pantalla de registro continúa pendiente y no se construye en esta entrega. La ejecución de pruebas de API sigue bloqueada por la versión local de PHP; ver registro del 2026-10-20.

### Identificadores y estados

- Usuarios, profesionales, solicitudes, ofertas, trabajos, conversaciones y mensajes usados aquí tienen UUID. Las categorías usan slugs. Las preguntas exponen ID numérico: no afirmar que todos los campos id son UUID.
- `RequestStatus`: pending_survey, pending_matching, matching_active, provider_selected, pending_provider, active, completed, cancelled, expired.
- `WorkStatus`: pending_confirmation, confirmed, pending_diagnosis_quote, in_progress, pending_completion, completed, disputed, cancelled, no_show.
- Los listados y detalle devuelven en `status` el estado del trabajo cuando existe, o el de solicitud. La app acepta ambos vocabularios para ese contrato actual; no deducir acciones de una supuesta máquina única. Proponer campos separados request_status/work_status como mejora de backend, aún sin contrato acordado.
- `roles` es una lista de roles reales; has_provider_profile no prueba habilitación. El servidor decide permisos y KYC. Un usuario sin client/provider requiere manejo explícito; no asignarle client silenciosamente.

### Dinero, tiempo, privacidad y errores

- `quoted`: proposed_price viaja como decimal en unidades mayores; mobile transforma a centavos en el borde y serializa texto decimal al enviar. `requires_visit`: price_min/price_max son enteros de unidad mínima según evidencia previa documentada en auditoría. Moneda explícita; no inferir unidades de un número. Backend permite cero; mobile exige proposed_price positivo: confirmar si existe oferta válida gratuita antes de cambiar esa diferencia.
- Instantes con offset explícito; created_at serializado UTC. scheduled_date/window_start/window_end son fecha y hora civil, no instantes UTC. La propuesta de inicio se convierte a instante con zona Argentina. No agregar Z a una hora local.
- is_approximate distingue zona de domicilio exacto. Mobile elimina datos exactos antes de confirmación. LocationPresenter permite al propietario cliente ver su domicilio antes; esa diferencia con la regla general requiere acuerdo explícito. La protección de UI no reemplaza permisos del servidor.
- API puede devolver message y errors en 422; 401/403/404/409/429 son posibles según endpoint y middleware. Mobile conserva cuerpo de error como unknown y expone HttpError; contratos de códigos de negocio estables, Retry-After e idempotencia requieren acuerdo. No reintentar POST automáticamente sin garantías.

## Próximas entregas de Mateo y este agente

| Orden | Entrega | Por qué / aceptación | Dependencia |
|---|---|---|---|
| M1 | Resolución central del rol y aislamiento de sesión | Sin rol inventado; una resolución en raíz; preferencia por usuario; logout/cambio de cuenta no conserva datos privados ajenos. Pruebas de usuario de un rol, doble rol y cambio de cuenta | Contrato actual de me; acordar primera selección si doble rol sin preferencia |
| M2 | Validación de acceso alineada y errores útiles | Registro refleja reglas reales; login no aplica política de alta; 422 visible; datos del formulario preservados | API actual; pantalla registro como alcance separado |
| M3 | Build Android contra ambiente compartido | Instalación y recorrido login/catálogo/listados contra API real; Secure Store y permisos en dispositivo | SDK/JDK y API accesible; coordinar ambiente con compañero |
| M4 | Onboarding/perfil/Didit por entregas pequeñas | Un cliente puede preparar perfil y seguir verificación real, incluyendo rechazo/reintento; no atribuir rol por estado local | Revisión específica de contratos; B1 |
| M5 | Solicitud de Agenda y negociación recuperable | Crear, retomar, ofertar, preguntar y aceptar sin perder estado ni duplicar acciones | B2–B4; revisión de parser/cuestionario/matching antes de construir |

M1 y M2 pueden prepararse sin esperar pagos, OAuth o Urgencia. M3 debería adelantarse respecto de pantallas adicionales para detectar pronto limitaciones nativas. Ninguna fila autoriza implementar todas las siguientes en el mismo prompt.

## Requerimientos para coordinar con el compañero

Estos son resultados esperados y propuestas de contrato, **no endpoints inventados ni mensajes enviados**.

| ID | Necesidad y evidencia | Contrato a acordar y aceptación | Entrega que bloquea |
|---|---|---|---|
| B1 | Alta/habilitación profesional: conviven provider/profile, KYC documental, onboarding/identity y become-provider | Identificar camino canónico, estados y autoridad de habilitación. Cliente inicia/retoma; rechazo visible; roles de me se actualizan desde servidor; no exigir acceso provider antes de poder obtenerlo | M4 |
| B2 | Lectura de ofertas y preguntas inexistente en contrato inspeccionado | Lectura autorizada por solicitud para cliente y profesional propio; UUID, estados, importes/unidades, horarios, preguntas/respuestas. Paginar si volumen lo exige; cero datos privados de terceros | M5 y reapertura de detalle |
| B3 | Confirmación inventa precio; decline cancela solicitud | Agenda adjudicada solo por aceptación del cliente; rechazo profesional deja solicitud disponible; sin precio inventado; concurrencia y repetición seguras | Aceptación/rechazo de Agenda |
| B4 | show no tiene Gate explícito y crea conversación desde GET con firstOrCreate | Autorizar lectura para cliente propietario/profesional elegible; rechazar ajenos; GET sin efectos de creación; conversación creada por acción de negocio correspondiente. Revisar también permisos de counter/reject/questions/answer; ausencia de Gate no equivale por sí sola a explotación probada | Detalle y negociación segura |
| B5 | Unidades monetarias mixtas y status de dos recursos mezclados | Acordar migración de contrato sin romper consumidores: importe entero + moneda; request_status/work_status diferenciados o capacidad de acciones documentada | Menor complejidad de integración y cierre |
| B6 | Chat sin límite descarga todo con get; mobile consulta cada 3 s | Lectura incremental/paginada con orden estable, límite y continuidad; POST devuelve mensaje suficiente para caché; repetición de envío con garantía acordada. Medir bytes/latencia antes y después; no adoptar WebSocket sin necesidad demostrada | Chat eficiente e historial creciente |
| B7 | Bandeja usa limit(10) sin paginación ni señal de más resultados | Páginas/cursor y orden estable; no omitir oportunidades fuera de primeras 10; payload acotado | Bandeja completa |
| B8 | Sin ruta de configuración pública, notificación persistida, recuperación, Google, pagos o disputa en rutas leídas | Dividir por función y prioridad; revisar contrato de cada una con su dueño, sin agruparlas en una dependencia gigante. Para parámetros comerciales, lectura permitida con unidades/versión; notificaciones sin datos exactos antes de confirmación | Configuración/onboarding/cierre según entrega |

Defectos adicionales observados: LocationPresenter conserva coordenadas y zona inventadas si faltan datos; listado de solicitudes inventa duración de 60 minutos; detalle conserva bio y años de experiencia de reserva. Registrar como deuda de backend y evitar presentarlos como mediciones reales. No se modificó backend.

## Ajustes de Trello propuestos, sin aplicar

- Mobile: dividir [Fase 1](https://trello.com/c/Yx9AvObY) en entregas con contrato, responsable y aceptación nativa; mantener la épica como agrupación.
- [Respaldo y rating nullable](https://trello.com/c/f2YNBmxH): distinguir el respaldo histórico ya visible en commit de septiembre de nuestras correcciones locales actuales; no cerrar por inferencia.
- Autoadjudicación y revocación: decisiones descritas en engineering no equivalen a implementación; confirmar vigencia humana y actualizar bloqueantes.
- Rondas D/F: mostrar dependencias aunque estén en Listo; no asumir que son ejecutables.
- Flutter, suscripciones y comisión 15–20%: referencias incompatibles con contexto actual; pedir revisión del equipo, sin borrarlas ni tratarlas como requerimientos.
- Propiedad de tarjetas: asignar Mateo a mobile y compañero a API/web mediante acuerdo; la lectura anterior no mostró miembros en En curso.
- Checklists en Completado: cotejar con evidencia antes de marcar; 126 ítems sin marcar no prueban 126 tareas faltantes.

## Condiciones para cerrar esta etapa

- Inventario actual y diferencias documentados: **preparado por lectura estática**.
- Responsabilidades y entregas móviles propuestas: **preparadas**, tarjetas no modificadas.
- Alcance general: **referenciado desde engineering**. Primera beta con Agenda/Urgencia en Android/iOS confirmada por Mateo el 2026-10-19; no bloquea M1.
- Nuevos contratos de API: **pendientes de acuerdo**, no se consideran disponibles.
- Validación real y medidas de rendimiento: futuras entregas; sin cifras inventadas.

No es necesario resolver facturación, OAuth y Urgencia para comenzar M1. Una etapa de alineación no debe convertirse en un bloqueo global: cada decisión bloquea solo las entregas que dependen de ella.

## Resumen de esta entrega

Documentación de integración actualizada; cero dependencias nuevas; cero código de app modificado; cero cambios en API/web/Trello. Endpoints actuales: tabla anterior. Faltantes y defectos: B1–B8 y diferencias de validación. No se ejecutaron tsc, tests, Expo Doctor ni build Android porque esta entrega es documental; no se declara cumplida la validación nativa del proyecto.

### Corrección de contexto · 2026-10-11

Se retiró la tabla que trataba todo como decisiones abiertas. Monetización, caminos, roles y plataformas ya están documentados en engineering. Facturación y precio de Urgencia siguen como TODO explícitos; Google no tiene política localizada. La privacidad documentada se refiere al acceso del profesional, mientras la regla móvil está redactada sin excepción para el propietario. No se cambiaron código, contratos de API ni reglas de privacidad.


### Decisiones de Mateo · 2026-10-19

- Primera beta: cliente y profesional, Agenda y Urgencia, Android e iOS. Avanzar por las etapas definidas, buscando paridad funcional con `../lizto` mediante revisión del código y contratos actuales; su avance no demuestra implementación nativa ni autoriza copiar defectos.
- En Urgencia el profesional ve la propuesta, acepta atenderla y envía un precio antes de empezar. El cliente debe aceptar ese precio para confirmar el trabajo.
- Si el cliente rechaza el precio, se continúa desde el anillo donde quedó la búsqueda, con profesionales elegibles todavía sin contactar. Al agotarlo se amplía al siguiente; al agotar todos se ofrece Agenda. No volver a contactar profesionales ya contactados en esa solicitud.
- Esta decisión precisa y cambia el resultado de «el primero que acepta gana»: la aceptación profesional por sí sola no confirma el trabajo. La guía compartida mantiene la formulación anterior y requiere coordinación con el responsable de API/web. No se modificaron esos repositorios ni se enviaron mensajes.
- Pendientes de contrato para este recorrido: estados de propuesta/precio/confirmación, suspensión y reanudación de rondas, vencimientos, cancelaciones y concurrencia; comprobar primero qué existe en API/web. Ninguna ruta o garantía nueva se presume disponible.
- Registro documental: sin implementación, endpoints consumidos en ejecución, dependencias nuevas ni validación nativa en esta actualización. Trello no refrescado ni modificado; la etapa permanece abierta.


### Plazos de presupuesto urgente · 2026-10-19

Mateo define un máximo de 5 minutos desde la aceptación del profesional para enviar el presupuesto, y 2 minutos para que el cliente acepte el precio. Estos plazos son parámetros de negocio que deben provenir del servidor; no se implementan como constantes móviles. El servidor debe ser autoridad de los vencimientos y exponer instantes con offset explícito para recuperar el estado al reabrir la app.

Pendiente de acuerdo: si la búsqueda queda pausada durante ambos plazos y si el vencimiento de cualquiera reanuda automáticamente la búsqueda siguiendo los anillos, igual que el rechazo del precio. También falta precisar el inicio del plazo del cliente en el contrato; no asumir recepción de push como prueba de entrega. Este registro no implementa temporizadores ni presume soporte actual de API.


### Contexto compartido actualizado · 2026-10-19

Se actualizó `../lizto-engineering` mediante pull hasta `ec9442a`. Se revisaron las nuevas reglas de Urgencia, su plan y el diseño de administración. La modificación local anterior de anillos/rondas quedó conservada en el stash `codex-context-update-2026-10-19` de ese repositorio, sin mezclarla con la nueva regla incompatible; el árbol de engineering quedó limpio.

Mateo confirma en esta conversación que la búsqueda se pausa mientras el profesional dispone de hasta 5 minutos para presupuestar y el cliente de 2 minutos para aceptar. Si vence cualquiera de los plazos, continúa automáticamente siguiendo los anillos. Esta confirmación resuelve la pausa y el vencimiento pendientes en el registro anterior; la autoridad temporal sigue en el servidor.

Diferencias a conciliar antes de implementar: engineering permite precio inicial opcional del cliente y creación inmediata del trabajo si el profesional lo acepta, una sola contraoferta, y subir el precio tras agotar anillos. Esta conversación había requerido aceptación del precio por el cliente antes de confirmar. Engineering reemplaza explícitamente las rondas de tres y propone un primer radio de 500 m, con crecimiento/esperas pendientes. No asumir equivalencia de ambos diseños ni implementación de sus contratos. Referencias: [reglas compartidas](../../lizto-engineering/01-product/business-rules.md) y [plan de Urgencia](../../lizto-engineering/09-roadmap/urgencia-con-oferta.md).

Administración se plantea en `lizto-admin`, separado de la app de usuarios; no amplía el alcance de este repositorio. Las cuentas de prueba se documentan en engineering; sus datos no se duplican aquí. La bitácora y algunos resúmenes/diagramas conservan referencias históricas a rondas de tres y validaciones antiguas: contrastar con reglas nuevas y código, sin considerarlas evidencia nativa actual.


### Conciliación del precio inicial en Urgencia · 2026-10-19

Mateo confirma el funcionamiento de engineering: el cliente puede indicar un precio inicial opcional. Si el profesional lo acepta, el trabajo se confirma directamente porque ese precio ya expresa el consentimiento del cliente. Si no hay precio inicial o el profesional propone otro, el cliente dispone de 2 minutos para aceptar la propuesta; sólo entonces se confirma el trabajo. El profesional tiene hasta 5 minutos desde que toma la solicitud para aceptar el precio inicial o enviar su única propuesta/contraoferta.

Esta precisión resuelve la diferencia de consentimiento señalada en el registro anterior: no se requiere una segunda aceptación del cliente para su propio precio. Se conserva la pausa durante la negociación y la reanudación por anillos ante rechazo o vencimiento. El cómputo y los vencimientos deben ser autoritativos en API; el inicio exacto del plazo del cliente requiere definición del contrato. No se implementan endpoints ni estados nuevos por este registro.


### Reparto actualizado desde engineering · 2026-10-19 · `ecc6aea`

Tras un nuevo pull limpio se revisaron los siete documentos modificados. La regla compartida reemplaza los anillos fijos por grupos de los 3 profesionales elegibles más cercanos, luego los 3 siguientes. No corresponde seguir definiendo crecimiento de anillos ni un primer radio de 500 m. Cada profesional configura su radio máximo de traslado, con valor inicial por rubro desde servidor; no hay un tope adicional de tiempo de viaje.

La ubicación profesional se comparte sólo mientras está disponible, con consentimiento y permiso; sin permiso no puede estar disponible para urgencias. T7 (ubicación/radio) precede a T2 (reparto). Fuera de cobertura se avisa al cliente antes de buscar y se ofrece igualmente a profesionales cuyo radio lo cubra; T8 requiere configuración de cobertura del servidor. Son requisitos de producto, no contratos comprobados ni funcionalidades implementadas.

Los acuerdos de esta conversación sobre pausa, 5 minutos para el profesional, 2 para el cliente y continuidad ante rechazo/vencimiento se conservan; la continuidad se interpreta sobre candidatos pendientes por cercanía, reemplazando la referencia histórica a anillos. Engineering todavía marca rechazo de contraoferta como abierto y no incorpora los 2 minutos del cliente: pendiente sincronizar documentación compartida, sin reabrir la decisión ya confirmada aquí.

Pendientes reales: tiempo inicial de espera de cada grupo; política cuando ningún radio profesional cubre al cliente; cantidad de relanzamientos con aumento del precio; porcentaje y cobro de visita sin acuerdo. El texto compartido dice que después de subir el precio y fracasar se pasa a Agenda, pero simultáneamente marca pendiente cuántas subidas permitir: requiere conciliación antes de implementar. No se modificaron API/web ni Trello; sin nuevas dependencias.


### Aclaración de Mateo sobre reparto y espera · 2026-10-19

No existe un tiempo de espera por grupo. Se ofrece inicialmente la solicitud a tres profesionales; el primero que toma la propuesta tiene hasta 5 minutos para decidir y enviar el presupuesto. El cliente acepta y se crea el trabajo; si rechaza, se ofrece a los profesionales pendientes. Se mantienen los 2 minutos de aceptación del cliente y la pausa/reanudación ante vencimientos ya confirmados. También se conserva la precisión previa: aceptar exactamente el precio inicial ofrecido por el cliente confirma directamente el trabajo; una propuesta distinta o sin precio inicial requiere aceptación del cliente.

El tiempo total de espera/búsqueda es una regla configurable desde el panel de Super Admin. No se ha fijado aquí un valor inicial. No inventar un temporizador por tanda ni deducirlo de los 5 minutos para presupuestar o los 2 minutos para aceptar. La app debe consumir configuración y vencimientos del servidor.

Esta aclaración sustituye la pregunta sobre espera por grupo del registro anterior. En la copia de engineering `ecc6aea`, business-rules y el plan de Urgencia todavía mencionan espera por grupo: se registra la diferencia para coordinar su corrección, sin reinterpretar esa documentación como una decisión que invalide la aclaración de Mateo. El mecanismo de avanzar cuando ninguno toma la propuesta debe verificarse y especificarse con API bajo el límite total, sin introducir plazos adicionales por iniciativa móvil.


### M1 · Implementación de roles y sesión · 2026-10-20

**Acuerdo de Mateo:** doble rol sin preferencia muestra «Contratar un servicio» y «Trabajar como profesional»; recordar por cuenta y permitir cambiar rápido de vista.

**Implementado, pendiente de validación nativa:** el layout raíz resuelve los roles vigentes de `GET /auth/me`, muestra selección inicial y controla las rutas con `Stack.Protected`. Preferencia por UUID de usuario en Secure Store; se ignora la antigua preferencia global para no asignarla a otra cuenta. Usuarios sin rol móvil válido reciben un estado explícito y salida de sesión. En ambos grupos hay un botón superior de cambio de vista para cuentas con ambos roles, con bloqueo durante guardado y error recuperable; el chat conserva la presentación determinada desde raíz, sin consultar el rol en pantalla. Login no resuelve roles. La elección no cambia permisos, KYC ni disponibilidad profesional.

Cada sesión tiene su propio QueryClient; cambiar credencial desmonta los observadores anteriores, cancela consultas y descarta caché privada. `/auth/me` acepta señal de cancelación. Una respuesta 401 tardía de una credencial anterior no elimina la nueva. El cierre local conserva la verificación de borrado de Secure Store. Cambiar sólo de vista conserva la caché de la misma cuenta y no repite `/auth/me`.

**Validación:** TypeScript sin errores; 89 tests en 16 suites, incluidos elección, cambio rápido, persistencia, fallo de guardado, cuenta sin roles, aislamiento entre cuentas y 401 tardío. Exportación de bundles Android e iOS exitosa; no equivale a compilar ni ejecutar builds de desarrollo. Expo Doctor: 17/18 controles, diferencias de parches en expo, expo-asset, expo-constants, expo-linking, expo-router, expo-splash-screen y jest-expo. Sin actualizar dependencias como parte de M1. Falta Java y `adb` no está disponible: build Android y prueba nativa de disposición visual, área segura, navegación real y Secure Store siguen pendientes. No se declara cumplida la Definition of done ni cerrada la etapa.

**Contratos y alcance:** endpoints existentes de sesión: POST `/auth/login`, GET `/auth/me`, POST `/auth/logout`; sin rutas nuevas o faltantes para M1, sin nuevos defectos de backend identificados y sin dependencias agregadas. Las pruebas de red usan respuestas controladas; sin validación contra API real en esta entrega. Sin modificaciones a API/web/Trello. Se conservaron cambios locales previos. Desvíos: validación nativa pendiente y Expo Doctor con parches desalineados.


### Política de contraseñas · 2026-10-20

A pedido explícito de Mateo se actualizó primero `lizto-api` mediante pull fast-forward, de `131d9c7` a `db4f1e6`, con árbol limpio antes de editar. Luego se cambió el mínimo de registro de 10 a 8 caracteres, conservando mayúscula, número y confirmación; mobile incorpora los requisitos faltantes y mensajes i18n. Login sólo comprueba contraseña no vacía. Esta autorización constituye una excepción puntual a la restricción de no modificar API desde el trabajo móvil; no habilita otros cambios de backend.

Se agregaron casos equivalentes en `tests/Feature/PasswordPolicyTest.php` de API y `__tests__/password-policy.test.ts` de mobile: aceptación de 8/9 caracteres, rechazo por longitud, ausencia de mayúscula o número y confirmación distinta, más login de credencial anterior. El caso existente de registro que comprobaba omisión de rol se actualizó con una contraseña válida para conservar ese propósito, sin debilitar la aserción.

API: sintaxis PHP de request y pruebas sin errores; `composer install --no-interaction --no-scripts` no pudo instalar las dependencias existentes porque el lock requiere PHP >=8.4.1 y el entorno ofrece 8.3.7. No se cambió composer.lock, no se ignoraron requisitos de plataforma y no se declara ejecutada la suite PHP. Se requiere un entorno compatible para correr `php artisan test --filter=PasswordPolicyTest` y las regresiones de autenticación.

Endpoints afectados: POST `/auth/register` (política de entrada) y POST `/auth/login` (validación local alineada, sin cambios de contrato del servidor). Sin endpoints nuevos ni faltantes para este cambio. Defecto previo resuelto: discrepancia de política de contraseñas entre API y app. Sin dependencias agregadas ni pantalla nueva. La modificación de API permanece local, sin commit/push ni despliegue. Se conservan las limitaciones de build nativo y parches de Expo documentadas en M1; no se declara cerrada la etapa.


Validación móvil de la política (2026-10-20): `npx tsc --noEmit` y `npm test -- --runInBand` pasan: 98 tests, 17 suites. Bundles de Android e iOS exportados correctamente en `/tmp/lizto-password-policy-export`; no equivalen a builds de desarrollo ejecutados en dispositivo. `git diff --check` sin errores en ambos repositorios.


### Actualización de herramientas y parches Expo · 2026-10-20

A pedido de Mateo se alinean los parches recomendados por SDK 57 en package.json/package-lock.json y la instalación: expo 57.0.27 → 57.0.30; expo-asset 57.0.19 → 57.0.20; expo-constants 57.0.21 → 57.0.22; expo-linking 57.0.12 → 57.0.13; expo-router 57.0.25 → 57.0.28; expo-splash-screen 57.0.9 → 57.0.10; jest-expo 57.0.5 → 57.0.6. No se agrega una biblioteca de producto ni se cambia de SDK. Los avisos eran desalineación de parches, no un fallo concreto de interfaz demostrado. La consulta directa al registro confirmó splash-screen 57.0.10; un ETARGET inicial provenía de metadatos de caché desactualizados y se resolvió consultando en línea.

El Node 22.2.0 del equipo tampoco cumplía los engines de React Native 0.86. Se instaló Node 22.23.3 y se activó mediante Homebrew; `.nvmrc` registra esa versión para reproducibilidad y README explica su uso. PHP 8.4.26 quedó instalado en paralelo, sin cambiar PHP 8.3 predeterminado. Se instalaron las dependencias existentes de API desde composer.lock, sin modificarlo, y se ejecutaron las pruebas de política con `/opt/homebrew/opt/php@8.4/bin/php vendor/bin/phpunit tests/Feature/PasswordPolicyTest.php`: **9 tests, 13 aserciones, todos pasan**. Esto resuelve el bloqueo PHP para estas pruebas, no demuestra ejecución de toda la suite API ni integración con base real.

La instalación de Homebrew actualizó dependencias compartidas y redirigió el alias legado de ICU; se restauró `/opt/homebrew/opt/icu4c` a su keg 74.2 para conservar el PHP 8.3 antiguo. Se comprobó que PHP 8.3.7, PHP 8.4.26 y Node nuevo arrancan. No se iniciaron servicios ni se alteraron bases de datos.

Los bundles Android/iOS se exportaron con los módulos nativos actualizados en `/tmp/lizto-expo-patches-export`. La validación en builds de desarrollo sigue pendiente: un bundle exportado no valida ejecución nativa. No hay cambios de endpoints, nuevas integraciones ni nuevos defectos de backend por esta actualización. No se publicaron cambios ni se modificó Trello.


Resultado final de esta actualización: `npx expo-doctor` **21/21, sin problemas**; `npx tsc --noEmit` sin errores; `npm test -- --runInBand` **98 tests en 17 suites, todos pasan**; `git diff --check` limpio en app y API. Las versiones instaladas de los siete paquetes coinciden con las listadas arriba. La limitación pendiente es la validación de builds nativos, independiente de los avisos de versiones ya resueltos.
