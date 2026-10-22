# Registro móvil

## Alcance

Entrega 2026-10-21 solicitada por Mateo después de publicar la recuperación de contraseña. Acceso desde «Crear cuenta» en la pantalla de ingreso; formulario nativo con nombre, correo, contraseña y confirmación. Conserva el estilo y espaciado del resto de acceso; ajusta insets del teclado en iOS. No solicita rol ni añade una habilitación profesional. La API asigna `client`; el onboarding profesional se implementa por separado.

## Contrato existente

POST público `/api/v1/auth/register`, sin Bearer: `{name,email,password,password_confirmation}`. Teléfono es opcional en API y no se agrega un dato inventado al formulario. HTTP 201 `{data:{user,token},message}` validado por registerResponseSchema. Nombre requerido hasta 255 caracteres, email válido, contraseña de al menos ocho caracteres con mayúscula ASCII y número, confirmación idéntica. No hay nuevas rutas ni modificaciones de API por el registro móvil.

El alta devuelve una sesión real: se guarda el token en Secure Store y el layout raíz consulta GET `/api/v1/auth/me` y resuelve el rol. La pantalla no elige rol ni navega según valores locales del usuario. Se eliminan consultas anteriores al establecer sesión; datos de usuario nunca se copian a Zustand. El alta y su resultado pertenecen a TanStack Query.

422 resalta campos validados y conserva entradas para corregir; email rechazado se informa con traducción local, sin imprimir detalles arbitrarios de servidor. 429 se diferencia de error de red/servidor. Se impiden pulsaciones duplicadas. Si ya se creó la cuenta y falla Secure Store, se limpian los campos sensibles y se ofrece reintentar guardar la misma sesión, sin ejecutar otra alta. La web se rechaza antes de enviar datos, porque el acceso seguro de esta entrega es nativo.

## Evidencia y pendientes

TypeScript, 157 pruebas móviles en 23 suites y Expo Doctor 21/21 pasan; se conservan las 148 pruebas anteriores. Nueve regresiones del registro: payload real sin rol inventado, sesión segura, aislamiento de caché, email inválido/ocupado y reintento, confirmación, duplicación, HTTP 429/503, UUID roto, fallo/reintento de almacenamiento y bloqueo web.

Cinco pruebas de integración contra API local real pasan, incluyendo registro/UUID, login, perfil y logout. Son cuentas de pruebas creadas por API, sin editar roles manualmente. Mateo confirmó en el build de desarrollo de iPhone que pudo crear una cuenta nueva y entrar automáticamente. Android no compilado ni ejecutado por falta de entorno disponible. Sin dependencias nuevas, endpoints faltantes ni nuevos defectos backend detectados por esta entrega. El defecto conocido de domicilios exactos antes de confirmación permanece fuera del alcance.

## Publicación previa de recuperación

API `2f69793` y app `c1a2618`, ambos subidos a main y sincronizados con origin/main antes de iniciar este registro. Correo de recuperación real sigue pendiente de proveedor/ambiente; Mailpit sólo funciona como bandeja local. El registro de esta entrega no envía ni verifica correo.
