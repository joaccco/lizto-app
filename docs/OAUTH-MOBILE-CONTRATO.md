# OAuth móvil — Google y Facebook

Implementado el 2026-10-21 con autorización explícita de Mateo para trabajar y publicar en API durante la ausencia de Joaco. Apple queda pendiente de membresía Apple Developer paga.

## Contrato HTTP

Base `/api/v1`. Todos los endpoints son POST JSON.

- `/auth/oauth/challenge`: público, recibe `{ "provider": "google" }` o `facebook`; devuelve `{ "data": { "nonce": "64 caracteres hexadecimales", "expires_at": "instante UTC con Z" } }`.
- `/auth/oauth/login`: público, recibe `{ "provider", "kind", "value", "nonce" }`; devuelve el envelope habitual `{ "data": { "user", "token" }, "message" }` con token Sanctum.
- `/auth/oauth/link/challenge`: mismo pedido/respuesta que challenge, requiere Bearer Sanctum; desafío ligado al usuario autenticado.
- `/auth/oauth/link`: mismo cuerpo que login, requiere Bearer Sanctum; devuelve `{ "data": { "user" }, "message" }`. Conserva la sesión existente y no emite otro token.

`kind`: `google_id_token`, `facebook_limited_token` (iOS) o `facebook_access_token` (Android). `value` contiene la prueba del SDK, nunca un token de sesión Lizto. Primero se solicita desafío, después se entrega su nonce al SDK y finalmente se intercambia la prueba. Cada desafío sirve una vez; cualquier fallo exige comenzar nuevamente. TTL configurable, acotado a 30–600 segundos, predeterminado 300. Limitación de solicitudes también aplica a estas rutas.

## Identidad y seguridad

Se identifica por proveedor + subject verificado; no se fusionan usuarios automáticamente por email. Una cuenta preexistente debe ingresar a Lizto y vincular explícitamente. Tampoco se permite transferir una identidad ni vincular el email de otra cuenta existente. Una cuenta nueva requiere nombre y email verificados disponibles y recibe solamente rol `client`; OAuth no aprueba profesionales. La vinculación no modifica roles.

Google y Facebook Limited: firmas RS256 verificadas contra JWKS oficiales con URL fija, issuer, audience, expiración, subject y nonce. Google exige email verificado para crear cuenta y valida authorized party cuando aparece. La caché de claves limita las recargas por claves desconocidas; una firma inválida no la vacía. Facebook clásico verifica app, vigencia y usuario mediante debug_token y /me; requiere secreto de servidor.

Los desafíos se guardan únicamente como SHA-256 y se consumen atómicamente antes de llamar al proveedor. No se registran cuerpos OAuth ni excepciones del proveedor que puedan contener credenciales. Usuarios suspendidos, eliminados o bloqueados no obtienen sesión. En vinculación una prueba inválida devuelve 422 para no confundirla con una sesión Sanctum vencida.

Errores identificables: `oauth_invalid_challenge` 422, `oauth_invalid_proof` 401 (422 al vincular), `oauth_link_required` / `oauth_identity_conflict` 409, `oauth_profile_incomplete` 422, `oauth_account_restricted` 403, `oauth_not_configured` / `oauth_provider_unavailable` 503. Validación de campos usa 422 y límite de solicitudes 429.

## Instalación del backend

1. Instalar dependencias con `composer install` y ejecutar `php artisan migrate --force` en el ambiente correspondiente, con su procedimiento habitual de respaldo/despliegue.
2. Configurar `GOOGLE_OAUTH_WEB_CLIENT_ID` con el cliente web, `GOOGLE_OAUTH_AUTHORIZED_PARTIES` con los clientes nativos permitidos separados por coma, `FACEBOOK_APP_ID` y, para tokens clásicos Android, `FACEBOOK_APP_SECRET` exclusivamente en el servidor. El client token público móvil de Meta NO reemplaza App Secret. No enviar secretos por chat ni agregarlos a Git.
3. Opcional: `OAUTH_CHALLENGE_TTL_SECONDS`. Regenerar caché de configuración según el despliegue habitual.
4. Mantener activo Laravel Scheduler: `oauth:prune-challenges` elimina desafíos vencidos cada hora. Sin scheduler igualmente no se aceptan desafíos vencidos.
5. Configurar Google consent/test users y plataformas nativas de Meta para el bundle/application ID real. Publicar Git no configura ni despliega automáticamente un servidor.

