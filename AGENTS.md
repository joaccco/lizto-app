# Reglas permanentes — lizto-mobile

> Este archivo es la fuente de verdad de las reglas del repositorio.
> Se aplica a **todo** cambio, sin excepción y sin que haga falta repetirlo en cada prompt.
> Si un prompt contradice este archivo, **gana este archivo** y hay que reportar la contradicción.
>
> Última verificación contra `lizto-api`: 2026-08-22.

---

## Qué es este proyecto

App móvil de Lizto, marketplace de servicios a domicilio en Argentina.

- **Una sola app** para iOS y Android, con dos roles: cliente y profesional. Un profesional también contrata servicios.
- Repositorio remoto: `https://github.com/joaccco/lizto-app`
- Consume `lizto-api` (Laravel 13, DDD por capas). No se modifica `lizto-api` desde este repo.
- Stack: Expo + Expo Router + TypeScript strict + NativeWind + TanStack Query + Zustand + Zod.

---

## Contratos verificados de `lizto-api`

Estos datos fueron leídos del código real. **No los adivines ni los cambies sin verificar.**

### Autenticación

- Laravel Sanctum, personal access tokens. Encabezado `Authorization: Bearer <token>`.
- `POST /v1/auth/login` → `{ data: { user, token }, message }`
- `POST /v1/auth/register` → mismo shape, HTTP 201
- `POST /v1/auth/logout` · `GET /v1/auth/me`
- Todas las rutas `/v1` restantes exigen `auth:sanctum`.

### Roles

Se gestionan con **spatie/laravel-permission**. Los nombres exactos son:

```
admin · client · provider · moderator
```

En la app solo existen dos roles activos: **`provider`** y **`client`**. Escritos así, en inglés y en minúscula. No uses `pro`, `professional` ni `cliente` como valor de dato — `(pro)` y `(cliente)` son nombres de carpeta de rutas, no valores del dominio.

### Identificadores

Los recursos se exponen por **`uuid`**, no por id numérico. Los esquemas de validación deben esperar string uuid.

### Forma de las respuestas

`{ "data": ... }`. **No hay envelope de paginación ni metadatos.**

### Instantes

Se serializan con `toISOString()` → UTC con sufijo `Z`. Siempre con offset explícito.

---

## Invariantes que no se negocian

### 1. El estado del servidor tiene un solo dueño

TanStack Query es dueño de **todo** dato que venga de la API. Zustand se usa **exclusivamente** para estado local del dispositivo: rol activo, borradores de formulario, preferencias de UI.

**Prohibido copiar datos del servidor dentro de un store de Zustand.** El usuario autenticado se lee de `useMe()`, nunca de un store.

### 2. El rol se resuelve una sola vez

El rol activo se decide en el layout raíz eligiendo entre grupos de rutas. **Prohibido** que un componente de pantalla pregunte por el rol para decidir qué renderizar.

```
app/(auth)      login y recuperación
app/(pro)       pantallas del profesional
app/(cliente)   pantallas del cliente
app/(shared)    idéntico para ambos
```

El rol activo inicial se deriva de los roles reales del usuario. Si tiene uno solo, ese. Si tiene los dos, el último que usó. **Nunca un valor por defecto fijo.**

### 3. Toda respuesta se valida en el borde

Cada respuesta pasa por un esquema Zod antes de llegar a un componente. Un contrato roto falla en el borde con un error identificable, no tres capas adentro con un `undefined`.

**No existe `any` en el código de la aplicación.** Los tipos se derivan de los esquemas, no se escriben dos veces.

### 4. Dinero

Entero en la unidad mínima de la moneda + código ISO de moneda. Nunca decimal, en ningún punto. El formateo a texto ocurre solo en presentación.

Si un endpoint devuelve el importe como decimal, se convierte en el borde **y se reporta como deuda de backend**. No se normaliza en silencio.

### 5. Tiempo

Todo instante lleva offset explícito. **Prohibido** comparar, ordenar o filtrar usando representaciones de hora local en texto. La conversión a `America/Argentina/Buenos_Aires` ocurre solo en presentación.

Existe un bug conocido de desfase de tres horas en el backend originado exactamente en ese error. No lo reproduzcas del lado de la app.

### 6. Textos y configuración de negocio

Todo texto visible pasa por i18n, con `es-AR` como único idioma publicado. Cero literales de texto dentro de componentes.

Los parámetros que el negocio querría ajustar sin publicar versión nueva —radio de búsqueda, umbrales de urgencia, categorías, comisión— **se leen del servidor**. Si uno aparece como constante en el código, es un defecto.

### 7. Credenciales

Los tokens viven solo en `expo-secure-store`. **Nunca** en AsyncStorage ni sin cifrar. El logout los borra de forma verificable.

### 8. La capa de red no navega

Ante un 401 el cliente HTTP limpia la sesión; el layout raíz reacciona a ese cambio de estado. **Prohibida** la navegación imperativa desde la capa de red.

### 9. Privacidad de domicilios

La dirección exacta y las coordenadas exactas **solo se muestran cuando el trabajo está confirmado**. Antes de eso, únicamente zona aproximada.

Si un endpoint envía el dato exacto antes de la confirmación, la app **no lo muestra** y se **reporta como defecto de backend**. Ocultarlo en la interfaz no es una solución: el dato sigue viajando.

### 10. Nada inventado

Prohibido crear datos simulados, valores por defecto inventados o mocks silenciosos para que una pantalla "se vea bien". Si falta un endpoint o un campo, la app lo trata como ausente y se reporta.

---

## Cómo trabajar en este repositorio

- **Un cambio por prompt.** No unifiques prompts ni adelantes trabajo de otro.
- **No inventes endpoints.** Si algo que necesitás no existe en `lizto-api`, decilo en el resumen y dejá la integración detrás de una interfaz.
- **No modifiques `lizto-api`.** Si el backend necesita cambios, listalos como trabajo separado.
- **No agregues dependencias** que no estén justificadas por el prompt. Cada dependencia nueva se explica en el resumen.
- **No construyas pantallas fuera del alcance**, ni siquiera como placeholder vacío.
- **No debilites un test para que pase.** Si un test empieza a fallar, entendé por qué antes de tocarlo.
- **Expo Go no es el entorno de referencia.** Asumí build de desarrollo.

## Definition of done

Un cambio no está terminado hasta que:

1. `npx tsc --noEmit` pasa sin errores.
2. `npm test` pasa.
3. `npx expo-doctor` no reporta incompatibilidades.
4. La app compila y corre en un build de desarrollo de Android.
5. No hay `any`, ni literales de texto en componentes, ni URLs hardcodeadas.
6. El resumen lista: endpoints consumidos, endpoints faltantes, defectos de backend detectados, dependencias agregadas y desvíos de estas reglas.

---

## Regla 11 · Un test que no puede fallar no es un test

Prohibido escribir aserciones tautológicas: verificar que un componente recibió la prop que se le pasó, que una constante vale lo que dice, o que un valor mockeado es el valor del mock. Esos tests siempre pasan y producen confianza falsa, que es peor que no tener cobertura.

Un test vale cuando **existe un cambio realista en el código que lo haría fallar**. Antes de escribir uno, respondé eso. Si no hay respuesta, no lo escribas.

Cuando algo **no se puede verificar automáticamente** —resolución de tipografías nativas, apariencia de un desenfoque, entrega de un push, permisos del sistema operativo— decilo explícitamente y proponé la verificación manual que corresponda. **No lo cubras con un test simbólico.** Reportar "esto solo se verifica en dispositivo" es una respuesta correcta y esperada; simular cobertura no lo es.
