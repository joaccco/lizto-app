# Etapa 1 — Alcance, contratos y próximas entregas móviles

> **Status:** Alcance y decisiones principales alineados; contratos B1–B8 por coordinar. M1/M2 implementadas y probadas en iPhone; M3 validada en iPhone y pendiente de Android/staging · **Owner:** Mateo (app e integración), Joaco (API/web) · **Última revisión:** 2026-10-21 · **Fuente de verdad:** Decisiones acordadas y evidencia referenciada; el comportamiento vigente se comprueba en código.

> **En 30 segundos.** Primera beta: cliente y profesional, Agenda y Urgencia, Android e iOS. En iPhone se probaron roles/sesión, acceso, registro, Google/Facebook y recuperación; también se validaron contratos contra la API local. M3 sigue abierta por Android y staging compartido. OpenJDK 17 ya está disponible en Homebrew; faltan plataforma Android, herramientas del SDK, emulador y aceptación humana de licencias. Etapa 1 deja dependencias y contratos explícitos; no equivale a construir onboarding, Agenda o Urgencia.

## Evidencia y límites

- API: `2f69793` (main, recuperación de contraseña), con OAuth en `9766808`/`7b16507` y correcciones previas de registro/contraseña. Revisado el código local de rutas, controladores, recursos, políticas y modelos. La revisión de contratos no implica que exista despliegue compartido.
- Engineering: `0258aa5`, actualizado el 2026-10-20. [Reglas](../../lizto-engineering/01-product/business-rules.md), [decisiones](../../lizto-engineering/05-decisions/README.md), [plan de Urgencia](../../lizto-engineering/09-roadmap/urgencia-con-oferta.md). Los acuerdos posteriores de Mateo de esta conversación se sincronizan con esa guía; no implican implementación API.
- [Trello](https://trello.com/b/C8KEjcAM/lizto-development): consulta de tarjetas relevantes el 2026-10-21. B1, B2 y B4 continúan en «Esperando una decisión»; M3 sigue «En curso» con descripción desactualizada al 2026-10-20. No se modificaron tarjetas. Los estados del tablero no sustituyen evidencia de ejecución.
- App: último commit publicado `e912a29` (2026-10-21); los cambios locales actuales son sólo esta actualización documental. La web `../lizto` sigue como referencia funcional; no sustituye pruebas React Native.
- Resultados de entregas anteriores: cada suite y validación se documenta en su registro fechado más abajo; no convertir exportación en ejecución nativa.
- [Historial hasta esta consolidación](historial/ETAPA-1-HISTORIAL-HASTA-2026-10-20.md): conserva las decisiones anteriores, incluidos anillos y esperas por grupo posteriormente reemplazados. Este documento contiene el estado vigente.

## Alcance y decisiones vigentes

Mateo y este agente desarrollan la app React Native e integración. Joaco desarrolla API y web. La API conserva permisos y lógica de negocio; los cambios necesarios se especifican y coordinan, sin inventar contratos en mobile. La autorización de modificar contraseñas en API fue puntual.

La primera beta incluye ambos roles, ambos caminos y ambas plataformas. La secuencia por etapas organiza dependencias; no habilita lanzar una beta exclusiva de Agenda o Android. Registro → habilitación profesional → solicitud/oferta → aceptación → trabajo/chat → finalización informada → confirmación del cliente → registro de pago → reseña es el objetivo de varias entregas.

Cliente gratis; profesional por oportunidad adjudicada; lanzamiento con cargo cero y registro del evento, sin suscripciones, monedas, deuda ni cobro por ofertar. Pago digital opcional y efectivo permitido; Lizto no custodia fondos según engineering. Una propuesta marcada como tal no se construye.

### Urgencia acordada con Mateo

- Se ofrece inicialmente a tres profesionales elegibles más cercanos; cada profesional tiene radio de traslado y ubicación con consentimiento sólo mientras está disponible. No se emplean anillos fijos de 500 m.
- No existe temporizador por grupo. El tiempo total de búsqueda/espera es configurable desde Super Admin; aún falta su valor inicial y el contrato que lo expone.
- El cliente puede indicar precio inicial opcional. El primero que toma la solicitud tiene exclusividad y hasta 5 minutos para aceptar ese precio o emitir su única propuesta/contraoferta antes de empezar.
- Aceptar exactamente el precio inicial del cliente confirma directamente el trabajo: el cliente ya consintió ese monto. Sin precio inicial o con otro monto, el cliente tiene 2 minutos para aceptar; recién entonces se crea el trabajo.
- Durante esos plazos la búsqueda queda pausada. Rechazo del cliente o vencimiento reanuda con los profesionales pendientes, sin reiniciar candidatos ya contactados dentro del mismo intento. No se presupone cómo reinicia un intento con precio aumentado: debe acordarse.
- Al agotar elegibles se ofrece subir el precio o pasar a Agenda según engineering. Cantidad de relanzamientos, política si ningún radio cubre al cliente y cargo por visita sin acuerdo siguen pendientes del equipo; no bloquean acceso ni preparación nativa.
- Parámetros y vencimientos pertenecen al servidor, con instantes de offset explícito; push recibido o temporizador local no son autoridad. El contrato debe precisar inicio de los 2 minutos, expiración, cancelación, reanudación e idempotencia/concurrencia. No está disponible por existir una ruta genérica de ofertas.

### Roles, identidad y privacidad

El layout raíz decide entre `client` y `provider` según `/auth/me`; un rol único se usa directamente, doble rol sin preferencia muestra «Contratar un servicio» / «Trabajar como profesional», y luego recuerda por cuenta. Ambos roles disponen de cambio rápido de vista. Cambiar de vista no habilita al profesional ni cambia disponibilidad.

Didit es autoridad de identidad, MVU decide habilitación por rubro y `/auth/me` aporta roles reales. Un perfil existente o una carga documental manual no sustituyen habilitación. Las rutas canónicas deben comprobarse antes de M4.

**Privacidad confirmada por Mateo el 2026-10-20:** domicilio y coordenadas exactos ocultos para ambos roles hasta confirmar el trabajo, incluido el cliente propietario. La app conserva esa protección. `LocationPresenter::canViewExact` devuelve `true` al propietario antes de confirmar: defecto de contrato de API respecto de esta decisión; ocultarlo en UI no evita la transferencia. No se modifica el backend de ubicación en esta ronda.

## Inventario de contratos actualmente consumidos

Base configurada `/api/v1`; Bearer Sanctum en rutas personales con control de suspensión. Todas las respuestas exitosas consumidas se validan con Zod. Inventario estático del commit indicado, no garantía de integración desplegada.

- POST `/auth/login`: email/password; `{data:{user,token},message}`. Credencial requerida, sin política de alta. 422 de credenciales, 403 de cuenta suspendida y 429 de límites son casos relevantes.
- POST `/auth/register`: name/email/password/password_confirmation/phone; mismo envelope, 201, rol inicial `client`. Nombre requerido y máximo 255; teléfono anulable y máximo 50. Mínimo 8 caracteres, mayúscula `A–Z`, número `0–9`, confirmación; API y esquema móvil alineados. Pantalla móvil implementada con nombre, email, contraseña y confirmación; ver [entrega de registro](REGISTRO-MOBILE.md).
- GET `/auth/me`: `{data:user}` con UUID, roles, `has_provider_profile`, status y campos personales anulables. POST `/auth/logout`: `{message}`, revoca token actual; admite `device_token` para revocación del dispositivo.
- GET `/categories`: público, `{data:[]}`, categorías por slug y children opcional.
- GET `/providers?category=…&page=…`: público, UUID y rating anulable; `{data:[],meta:{current_page,per_page,total}}`.
- GET `/requests?page=…`: solicitudes del cliente propietario, `{data:[],meta:{current_page,per_page,total,last_page}}`; conversación anulable.
- GET `/requests/{uuid}`: `{data:detalle}`, categoría anulable, fecha/franja y ubicación. **No aplica Gate de lectura y puede crear conversación en GET**, aunque exista `ServiceRequestPolicy::view`.
- GET `/provider/work-requests`: `{data:[]}`, UUID, work_id/conversation_id anulables y ubicación con `is_approximate`; sigue `limit(10)` sin paginación ni indicador de más resultados.
- POST `/service-requests/{uuid}/offers`: `pricing_mode`, moneda, importe o rango, notas/inicio/duración; `{data:oferta,message}`, 201. Verifica perfil e identidad; `store` no aplica la política `respond` de solicitud. Revisar elegibilidad y duplicados antes de ampliar Agenda.
- POST `/offers/{uuid}/questions`: `question_key/question_text`; `{data:{id numérico,question_key,question_text},message}`, 201; ahora autoriza `askQuestion`. Las preguntas no usan UUID.
- GET `/conversations/{uuid}/messages`: `{data:{contexto,messages}}`, lista completa, mensajes UUID, sender_name, is_me y created_at; aplica Gate. POST a la misma ruta: `{content}` y `{data:mensaje,message}`, 201; no devuelve sender_name y se invalida para recuperar el mensaje completo.

No se consumen por estar disponibles: confirmación directa `/provider/work-requests/{uuid}/confirm` conserva precio 15000 por defecto y aceptación en nombre del cliente; continúa bloqueada. `/decline` **ya no cancela globalmente**: aplica Gate `decline`, rechaza la tarjeta propia y devuelve `{message,data:{id,status:'declined'}}`; el botón móvil permanece deshabilitado hasta una entrega específica de integración y prueba nativa. No atribuirle el defecto antiguo.

También existen, todavía no integrados: `/provider/profile`, `/onboarding/identity/start`, `/onboarding/identity/status`, `/auth/become-provider`, dispositivos POST/DELETE `/devices`, ubicación POST `/providers/me/location` y otras rutas de trabajos/clarificación. Su existencia no acredita los nuevos contratos de Urgencia ni una bandeja persistida de notificaciones.

### Semántica transversal

Recursos principales consumidos usan UUID; categorías slug y preguntas ID numérico. El perfil profesional no integrado expone también IDs internos: no generalizar UUID a todo campo `id` del sistema.

`status` mezcla `RequestStatus` y `WorkStatus` según haya trabajo. No deducir una máquina de estados única ni acciones permitidas sin contrato. Los valores se contrastan con enums reales al integrar una acción nueva.

`quoted.proposed_price` sigue siendo decimal en unidad mayor; se convierte a centavos en el borde y se serializa decimal al enviar. `price_min/price_max` son enteros de unidad mínima según la evidencia existente; requieren ratificación de contrato para futuras lecturas. No inferir unidades de una cifra. Cero está permitido por API pero mobile exige precio positivo: decisión de oferta gratuita pendiente de negocio.

Instantes con offset explícito, UTC en serialización; fechas/franjas civiles no son instantes y no se les agrega `Z`. Zona Buenos Aires sólo en presentación. No comparar horas locales como texto.

422 puede incluir `errors`; mobile valida ese cuerpo antes de mapear campos conocidos y usa mensajes i18n. 401 no navega desde red ni elimina una credencial nueva por una respuesta tardía de otra sesión. Sin reintentos automáticos de POST sin garantías de idempotencia.

## Dependencias de API para próximas entregas

Cada requisito describe un resultado a acordar con Joaco; **no es una ruta futura inventada**. Resolver cada contrato antes de su integración, sin detener tareas móviles independientes.

### B1 · Habilitación profesional — bloquea M4

Evidencia: coexisten perfil, documentos, Didit y `becomeProvider`, que todavía comprueba documentos manuales aprobados para asignar rol. El perfil usa flags heredados y defaults de radio/horarios/experiencia; no tratarlos como datos reales de alta.

Responsable API: Joaco; integración: Mateo. Acordar un camino canónico para cliente que inicia/retoma perfil y Didit, estados de rechazo/reintento y autoridad MVU. Aceptación: identidad manual no habilita; roles/habilitación se refrescan desde servidor; no exigir rol provider antes de poder obtenerlo; datos personales sólo del titular; error de proveedor visible y recuperable.

### B2 · Recuperación de negociación — bloquea M5

No se encontró lectura de ofertas/preguntas por solicitud en las rutas actuales ni en el detalle. Acordar lectura autorizada del cliente y oferta propia del profesional: UUID, estados, importes/unidades/moneda, inicio/duración, preguntas/respuestas e identificadores. Paginación con orden estable si el volumen lo requiere. Aceptación: reabrir conserva negociación sin reenviar una oferta ni exponer ofertas privadas ajenas.

### B3 · Consentimiento y rechazo — bloquea adjudicación de Agenda

En API local `2f69793`, `ProviderDashboardController::confirmWorkRequest` crea una oferta con `proposed_price` por defecto de ARS 15.000 y llama `acceptOfferAction` desde la acción del profesional. No satisface la decisión de que el cliente acepte el precio antes de adjudicar. Aceptación: sólo el cliente adjudica una oferta acordada; reintentos/concurrencia no duplican trabajos y no hay monto de reserva inventado. **Rechazo individual corregido estáticamente en API actual**; falta validarlo en integración y adaptar mobile en su propia entrega. No se declara cerrado el bloqueante completo.

### B4 · Lectura y privacidad — bloquea detalle seguro y negociación

Revisado en API local `2f69793`: `ServiceRequestController::show` no aplica Gate `view` y crea conversación con `firstOrCreate` durante un GET cuando ya hay un trabajo pero aún no tiene conversación. `LocationPresenter::canViewExact` devuelve `true` al cliente propietario antes de confirmar; para otros actores exige trabajo confirmado. Su presentación aproximada fabrica coordenadas de centroides por zona y radio fijo de 500 m. Counter/reject/askQuestion aplican políticas; answer valida participación explícitamente. Falta comprobar y cubrir las rutas de lectura con pruebas de autorización adecuadas.

Aceptación: ajenos no leen solicitud; propietario/profesional elegible tienen acceso definido antes de adjudicar; GET no crea recursos; conversación nace de la acción de negocio. API no envía domicilio/coordenadas exactos a ningún rol antes de trabajo confirmado, según decisión de Mateo. Eliminar datos fabricados de `LocationPresenter`, duración 60, bio/experiencia/precios de reserva del detalle; campos ausentes se exponen como ausentes. No afirmar explotación en vivo por lectura estática.

### B5 · Unidades, estados y errores — afecta M5/cierre

Acordar importe entero mínimo+moneda, estados separados de solicitud/trabajo o capacidades explícitas, códigos de negocio, vencimientos y garantías de repetición. Migración compatible con consumidores, sin normalizar en silencio ni activar reintentos de escritura sin soporte.

### B6 · Chat incremental — bloquea historial creciente eficiente

GET sigue descargando todo con `get()` y app consulta cada 3 segundos. Acordar cursor/incremental, orden estable, límite y continuidad; POST devuelve mensaje suficiente para caché y garantía de repetición. Aceptación: recuperar mensajes sin huecos/duplicados y medir bytes/latencia antes/después. WebSocket no es una decisión automática.

### B7 · Bandeja completa — bloquea oportunidades fuera de primeras diez

Acordar paginación/cursor con orden estable y señal de continuidad. Aceptación: más de diez oportunidades accesibles sin transferencias ilimitadas; el límite actual no se presenta como bandeja completa.

### B8 · Configuración y otras funciones — dividir por entrega

Configuración de negocio/Urgencia: falta lectura autorizada de parámetros, plazos y versión, sin radios/tiempos quemados en app. Google/Facebook y recuperación ya tienen contrato e integración implementados; faltan Apple (membresía paga), verificación de email, correo externo, pagos y disputa. Dispositivos push **sí tienen rutas**; no confundir registro de token con feed de notificaciones ni entrega APNs comprobada.

Los contratos de Urgencia deben cubrir exclusividad, expiración, pausa/reanudación y consentimiento, además de lectura de configuración. El contador por oportunidad adjudicada requiere confirmación contractual antes de integrar cobros. Push y ubicación tienen rutas, pero eso no acredita feed persistido ni entrega APNs.

## Entregas y responsables

- **M1 — IMPLEMENTADA Y ACEPTADA EN IPHONE:** selección central, preferencia por cuenta, cambio rápido y caché aislada. Mateo confirmó el cambio de rol y su persistencia por cuenta.
- **M2 — IMPLEMENTADA Y ACEPTADA EN IPHONE:** login, registro nativo y recuperación con verificación separada, cooldown e ingreso automático. Google y Facebook permiten vincular/ingresar, conservan el estado y cancelar no inicia sesión. Ver [registro](REGISTRO-MOBILE.md), [OAuth](OAUTH-MOBILE-CONTRATO.md) y [recuperación](PASSWORD-RECOVERY-CONTRATO.md). Registro y OAuth ya no están fuera de alcance. Apple sigue pendiente de membresía paga; verificación de email y entrega de correo externo siguen pendientes.
- **M3 — IPHONE VALIDADO; ANDROID/STAGING PENDIENTES:** el build de desarrollo está instalado y corre en el iPhone contra API local; Mateo confirmó login, catálogo, persistencia/logout, cambio de vista, errores, alta, OAuth y recuperación. No hay staging compartido. OpenJDK 17 está instalado, pero faltan plataforma/herramientas SDK, emulador y aceptación humana de licencias; Android sigue sin build/ejecución nativa.
- **M4 — BLOQUEADA POR B1/CONFIGURACIÓN DIDIT:** onboarding/perfil/Didit. El contrato B1 permanece en «Esperando una decisión» de Trello; el flujo canónico y autoridad de habilitación deben acordarse antes de integrar. La tarjeta de Sandbox también sigue como bloqueante de lanzamiento en Trello.
- **M5 — PENDIENTE:** solicitud Agenda y negociación recuperable, depende de B2–B5. No se construye como parte del cierre documental de etapa 1.

## Cierre de etapa y qué continúa después

La alineación puede cerrarse cuando el inventario y decisiones estén sincronizados, las tareas próximas tengan dueño/aceptación y el equipo acuerde cómo resolver los contratos que las bloquean. No exige implementar todos los B1–B8 ni el producto completo; tampoco permite declararlos disponibles por una propuesta escrita.

Pendiente de coordinación humana: acordar con Joaco los contratos B1–B8 por orden de dependencia. En Trello B1/B2/B4 están esperando decisión. Las integraciones Google/Facebook y recuperación ya están implementadas y probadas; Apple depende de membresía paga, verificación de email y correo real siguen pendientes. M3 aún requiere Android y staging.

La validación nativa de iPhone está documentada por flujo; Android y staging siguen pendientes y son necesarios para el alcance acordado de beta. No se declara cerrada la etapa 1 ni la épica mobile. No se modificaron API, web ni tarjetas de Trello en esta ronda.

## Registro de esta ronda · 2026-10-20

- Inventario revisado contra API actual; rechazo individual y políticas de ofertas diferenciados de defectos todavía presentes.
- Engineering y Trello sincronizados documentalmente; no se cierran tarjetas por inferencia. Enlaces debajo.
- M2: TypeScript y 105 tests en 18 suites pasan también después de instalar el cliente nativo. Sin texto visible nuevo fuera de i18n.
- Dependencia nueva: `expo-dev-client`, justificada por el build propio de desarrollo. CocoaPods/PostgreSQL son herramientas locales, no bibliotecas de producto. La instalación de npm informó vulnerabilidades transitivas; pendientes de análisis, sin aplicar `audit fix --force` que rompería compatibilidad del SDK.
- Base PostgreSQL aislada en `/tmp/lizto-stage1`, puerto 55432; migraciones y semillas de roles/categorías reales completadas. API local iniciada en loopback. No se alteran bases previas; no se habilitan servicios al inicio del equipo.
- Build iOS compilado (`** BUILD SUCCEEDED **` en `.expo/xcodebuild.log`). No se validó ejecución: falta Simulator.app en la instalación actual de Xcode y la automatización de arranque falló. Android y dispositivo físico pendientes. Se conserva historial previo en el enlace de evidencia.
- Registro: PostgreSQL generaba el UUID, pero la respuesta inmediata de Laravel devolvía `null`. Con autorización puntual de Mateo se agregó `refresh()` después de asignar el rol en `AuthController`, más una regresión que exige UUID válido, igual al persistido y al de `/auth/me`. No se relajó el esquema móvil. Cambio local pendiente de publicación de API.
- API: 20 pruebas y 41 aserciones pasan (`AuthTest` y `PasswordPolicyTest`), usando exclusivamente `lizto_stage1_test` en PostgreSQL local, puerto 55432. Integración móvil real: 5 pruebas pasan (registro, health, catálogo, login/perfil/solicitudes/logout y errores de validación). `npm run test:api` requiere `LIZTO_LIVE_API_URL` de loopback; no usa mocks ni escribe tokens en archivos.


### Estado de coordinación al 2026-10-20 · histórico

## Registro de estado verificado · 2026-10-21

- App `e912a29` publicada en `main`; API `2f69793` publicada en `main`. Registro, recuperación y OAuth Google/Facebook tienen evidencia de integración contra API local; Mateo confirmó manualmente los recorridos en iPhone. No implica staging ni Android.
- Mateo confirmó en iPhone alta e ingreso automático, vinculación/ingreso/cancelación y reintento con Google/Facebook, y recuperación con seis dígitos, verificación previa, cooldown e ingreso automático.
- Trello consultado: [B1](https://trello.com/c/zNTaqGB1) («Esperando una decisión»), [B2](https://trello.com/c/8DbSZx1T) y [B4](https://trello.com/c/SsKY4QBV) («Esperando una decisión»); [M3](https://trello.com/c/Wg5el1Sq) («En curso»), cuya descripción conserva evidencia anterior al login y registro en iPhone. No se actualizaron tarjetas.
- Entorno Android de esta Mac: OpenJDK 17 está instalado en Homebrew; sus binarios aún requieren `JAVA_HOME` explícito para los comandos de build. Las herramientas CLI oficiales están en `/tmp/lizto-android-sdk` y el Android CLI actual en `/tmp/lizto-android-home`; faltan plataforma/build-tools, `platform-tools`, emulador e imagen. La instalación de paquetes requiere aceptar las licencias oficiales de Android; no se aceptaron automáticamente. No hay dispositivo Android confirmado.
- Prioridad siguiente según dependencias: resolver el contrato B4 de privacidad/autorización con Joaco y documentar su corrección en API; luego B3/B5 de consentimiento, estados e importes y B2 de negociación recuperable antes de M5. M4 no debe avanzar hasta acuerdo B1 y desbloqueo de configuración Didit/Sandbox. M3 Android puede prepararse en paralelo.

- [Épica móvil](https://trello.com/c/Yx9AvObY): alcance cliente/profesional, Android/iOS y Agenda/Urgencia, entregas separadas.
- [M1 roles/sesión](https://trello.com/c/uHZ7zaRe) y [M2 acceso](https://trello.com/c/b8pxAoHF): estaban en revisión según la consulta del 2026-10-20.
- [M3 nativo/API real](https://trello.com/c/Wg5el1Sq): estaba en curso; el estado posterior está registrado arriba.
- Contratos por acordar: [B1 habilitación](https://trello.com/c/zNTaqGB1), [B2 lectura de ofertas](https://trello.com/c/8DbSZx1T) y [B4 lectura/privacidad](https://trello.com/c/SsKY4QBV). Responsables API/app documentados en descripción, sin atribuir aceptación del contrato a Joaco.
- Aclaradas las tarjetas de [acceso API/web](https://trello.com/c/RIMKuvPH), [autoadjudicación](https://trello.com/c/vvRtQt0K), [respaldo/rating](https://trello.com/c/f2YNBmxH), [Flutter histórico](https://trello.com/c/XbpEmmJL) y [suscripciones no vigentes](https://trello.com/c/hPmS8Fvb). Se conservaron sus referencias históricas y no se cerraron por inferencia.

Engineering sincronizado localmente en reglas de negocio, plan de Urgencia, parámetros de admin, registro de decisiones y bitácora. Sin commit/push: Joaco todavía debe revisar los contratos que afectan API/web. La decisión de Mateo sobre domicilio de ambos roles está registrada; no implica que la API haya dejado de enviarlo.

### Instalación física iOS · 2026-10-20

El iPhone de Mateo quedó conectado con Developer Mode habilitado. Se creó Apple Development en Xcode y se instaló el intermedio oficial Apple WWDR G3, sin modificar confianza raíz. Se liberaron cachés regenerables autorizadas para permitir la compilación. Build para dispositivo físico: cero errores, una advertencia de dependencias del script de Expo Dev Launcher.

La instalación inicial falló porque cuatro frameworks embebidos carecían de firma (`hermesvm`, `React`, `ReactNativeDependencies`, `ExpoModulesWorklets`). Se firmaron en el artefacto generado con la misma identidad y se volvió a firmar el contenedor conservando entitlements; `codesign --verify --deep --strict` pasó y `devicectl` confirmó la instalación de `com.lizto.app`. Es una corrección del artefacto local: revisar el proceso de firma para el siguiente build, sin considerarlo solucionado en CNG.

El lanzamiento quedó detenido por la comprobación de seguridad de iOS, que incluye confianza explícita del perfil de desarrollo. Pendiente que el usuario confíe en su perfil en Ajustes y comprobar arranque/conexión. API de pruebas y Metro disponibles por LAN mientras corran sus procesos y ambos equipos compartan Wi-Fi. Esto todavía no valida login, Secure Store ni Android.

Mateo confirmó que confió en el perfil y abrió Lizto. `devicectl device process launch` confirmó el lanzamiento correcto después de esa acción. Metro responde por LAN; pendiente confirmar carga del JavaScript y pantalla móvil, antes de declarar recorrido funcional validado.

El primer arranque físico se cerró inmediatamente. Informe nativo: `EXC_BREAKPOINT` / `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`, antes de cargar JavaScript. Se agregó `expo-build-properties ~57.0.22`, justificado por activar `ios.enableSceneSupport` para Xcode/iOS 27. Prebuild generó `UIApplicationSceneManifest` y trasladó inicio nativo a `EXExpoAppSceneDelegate`. TypeScript, 105 tests y Expo Doctor 21/21 pasan. Pendiente validar el nuevo build en dispositivo. Fuentes: [Expo](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/) y [Apple](https://developer.apple.com/documentation/uikit/transitioning-to-the-uikit-scene-based-life-cycle).

Nuevo build con escenas: compilación e instalación física completadas (0 errores, 1 advertencia del script Dev Launcher). La regeneración también permitió instalar sin repetir firma manual de frameworks; falta aislar la causa del primer artefacto, no se atribuye al plugin sin evidencia. Tras desbloquear el iPhone, `devicectl --console` mantiene el proceso activo y Metro registró bundles iOS servidos (2169 módulos). Pendiente confirmación visual de Mateo y recorridos de integración; Android continúa pendiente.

Mateo confirmó visualmente la pantalla de Lizto en su iPhone. El servidor registró consultas nativas a `/categories` y `/providers`. La cuenta local de integración se verificó con login HTTP 200 y cierre de esa sesión de verificación HTTP 200 (tokens sólo en memoria). Esta evidencia valida arranque/interfaz y conexión de catálogo en iPhone; no implica recorridos autenticados, rol profesional, Secure Store o Android ya verificados.

Corrección visual en iPhone: `Text` enviaba `color: undefined` como estilo inline y anulaba el color de NativeWind cuando no había color explícito. Se evita agregar esa propiedad ausente; se conservan los colores explícitos y la prioridad de `style`. Metro recargó el build de desarrollo y Mateo confirmó que los textos se ven correctamente. TypeScript y 105 tests pasan. La suite Jest sustituye el runtime de NativeWind y no verifica este contraste nativo; la evidencia visual es la confirmación en dispositivo. Android sigue sin validación nativa. Sin endpoints nuevos, cambios API ni dependencias por esta corrección.

### Continuación OAuth · 2026-10-20

Mateo confirmó en iPhone ingreso, persistencia, logout, rechazo de contraseña incorrecta, cambio entre roles, preferencia por cuenta y recuperación al volver la conexión. Son comprobaciones manuales informadas por Mateo, no nuevas pruebas automatizadas. Android queda pendiente por falta de entorno disponible.

Mateo pidió continuar con OAuth. Revisión de API local y remoto: ambos `db4f1e6`, sin rutas/configuración OAuth Google/Apple. [Requerimiento de integración OAuth](OAUTH-MOBILE-CONTRATO.md): responsables, límites, criterios de aceptación y configuración necesaria. Proveedores del primer bloque, política de vinculación y disponibilidad de configuración externa están consultados con Mateo, pendientes de respuesta. No se agregan endpoints ficticios ni SDKs/botones sin un flujo acordado.

Mateo informa aprobación de Joaco para OAuth con Google, Facebook y Apple, confirma crear las tres configuraciones desde cero y exige ingreso previo/vinculación explícita ante cuenta existente con el mismo email. El [contrato OAuth](OAUTH-MOBILE-CONTRATO.md) registra estas decisiones; rutas y payloads de API todavía pendientes.

Preparación móvil OAuth Google/Facebook: adaptadores nativos, validación y coordinación detrás de la interfaz `OAuthBackend`, sin transporte HTTP ficticio ni botones habilitados antes de la entrega API. Se agregan tres dependencias nativas justificadas en [el contrato OAuth](OAUTH-MOBILE-CONTRATO.md). Apple pendiente por decisión de Mateo (no tiene membresía paga). TypeScript, 123 tests en 20 suites y Doctor 21/21; build físico con SDKs en curso. Android continúa pendiente.

Build físico OAuth preparatorio compilado, firmado, instalado y lanzado; Metro sirvió JavaScript. Esta evidencia valida que los SDKs conviven con el arranque actual, no un ingreso OAuth real. Contrato HTTP de API, vinculación y flujo completo siguen pendientes; ver límites y advertencias en el documento OAuth.

### OAuth implementado · 2026-10-21

Mateo autorizó excepcionalmente implementar y publicar el backend de Joaco. Se implementaron cuatro rutas reales de desafío, ingreso y vinculación Google/Facebook y su integración móvil. Este estado reemplaza las notas históricas de contrato pendiente anteriores; ver [contrato vigente](OAUTH-MOBILE-CONTRATO.md). API: 396 pruebas / 2084 aserciones; app: TypeScript, 128 pruebas y Doctor 21/21. Registro UUID y contraseña quedan incluidos en la entrega API. No implica despliegue remoto ni validación humana OAuth: faltan autorización real desde iPhone, configuración del ambiente compartido y Android. Apple pendiente de cuenta paga.

### Validación OAuth iPhone · 2026-10-21

Mateo confirmó vinculación e ingreso con Google y Facebook, recuperando la cuenta existente y ambos roles. El error de Facebook dentro de limited.facebook.com se resolvió al agregar email en los permisos del caso de uso Meta. La ampliación API 9766808 informa proveedores vinculados; la app conserva ese estado en TanStack Query, deshabilita el botón vinculado y oculta el aviso a los 30 segundos. TypeScript, 133 pruebas móviles y Doctor 21/21 pasan. Mateo confirmó cancelación/reintento real en ambos proveedores; Android, Apple y ambiente compartido siguen abiertos. Esta actualización reemplaza las notas históricas de OAuth pendiente, sin declarar cerrada la etapa 1.

### Recuperación de contraseña · 2026-10-21

Mateo pidió continuar recuperación y eligió bandeja local. Se implementan POST /auth/forgot-password y /auth/reset-password, formulario nativo desde ingreso y Mailpit local sin entrega externa. Código de ocho dígitos de un uso con hash, vencimiento UTC explícito, contador persistente y control de reenvío; cambio revoca sesiones y conserva roles/OAuth. TypeScript, 141 pruebas móviles, Doctor 21/21 y 407 pruebas API / 2170 aserciones pasan. Integración real SMTP/API validada con cuenta de pruebas aislada. La primera prueba manual no mostraba el botón: se reinició Metro con cache limpia y se sirvió un bundle iOS nuevo; confirmación manual del recorrido pendiente. Ver [contrato y límites](PASSWORD-RECOVERY-CONTRATO.md). Android, correo externo y ambiente compartido siguen pendientes; no se declara cerrada la etapa 1.

Ajuste solicitado por Mateo: confirmó recuperación inicial en iPhone y pidió código de seis dígitos, verificación primero y contraseña después. API incorpora /auth/verify-password-code y permiso temporal de un uso, con presupuesto de intentos persistente entre reenvíos. UI no muestra contraseña antes de la verificación. TypeScript, 144 pruebas móviles y Doctor 21/21; integración SMTP real del nuevo recorrido validada, confirmación manual solicitada. El [contrato vigente](PASSWORD-RECOVERY-CONTRATO.md) reemplaza las referencias anteriores a ocho dígitos y formulario conjunto.

Mateo confirmó el nuevo recorrido de seis dígitos y solicitó más separación, espera contra reenvíos e ingreso automático. Se agregó retry_at en solicitud, límite persistente por email (por defecto un minuto entre pedidos y cinco por hora, configurable en API), y sesión nueva en la respuesta de cambio tras revocar las anteriores. La app usa Secure Store y la autoridad de rol del layout raíz. Mateo confirmó en iPhone las tres mejoras. TypeScript, 148 pruebas móviles, Doctor 21/21 y 413 pruebas API / 2236 aserciones pasan. Android y correo externo siguen pendientes; cambios locales aún sin publicar. Este estado reemplaza las notas anteriores de confirmación manual pendiente y login posterior obligatorio.

### Registro móvil · 2026-10-21

Se publicó recuperación en API 2f69793 y app c1a2618. A pedido de Mateo se implementó registro nativo sobre POST /auth/register existente, con cuatro campos, política de contraseña compartida e ingreso automático mediante Secure Store; rol inicial client bajo autoridad de API/layout raíz. TypeScript, 157 pruebas móviles, Doctor 21/21 y cinco pruebas contra API local real pasan. Mateo confirmó en el build iPhone creación de cuenta nueva e ingreso automático. Sin cambios backend ni dependencias por registro. Android continúa pendiente; ver [evidencia](REGISTRO-MOBILE.md).
