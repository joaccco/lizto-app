# Auditoría de Lizto mobile

Este documento conserva los hallazgos iniciales. El estado posterior a las correcciones está en [Primera entrega de correcciones](#primera-entrega-de-correcciones).

Fecha: 7 de octubre de 2026. Alcance: revisión estática del repositorio completo, rutas, pantallas, acceso a API, esquemas, sesión, componentes, pruebas y configuración. No se modificó código de la aplicación ni el backend.

## Evaluación general

La app es una implementación parcial de un marketplace de servicios a domicilio para clientes y profesionales. Tiene una estructura razonable por funcionalidades, pero no permite completar una contratación desde cero. Tampoco hay evidencia suficiente para considerarla lista para publicar: hay errores de integración y dominio comprobables por lectura, y no se pudieron ejecutar las verificaciones nativas ni la suite local.

Las prioridades son corregir composición de URLs, privacidad, horarios y dinero antes de ampliar pantallas. La existencia de una pantalla o un método de API no demuestra que funcione contra el servidor.

## Qué hace hoy

- Visitante: entra al inicio del cliente, consulta categorías y explora profesionales por categoría. Puede cargar más resultados. El catálogo muestra nombre, especialidad, bio, verificación y reseñas; sus tarjetas no abren un perfil ni permiten contratar.
- Autenticación: formulario de email y contraseña, validación con React Hook Form/Zod, login contra API, almacenamiento de token y consulta del perfil. Hay método y esquema de registro, pero no pantalla de registro o recuperación.
- Cliente: lista sus solicitudes, estado, descripción y fecha; abre chat si la API devuelve una conversación. No puede crear una solicitud desde esta app.
- Profesional: bandeja de solicitudes con actualización manual y al enfocar; abre detalle, propone oferta de monto fijo o visita con rango, hace preguntas y descarta solicitudes. La API incluye un método de confirmación que no tiene un flujo de pantalla conectado.
- Chat: consulta cada tres segundos, muestra mensajes y permite enviar texto. Conserva el texto ante error y oculta el compositor cuando el servidor marca la conversación cerrada. No tiene bandeja global ni notificaciones push.
- Cuenta: muestra nombre, email y teléfono; permite logout y cambio de rol para usuarios con ambos roles.

Faltan en la interfaz: registro, recuperación, creación de solicitudes, detalle de profesional/contratación, selección de oferta, agenda, onboarding/KYC, seguimiento, pagos, cierre y calificación. Esto describe ausencia de implementación móvil; no demuestra ausencia de endpoints en el backend.

## Cómo funciona internamente

Expo Router usa grupos `(auth)`, `(cliente)` y `(pro)`; el chat está en `app/chat/[id].tsx`, fuera de un grupo compartido. El layout raíz inicializa sesión y fuentes, consulta `useMe()` y redirige según sesión y rol. Cliente usa pestañas; profesional usa stack.

TanStack Query conserva los datos remotos. Zustand guarda token en memoria, rol e inicialización; no encontré una copia del usuario remoto en el store. El login carga el usuario recibido en la caché de Query. Los tokens se persisten en Secure Store nativo, con excepciones problemáticas descritas abajo.

El cliente HTTP compone URL base + endpoint, adjunta Bearer, procesa errores y valida respuestas exitosas con Zod. Ante 401 borra credenciales y notifica al layout; no navega desde la capa de red. La validación existe, pero varios esquemas son demasiado permisivos para los invariantes del repositorio.

La UI comparte texto, inputs, botones, tarjetas, modales y estados vacíos/error/carga. Usa tema oscuro, NativeWind, Manrope e IBM Plex Mono. En Android los componentes de vidrio usan fondos sólidos. i18n publica es-AR, aunque varios flujos lo evitan.

## Hallazgos de prioridad alta

### A01. Prefijo `/v1` duplicado en detalle, ofertas y chat

Evidencia: `app.config.ts` configura por defecto `http://localhost:8000/api/v1`; `src/core/api/httpClient.ts` concatena el endpoint sin normalización. `useWorkRequestDetail.ts`, `offersApi.ts` y `chatApi.ts` envían endpoints que comienzan con `/v1/`.

Resultado reproducible por composición: `/api/v1/v1/requests/{uuid}`, `/api/v1/v1/service-requests/{id}/offers` y `/api/v1/v1/conversations/{uuid}/messages`. Login, catálogo y bandeja usan otra convención. Con la base documentada, las rutas de esos flujos quedan mal construidas. No se comprobó un 404 real contra el servidor.

Acción: adoptar una única convención de base y paths; probar URLs finales de todos los módulos con el cliente HTTP real interceptando fetch.

### A02. El detalle muestra domicilio sin comprobar confirmación

Evidencia: `app/(pro)/requests/[id].tsx` elige `request.location_address || request.address`, y lo renderiza sin condicionar por `status`. `is_approximate` solo añade texto de radio; no impide mostrar el domicilio. El esquema permite ambos campos y coordenadas.

Consecuencia: si la API envía dirección exacta en una solicitud pendiente, la pantalla la muestra. Que un fixture use «Palermo» no garantiza privacidad con una dirección real. El listado también conserva coordenadas y dirección en su esquema aunque la tarjeta muestre solo `location`.

Acción: definir estados que habilitan domicilio exacto y validar/redactar en el borde. Verificar respuestas reales; si contienen datos exactos antes de confirmación, corregir también el backend.

### A03. Ofertas introducen un desfase de tres horas

Evidencia: `OfferSheet.tsx` forma `${targetDateStr}T${proposedTime}:00.000Z` a partir de una hora ingresada por el usuario. `isTimeWithinWindow()` extrae horas de texto ISO, ignorando offset y fecha.

Ejemplo: una propuesta para las 10:00 de Buenos Aires se envía como 10:00Z, equivalente a las 07:00 locales. La validación horaria puede aceptarla por comparar el texto «10:00».

También hay fecha fija `2026-08-25` para validar, fecha de hoy UTC cuando falta agenda, hora inicial `10:00` y duración de reserva de 60 minutos. No valida estrictamente el formato de hora ni duración antes del envío.

Acción: convertir fecha y hora de Argentina a instante absoluto, validar ventanas con la semántica de agenda acordada y rechazar datos ausentes/invalidos sin inventarlos.

### A04. Importes decimales en el flujo real

Evidencia: `OfferSheet.tsx` usa `parseFloat` y envía ese número; schemas y respuestas de ofertas usan `z.number()` sin entero ni conversión. La utilidad `Money` no está conectada a este flujo. `offersApi.store()` no ejecuta `createOfferSchema.parse()`.

Consecuencia: se incumple el modelo de unidad mínima y moneda. `parseFloat('18000,50')` produce 18000, perdiendo centavos; también acepta prefijos numéricos de textos inválidos. El esquema de confirmación igualmente permite decimales.

Acción: parser monetario estricto, entero de unidad mínima + moneda, conversión explícita en el adaptador del contrato real y reporte de deuda si backend exige decimales. La utilidad existente además convierte un importe no numérico a cero, ocultando errores.

### A05. Logout no garantiza borrado persistente

Evidencia: `secureStore.removeToken()` captura y silencia errores de `deleteItemAsync`. El store después marca token nulo. Si el borrado falla, al reabrir puede recuperarse la credencial anterior. Guardado/lectura también caen silenciosamente a memoria cuando falla Secure Store nativo.

`authApi.logout()` absorbe cualquier error del servidor; su comentario sobre borrado local solo es válido para 401, no para fallos de red o 500. Cuenta sí llama luego al logout local, pero las salidas desde el estado de error del layout no revocan el token remoto.

Acción: hacer observable el fallo de almacenamiento, comprobar eliminación y diferenciar cierre local de revocación remota. La memoria web es una excepción explícita a la regla de tokens solo en Secure Store; no encontré AsyncStorage ni persistencia web en disco.

## Hallazgos de prioridad media

### A06. Invalidación no actualiza la bandeja profesional

`useWorkRequests.ts` usa `['provider', 'work-requests']`; las mutaciones de ofertas y descarte invalidan `['work-requests']`. No son el mismo prefijo. La actualización al volver a enfocar puede ocultar el problema, pero la mutación no invalida su lista. Unificar claves y verificar actualización tras enviar/descartar.

### A07. Pregunta usa ID de solicitud donde la API espera oferta

El detalle pasa su parámetro de solicitud a `useAskQuestion(id)`, y `offersApi.askQuestion()` construye `/offers/{id}/questions`. No hay paso que resuelva un ID de oferta ni uso del ID devuelto por crear oferta. Además el modal propone preguntar antes de ofertar. Es una inconsistencia del cliente; confirmar en backend cuál es el recurso correcto antes de decidir un endpoint.

### A08. Roles con reservas y resolución repartida

El store asigna `provider` cuando existen ambos roles pero no una preferencia, y `client` si no hay ninguno de los dos. La preferencia no está vinculada a usuario: un login distinto puede heredar el rol del anterior. `setActiveRole()` no valida pertenencia; la pantalla restringe el botón, pero el store no protege el invariante.

Login deriva rol además del layout. Chat decide interlocutor por `activeRole` dentro de pantalla, y Cuenta también renderiza según rol. Esto contradice la regla de resolución central. No constituye por sí mismo un bypass de autorización del servidor; sí puede dar UI incorrecta.

### A09. Contratos incompletos y tipos permisivos

Hay `any` explícitos en detalle, chat, ofertas, inputs y skeletons; `z.any()` en respuestas de acciones y brief. Usuario, trabajo, oferta y chat aceptan varios IDs con `z.string()` sin UUID; preguntas incluso aceptan números. Chat y detalle aceptan fechas sin validar offset, dejando fallos para presentación. `ensureExplicitTimezoneISO('')` inventa el instante actual y su regex no valida un ISO completo.

El HTTP client valida el éxito, pero lee JSON de error sin un esquema explícito. No recibe `AbortSignal` de las queries, ni establece timeout; no hay límite controlado de espera. Completar schemas y propagación de cancelación con pruebas de comportamiento.

### A10. Textos y valores fuera de las reglas

Detalle, chat, OfferSheet, QuestionSheet y parte de tarjeta profesional tienen textos directos; los mensajes Zod y el formato relativo de tiempo también están fuera de i18n. Hay radio 500, duración 60, hora 10:00 y categoría «Servicio General» de reserva. `app.config.ts` ofrece localhost incluso en producción cuando falta configuración, evitando el error esperado de URL ausente.

Distinguir constantes técnicas de parámetros comerciales, llevar los textos a es-AR y exigir configuración de API válida para releases.

### A11. Pruebas que no verifican la conducta anunciada

En `__tests__/chat.test.ts`, la prueba de conservación de texto solo asigna variables locales y examina el mock; puede pasar aunque ChatScreen borre el texto incorrectamente. En `contract.test.ts`, la prueba de protección profesional consulta `includes()` sobre un objeto local, sin ejecutar navegación. Registro y confirmación comprueban eliminación de campos que el payload del test ni siquiera incluye.

El mock exportado de `useAppFonts` en `typography.test.tsx` no sustituye automáticamente la referencia léxica que RootLayout usa dentro del módulo original; esos tests no demuestran los tres estados de fuente anunciados. Deben controlar el hook real de expo-font. Fuentes y blur requieren además prueba en dispositivo.

Sí hay casos útiles de schemas inválidos, moneda, offsets, redirección pura y descarte de datos privados del catálogo. No reemplazan pruebas de integración de pantallas/red ni recorridos nativos.

## UI, accesibilidad y rendimiento

- Bug comprobado: `GlassNav.tsx` recibe `title` pero nunca lo renderiza. Si se usa solo title, el centro muestra una vista vacía. Afecta detalle y sus estados de carga.
- `GlassCard.tsx` aplica padding interior solo en iOS/web; Android monta directamente children. Puede alterar considerablemente espaciado de login y detalle.
- Headers combinan SafeAreaView y padding de insets de GlassNav; revisar doble margen en dispositivo. Acciones del header ocupan columnas de 40 px aunque incluyen texto más ancho.
- El botón de descarte es un símbolo sin una etiqueta accesible explícita. Inputs muestran label visual sin asociación explícita en el componente. Revisar con TalkBack/VoiceOver, tamaño de texto y teclado.
- Catalog y solicitudes muestran error inicial en ListEmptyComponent; con datos previos, errores de refetch pueden quedar sin señal visible. Chat reemplaza el historial por error si un polling falla, aun si hay datos anteriores.
- El autoscroll de chat sucede al crecer contenido y recibir mensajes; puede desplazar al usuario que está leyendo historial. No hay paginación de mensajes y el historial completo se consulta cada tres segundos. El intervalo en background se desactiva en Query, pero debe verificarse el ciclo de AppState nativo; no encontré integración específica.
- Diseño y rendimiento visual no fueron evaluados en ejecución; no se atribuyen mediciones de FPS, memoria o contraste.

## Inventario de integración

Paths relativos que el cliente utiliza o declara (base documentada `/api/v1`):

- Login: POST `/auth/login`; perfil: GET `/auth/me`; logout: POST `/auth/logout`.
- Registro: POST `/auth/register`, declarado pero sin pantalla.
- Categorías: GET `/categories`; profesionales: GET `/providers?page=...&category=...`, sin Bearer.
- Solicitudes cliente: GET `/requests?page=...`.
- Bandeja profesional: GET `/provider/work-requests`.
- Detalle: GET `/v1/requests/{uuid}`; oferta: POST `/v1/service-requests/{id}/offers`.
- Pregunta: POST `/v1/offers/{id}/questions`; descarte: POST `/v1/provider/work-requests/{id}/decline`.
- Confirmación: POST `/v1/provider/work-requests/{id}/confirm`, declarado sin uso de pantalla.
- Chat: GET y POST `/v1/conversations/{uuid}/messages`.

Los paths con `/v1` sufren A01 con la base documentada. La lista describe referencias del código, no endpoints cuya disponibilidad se haya validado en vivo.

## Contradicciones y backend por verificar

AGENTS.md exige autenticación para rutas no auth, `{data}` sin metadatos e identificadores UUID. El roadmap afirma haber verificado catálogo público, paginación y categorías por slug en septiembre. El código sigue ese roadmap en catálogo y solicitudes. Con el contrato escrito en AGENTS, catálogo y solicitudes pueden fallar. Sin código actual o respuestas de lizto-api no se puede decidir cuál refleja hoy el servidor; requiere nueva verificación y actualización coordinada de contrato, documentación y schemas.

El roadmap ya reporta datos de contacto/domicilio/coordenadas en catálogo público, valores inventados de backend, importes decimales y posible autorización insuficiente en detalle. Son antecedentes documentales, no defectos del servidor reconfirmados en esta auditoría. Revisarlos con código y pruebas de permisos de la API. El esquema del catálogo elimina campos privados de la vista, lo que no elimina exposición en red.

Endpoints faltantes: no se puede certificar ausencia en backend. La bandeja global de conversaciones y configuración comercial figuran como no encontradas en la revisión anterior. La interfaz móvil no integra las capacidades pendientes enumeradas arriba. No se inventaron endpoints ni se modificó lizto-api.

## Verificación realizada y límites

- Se revisó código de rutas, módulos, componentes compartidos, schemas, pruebas y configuración; estado Git inicialmente limpio.
- `npm test -- --runInBand`: no ejecutó pruebas; error `jest: command not found`. No existe node_modules local.
- `npx tsc --noEmit`: quedó esperando resolver ejecutable/dependencias y fue interrumpido; typecheck no verificado.
- Expo Doctor: no ejecutado por falta de instalación local. No se afirma compatibilidad de versiones.
- Android: build/ejecución no verificados. No se encontró adb en PATH, ni carpetas android/ios generadas. La ausencia de carpetas nativas es normal en proyectos Expo gestionados y no es un defecto por sí misma.
- No hubo llamadas reales al backend, modificación de datos, login con usuarios, pruebas de IDOR, auditoría de dependencias vulnerables ni inspección de secretos. No se puede certificar seguridad integral ni funcionalidad extremo a extremo.
- No se agregaron dependencias ni se escribieron tests o correcciones.

## Orden sugerido de trabajo

1. Verificar contrato vigente de lizto-api y normalizar URLs. Validación: llamadas finales coherentes, schemas sobre respuestas reales anonimizadas y permisos por rol.
2. Cerrar privacidad y sesión segura. Validación: solicitudes pendientes no muestran ni reciben dirección exacta; probar fallo de borrado de Secure Store y reapertura.
3. Corregir horarios/dinero y preguntas. Validación: hora 10:00 Argentina equivale a 13:00Z, importes con coma conservan centavos, duración inválida se rechaza y pregunta apunta al recurso autorizado.
4. Unificar claves de caché, completar tipos/i18n, reparar tests y UI compartida.
5. Restaurar entorno y ejecutar tsc, Jest y Expo Doctor. Compilar desarrollo Android y verificar login, cambio de rol, logout/reapertura, bandeja/detalle/oferta/descarte y chat con conectividad intermitente.
6. Implementar el recorrido faltante de contratación en entregas separadas, con backend verificado.

## Resumen requerido por el repositorio

Endpoints referenciados: inventario anterior. Endpoints faltantes: no confirmados sin acceso al backend. Defectos backend: antecedentes por reconfirmar y exposición preconfirmación a comprobar. Dependencias agregadas: ninguna. Desvíos detectados: any, textos sin i18n, roles por defecto y en pantallas, schemas sin UUID/offset, dinero decimal, reservas inventadas, privacidad no condicionada y tests simbólicos. Las verificaciones de Definition of done permanecen pendientes; este informe no declara un cambio funcional terminado.


## Primera entrega de correcciones

Entrega del 7 de octubre de 2026, centrada en estabilizar integraciones existentes (A01–A07). Se leyó el código local de lizto-api para confirmar contratos; no se modificó el backend, no se crearon nuevas pantallas y no se inventaron endpoints.

### Corregido

- **A01 — URLs:** todos los paths son relativos a una base `/api/v1`; el cliente rechaza el prefijo `/v1` en endpoints. Se requiere URL configurada, se conserva puerto/path al resolver localhost en desarrollo y se elimina el respaldo hardcodeado de producción.
- **A02 — privacidad:** los schemas de bandeja y detalle redactan direcciones y coordenadas antes de llegar a la caché/UI si no hay marca de aproximación o estado confirmado autorizado. Solo se conserva una zona cuando `is_approximate` es true. Las coordenadas aproximadas se descartan porque las vistas no las necesitan. Para exactitud se exige `is_approximate: false` y uno de `confirmed`, `in_progress`, `pending_completion`, `completed`. Otros estados se tratan de forma conservadora; sin `confirmed_at` no se presupone confirmación. Las inconsistencias tienen una señal `privacy_violation`; el detalle informa que la ubicación fue ocultada. No se registran domicilios en logs.
- **A03 — horarios:** el formulario convierte fecha y hora de Buenos Aires a UTC mediante date-fns-tz. Las ventanas se comparan por instantes, incluyendo día y offset. Se rechazan fechas/horas inválidas; no se inventan fecha, hora o duración. Si no se propone hora, no se envía instante. Si la ventana no trae fecha, no se inventa el día. El contrato no define fin al día siguiente: no se adivinan ventanas nocturnas.
- **A04 — dinero:** el parser es-AR convierte texto a centavos enteros sin parseFloat. Acepta `18.000,50` y `18000,50`; rechaza formatos ambiguos y textos parcialmente numéricos. Payloads pasan por Zod antes de red. Todos los importes dentro de la app son centavos con moneda; solo el adaptador serializa el precio fijo como string decimal requerido por Laravel y convierte la respuesta de vuelta. Los rangos se mantienen en centavos porque el backend ya los utiliza así. Un importe corrupto produce error de contrato, nunca cero inventado. ARS es la moneda explícita del formulario actual, coincidente con el contrato argentino existente; no se añadió configuración comercial ficticia.
- **A05 — sesión:** tokens exclusivamente en Secure Store nativo, sin reserva en memoria. Se releen para verificar guardado y eliminación. Los fallos de inicio/borrado son visibles y bloquean las pantallas privadas hasta reintentar. Si un guardado queda a medias se intenta borrar el token. Un fallo de revocación remota no impide intentar el borrado local. El cliente HTTP notifica 401 incluso si falla el almacenamiento, sin navegar. La web permite explorar, pero el login requiere Android/iOS; se actualizó README para explicar esta consecuencia de la regla de credenciales.
- **A06 — caché:** ofertas y descarte invalidan las claves reales de bandeja y detalle. Consultas de bandeja, detalle y chat reciben señal de cancelación.
- **A07 — preguntas:** el detalle utiliza el UUID de la oferta devuelto por la mutación; nunca usa el UUID de solicitud para `/offers/{id}/questions`. Ese dato permanece en la caché de mutaciones de TanStack Query. El botón se habilita solo con una oferta creada en ese recorrido y se reinicia el contexto al cambiar de solicitud.

Ajustes relacionados: respuesta real de envío de chat validada sin exigir sender_name ausente; IDs numéricos de participantes/preguntas descartados porque no se necesitan en la UI; rating nullable permitido según respuesta real. Se eliminaron todos los `any` de app/src, se fortalecieron UUID/instantes en los módulos tocados, se tradujeron detalle, chat, ofertas, preguntas, errores del formulario y tiempo relativo. Se corrigió GlassNav para renderizar title, el padding Android de GlassCard, tipado de inputs y safe areas. Chat conserva historial ante fallo de actualización y conserva texto ante rechazo de envío.

Se sustituyeron las pruebas simbólicas de conservación de texto y protección de rutas por pruebas de pantalla/red y redirección real. Los tests de descarte de campos ahora incluyen los campos que deben descartarse. Las pruebas horarias previas confundían UTC con hora argentina: sus fixtures ahora representan el instante correcto y se añadieron casos que detectan el desfase original. Fixtures de contratos utilizan UUID válidos y campos del backend. Las cachés de test se liberan al desmontar, manteniendo opciones explícitas de cada prueba; no se usa forceExit.

### Backend verificado y trabajo separado

La inspección de `routes/api.php`, `ServiceRequestController`, `ProviderDashboardController`, `OfferController`, `OfferModel`, `ConversationController`, `LocationPresenter` y `ProviderController` confirmó:

1. Catálogo público y paginación sí existen en el código local actual. Son una contradicción con las notas antiguas de AGENTS.md, no endpoints inventados. Se conserva esa integración verificada y se reporta el desvío documental; AGENTS.md no se editó.
2. `LocationPresenter` ya aproxima ubicaciones de profesionales sin trabajo confirmado. El catálogo público actual publica zona aproximada; el hallazgo histórico de email/domicilio exacto del roadmap no se reconfirma en este código. Se mantiene protección en app. El presentador todavía contiene zonas/coordenadas de reserva cuando faltan datos; eso es deuda de backend y la app no puede distinguir una zona real de una fabricada por el servidor.
3. **Defecto confirmado:** `declineWorkRequest()` cambia el estado global de la solicitud a Cancelled. Por eso el botón Descartar queda **deshabilitado**, con explicación de indisponibilidad, hasta existir un descarte limitado al profesional. El adaptador tipado y su invalidación quedan preparados, pero la pantalla no ejecuta el endpoint. No se modificó ni ejercitó esa cancelación en un servidor real.
4. **Deuda monetaria confirmada:** `proposed_price` tiene cast `decimal:2`; `price_min/max` son integer en centavos (ver también `OfferContractValidationTest`). Uniformar el contrato en unidad mínima y moneda. La app hace la conversión explícita solo en el adaptador.
5. Las preguntas requieren una oferta, y su respuesta trae ID numérico. El chat trae IDs numéricos de participantes y una respuesta de envío sin sender_name. La app descarta esos identificadores innecesarios y valida los UUID utilizados en navegación.
6. El detalle no muestra una llamada explícita a autorización en el método show y sus perfiles incluyen valores de reserva. Es trabajo separado para revisar permisos y datos inventados. No se declara vulnerabilidad explotada ni se hicieron pruebas de acceso con usuarios reales.
7. El método de confirmación profesional contiene reservas de precio/duración/fecha en backend; sigue sin conectarse a una pantalla en esta entrega.

**Endpoints faltantes para completar estas acciones:** no se encontró una lectura de oferta propia por solicitud ni oferta incluida en el detalle. Por eso no se recupera una oferta anterior al reabrir y no se fabrican IDs. Falta un descarte seguro limitado al profesional; el endpoint actual tiene una semántica global distinta. Configuración comercial pública y bandeja global de chat siguen sin integrarse; no se inventaron rutas.

### Endpoints de esta entrega

Base `/api/v1`. Se mantienen login/me/logout, categorías/providers, listado cliente y bandeja profesional. Se corrigen e integran GET `/requests/{uuid}`, POST `/service-requests/{uuid}/offers`, POST `/offers/{uuid}/questions`, GET y POST `/conversations/{uuid}/messages`. Confirmación y descarte conservan adaptadores tipados para `/provider/work-requests/{uuid}/confirm|decline`, pero no se ejecutan desde la interfaz; descarte queda bloqueado por el defecto explicado arriba.

### Dependencias y validación

No se agregó ninguna biblioteca directa nueva. Se alinearon Expo 57 y sus módulos existentes, React Native/preset 0.86.3, jest-expo 57.0.5 y TypeScript 6.0.3 siguiendo Expo Doctor. Se actualizaron i18next 26.4.2 y react-i18next 17.0.16 porque las versiones anteriores declaraban compatibilidad solo con TypeScript 5. Se migraron aliases sin baseUrl obsoleto y se declararon tipos de Jest/Node/CSS sin silenciar diagnósticos ni bajar strict. package-lock conserva la instalación reproducible. Node admitido queda declarado en engines; validaciones ejecutadas con Node 24.19.0.

- `npx tsc --noEmit`: pasó, exit 0.
- `npm test -- --runInBand`: 14 suites y 80 tests pasaron, exit 0.
- `npx expo-doctor`: 21/21 controles pasaron, exit 0.
- Export Android: bundle Hermes generado, exit 0; salida temporal `/private/tmp/lizto-priority-android-final`.
- `git diff --check`: sin errores.
- Búsqueda de any en app/src: sin coincidencias.
- No hubo tests contra datos reales del backend; el transporte se intercepta y los contratos se basan en código local leído. Esto no constituye E2E con servidor/dispositivo.
- **Pendiente de Definition of done:** compilación y ejecución de un build de desarrollo Android. No hay SDK/adb ni JDK utilizable en esta máquina. El bundle no reemplaza esa prueba. Secure Store real, teclado, safe areas, fuentes, apariencia y errores de almacenamiento se deben comprobar en dispositivo. El proyecto sigue sin expo-dev-client; preparar ese entorno antes del recorrido nativo.
- npm reporta 75 alertas de dependencias (20 moderate, 54 high, 1 critical) en el árbol completo; no se evaluó alcance en runtime ni se ejecutó una actualización masiva o forzada. Ese análisis queda para una entrega dedicada.

### Pendiente para la siguiente entrega

A08: centralizar completamente resolución de roles, quitar reservas fijas, vincular preferencia a usuario y eliminar decisiones de rol en pantallas. A09/A10: terminar revisión de contratos/configuración comercial; no se afirma resuelta toda la deuda de arquitectura. UX de historial/polling, accesibilidad en dispositivo y recorrido real permanecen pendientes. Registro/contratación/agenda/KYC siguen fuera de esta entrega.

Corrección a la auditoría inicial A11: el mock exportado de useAppFonts era ineficaz, pero `jest.setup.js` ya controlaba expo-font, por lo que las pruebas sí ejercitaban esos estados. Se eliminó el mock redundante y se comprobó la conducta; la apariencia y resolución nativa de fuentes continúan siendo verificación manual.

Desvíos/limitaciones explícitos: notas de contratos antiguas frente a backend actual, IDs numéricos descartados sin usarlos en dominio, backend con precio fijo decimal adaptado explícitamente, roles de A08 aún pendientes y validación nativa no cumplida. Esta entrega tiene correcciones implementadas y validación automática aprobada; no se declara lista para publicación ni Definition of done nativo completa.