## Evidencia y pendientes

API publicada en `7b16507` y ampliación de proveedores vinculados en `9766808`. Suite API: 397 pruebas / 2094 aserciones en PostgreSQL aislado. Incluye firmas JWT reales, aislamiento entre cuentas, vinculación, nonce de un uso, conflictos, suspensión, indisponibilidad y límites de solicitudes. Las cinco pruebas móviles contra API real también pasan.

Mateo confirmó en iPhone vinculación e ingreso real con Google y Facebook, recuperando la misma cuenta y ambos roles. Facebook inicialmente falló dentro de limited.facebook.com: el permiso email figuraba sin agregar en Meta. Tras habilitarlo, Mateo confirmó funcionamiento. El requisito de Meta queda incorporado a la instalación: public_profile y email deben estar listos para pruebas; no se solicitan permisos de edad, cumpleaños, amigos o género.

Build iOS Debug compilado, firma verificada con codesign --deep --strict e instalado mediante devicectl. TypeScript, 133 pruebas móviles en 21 suites y Expo Doctor 21/21 pasan. Las pruebas automáticas de SDK usan sustituciones explícitas y no reemplazan la evidencia humana. Mateo también confirmó cancelación sin sesión y reintento exitoso con ambos proveedores en el iPhone. Android sin compilación/ejecución por falta de entorno y Facebook clásico pendiente de App Secret del servidor. Apple pendiente de membresía paga. No se declara cierre de etapa 1 ni despliegue de un ambiente compartido.

Dependencia API agregada: firebase/php-jwt ^7.2 para verificación criptográfica. Composer informa vulnerabilidades preexistentes en guzzlehttp/guzzle, laravel/framework, league/commonmark, league/flysystem y symfony/http-foundation, ajenas a este paquete nuevo; requieren revisión separada. Persiste deuda de privacidad de domicilios exactos antes de confirmación, fuera del alcance OAuth.

## Integración React Native

La app consume las cuatro rutas anteriores, valida cada respuesta con Zod y mantiene el usuario en TanStack Query. Login guarda únicamente el token Sanctum en Secure Store; vincular refresca /auth/me y conserva la sesión. Los SDKs limpian sus credenciales transitorias al terminar; cancelar no inicia sesión. Un resultado tardío no reemplaza una sesión que cambió durante la autorización. En Mi cuenta se ofrecen los proveedores configurados para vincular; en ingreso se muestran para iniciar sesión.

Dependencias móviles: react-native-nitro-google-signin (Google nativo y nonce), react-native-nitro-modules (runtime requerido por ese SDK), react-native-fbsdk-next (Facebook Limited en iOS y clásico en Android). Configuración pública por variables EXPO_PUBLIC; no se incluye App Secret en la app. Plugin local conserva callback Google en regeneraciones CNG. Expo y Expo Router se actualizaron a los parches compatibles indicados por Doctor.

### Botones y estado de vinculación

Google y Facebook comparten un botón con la forma habitual de Lizto, fondo oscuro, texto i18n y logos oficiales locales. El SDK se utiliza para autorizar, sin imponer su botón visual. El recurso de usuario incluye linked_oauth_providers, lista de google/facebook sin subject ni credenciales. Zod admite su ausencia para compatibilidad con APIs todavía no actualizadas; nunca la interpreta como una vinculación confirmada.

Tras /auth/oauth/link, la app actualiza el usuario en TanStack Query y refresca /auth/me. Los botones pasan a «Google vinculado» / «Facebook vinculado» y quedan deshabilitados. Al reabrir se recupera ese estado desde API. El aviso de éxito desaparece a los 30 segundos, con limpieza del temporizador al desmontar, y no borra el estado vinculado. No hay polling ni consultas nuevas desde la pantalla de ingreso.

Las regresiones cubren el plazo del aviso, conservación al remontar, lectura del estado al abrir, bloqueo de nuevas pulsaciones, resultados tardíos de otra sesión, cancelación sin intercambio y reintento con desafío nuevo para Google/Facebook. La apariencia final y el transcurso del aviso en dispositivo requieren observación manual; no se simula esa evidencia.
