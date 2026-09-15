# Lizto mobile: estructura y paridad con web

Revisión del código local: 8 de septiembre de 2026. La web es una referencia funcional y visual; los contratos se verifican contra Laravel. No se copian mocks, almacenamiento web ni componentes HTML a React Native.

## Comparación funcional

| Área | Web | Mobile al comenzar | Avance de esta entrega / pendiente |
| --- | --- | --- | --- |
| Ingreso | Login y registro | Login con selector de rol | Login conectado; rol derivado del perfil y acceso a exploración pública. Registro pendiente. |
| Inicio y categorías | HomeScreen y CategoryGrid | Inicio cliente básico | Inicio nuevo y categorías de la API. |
| Catálogo | Búsqueda, browse, fast-mode y perfiles | Ausente | Lista paginada por categoría. Detalle público y contratación pendientes. |
| Crear solicitud | Descripción, parser y cuestionario | Ausente | Pendiente: completar como flujo funcional con ubicación, agenda y confirmación. |
| Solicitudes del cliente | Listado y tarjetas de estado | Ausente | Listado paginado, estados, fechas y acceso al chat existente. Acciones de trabajo pendientes. |
| Bandeja profesional | Dashboard, agenda, confirmaciones | Lista y detalle de solicitudes | Se conserva; pantalla extraída a features y acceso a cuenta. Agenda pendiente. |
| Ofertas | Negociación y preguntas | OfferSheet y QuestionSheet | Se conserva. Requiere recorrido conectado y revisión de dinero/contratos. |
| Chat | Conversaciones por trabajo | Chat por ID, consulta cada 3 segundos | Se conserva y conecta desde solicitudes del cliente. No se inventa bandeja global sin endpoint. |
| Cuenta | Perfil y onboarding | Logout en inicios | Pantalla compartida con perfil, logout y cambio de rol cuando ambos existen. Edición pendiente. |
| Verificación | KYC, Didit y administración MVU | Ausente | Onboarding profesional pendiente; administración permanece web. |
| Ubicación y seguimiento | Mapas y tracking | Ausente | Pendiente de permisos, contratos de privacidad y pruebas nativas. |
| Finalizar y calificar | Presupuestos, completar, reseñas | Parcial en detalle profesional | Pendiente de paridad y validación integral. |
| Notificaciones | Firebase y service worker | Sin integración móvil completa | Pendiente de build de desarrollo, permisos y prueba de entrega real. |

## Estructura adoptada

```text
app/                              # Rutas pequeñas y layouts de navegación
  _layout.tsx                     # Proveedores, fuentes, sesión y elección de rol
  (auth)/login.tsx
  (cliente)/
    _layout.tsx                   # Pestañas: Inicio, Explorar, Solicitudes, Cuenta
    index.tsx
    catalog.tsx
    requests.tsx
    account.tsx
  (pro)/
    _layout.tsx
    index.tsx
    account.tsx
    requests/[id].tsx
  chat/[id].tsx
src/
  components/
    layout/                       # Screen y SignInPrompt
    ui/                           # Tipografía, botones, estados, tarjetas
  config/                         # Configuración por entorno
  core/
    api/                          # HTTP y validación en el borde
    domain/                       # Dinero y tiempo
    i18n/                         # Textos es-AR
    navigation/                   # Reglas de redirección de sesión
    security/                     # Secure Store; memoria temporal para web
  features/
    auth/                         # API, esquemas y sesión local
    catalog/                      # API, esquemas, componentes y pantallas
    client-requests/               # API, esquemas y pantallas
    account/screens/              # Vista compartida de cuenta
    work-requests/                 # Bandeja profesional y detalle
    offers/                       # Ofertas y preguntas existentes
    chat/                         # Conversaciones existentes
__tests__/
docs/
```

Cada funcionalidad agrega `api`, `schemas`, `components` y `screens` solo cuando necesita archivos reales. No se crean pantallas vacías para simular avance. Las rutas de detalle profesional y chat existentes se pueden extraer a `features/.../screens` al trabajar sobre esos flujos.

TanStack Query es dueño de los datos remotos. Zustand conserva la sesión y preferencias locales. Las respuestas nuevas pasan por Zod; las categorías son slugs (excepción real a UUID). El catálogo público está disponible sin login. Las consultas personales están deshabilitadas sin token. El backend sigue siendo responsable de permisos.

## Contratos utilizados

- `GET /api/v1/categories`: categorías y sus hijos, identificados por slug.
- `GET /api/v1/providers?category=...&page=...`: catálogo, con `meta.current_page`, `per_page`, `total`.
- `GET /api/v1/requests?page=...`: solicitudes del cliente, con `meta.last_page`.
- `GET /api/v1/auth/me`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`: perfil y sesión.
- Se reutiliza el chat existente bajo `/conversations/{uuid}/messages` y la bandeja `/provider/work-requests`.

No faltan endpoints para las vistas nuevas de esta entrega. La creación de solicitudes, registro, detalle público, agenda y KYC tienen backend, pero su interfaz móvil todavía debe implementarse. No se encontraron endpoints de bandeja global de conversaciones o de configuración pública de parámetros comerciales en el archivo de rutas revisado; verificar nuevamente al abordarlos.

## Hallazgos para backend y deuda previa

1. `ProviderController::formatPublicProfile` devuelve email, dirección y coordenadas exactas en el catálogo público. El esquema móvil elimina estos campos antes de entregar datos a componentes; esto no elimina la exposición en la red y requiere corregir el servidor.
2. Ese mismo método contiene valores de reserva inventados (distancia fija, dirección, coordenadas, experiencia y otros). Esta entrega no muestra distancias, domicilios ni experiencia; los datos del servidor deben corregirse en origen.
3. Las notas de AGENTS.md dicen que no hay paginación ni catálogo público, pero las rutas y controladores actuales sí tienen ambos. La implementación sigue el contrato real.
4. El catálogo devuelve categorías por slug y algunos endpoints ofrecen identificadores mixtos. Las vistas nuevas exigen UUID en profesionales y solicitudes.
5. El backend usa importes decimales en partes de ofertas y presupuestos. La integración existente móvil necesita una revisión separada de conversión a unidad mínima y moneda. Las vistas nuevas no muestran importes.
6. La pantalla de detalle de solicitud del backend merece una revisión de autorización: el método `show` inspeccionado no tiene una llamada explícita a Gate antes de devolver el recurso. Esta entrega consume el listado filtrado por cliente.
7. Los archivos previos de mobile aún contienen `any`, textos fuera de i18n y constantes comerciales. Se corrigieron los puntos tocados del cliente HTTP y bandeja, no se declara resuelta toda esa deuda.
8. La web tiene imports de datos de ejemplo y algunas pruebas llamadas E2E que simulan HTTP. No constituyen evidencia de paridad nativa ni de un recorrido real de punta a punta.

## Próximas entregas sugeridas

1. Registro y creación de solicitud: descripción → preguntas → ubicación/agenda → resumen confirmado.
2. Perfil público, selección y negociación, conectados con el trabajo y chat existentes.
3. Agenda profesional, presupuestos finales, cierre y reseñas.
4. Verificación de identidad, notificaciones y seguimiento con permisos del dispositivo.
5. Recorridos completos en builds de desarrollo de Android e iOS; revisión de accesibilidad y publicación.

## Dependencias y límites

Se agrega react-native-web para ver el mismo frontend móvil en la Mac. Se restauran Jest, jest-expo, el preset de React Native, tipos de Jest, Testing Library y react-test-renderer para ejecutar las pruebas existentes y las nuevas. No se incorpora otra biblioteca de UI.

No se modificó el backend ni la web. La exploración pública y las varias vistas de esta entrega siguen el alcance expresamente solicitado por el usuario, aunque las reglas históricas del repositorio hablan de un cambio por prompt. Se conservan los cambios locales previos de package.json, configuración de Expo, URL de API y assets.
