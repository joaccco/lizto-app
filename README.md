# Lizto mobile

App React Native + Expo para clientes y profesionales. Diseño oscuro con Manrope, IBM Plex Mono, violeta y verde lima. El avance y la comparación con web están en [docs/MOBILE_ROADMAP.md](docs/MOBILE_ROADMAP.md).

Para retomar las próximas implementaciones y sus motivos, leer [el roadmap compartido](docs/ROADMAP-IMPLEMENTACIONES.md), que reúne el contexto de la auditoría, Trello y `lizto-engineering`.

La [primera etapa: alcance y contratos](docs/ETAPA-1-ALCANCE-Y-CONTRATOS.md) registra los endpoints actuales, desajustes y requerimientos para coordinar con backend.

## Ver el frontend en tu Mac

Desde una terminal:

```sh
cd /Users/joacofrn/LIZTO/lizto-mobile
npm install
npm run dev
```

Abrí http://localhost:8081. Es la app móvil renderizada en el navegador mediante React Native Web. Los cambios se actualizan con Fast Refresh. No es la aplicación Next.js de `lizto-web`.

Si 8081 está ocupado, detené la instancia anterior con Ctrl+C o usá `npm run web -- --port 8082`.

Inicio y catálogo son públicos. Solicitudes y cuenta requieren una sesión real para consultar datos privados. El navegador permite explorar el catálogo; el inicio de sesión requiere Android/iOS porque las credenciales se guardan exclusivamente en Secure Store. Un error de almacenamiento se informa y bloquea la sesión hasta resolverse.

## Conectar la API

El frontend necesita Laravel para mostrar categorías, perfiles y solicitudes. Si no está disponible se muestra un error con reintento; no se inventan datos.

La URL de API es obligatoria. El archivo local `.env.local` puede contener:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Existe `.env.example` como referencia. `.env.local` está excluido de Git y tiene prioridad sobre `.env`. Reiniciá Expo después de cambiarlo.

En otra terminal, para el navegador o el simulador iOS:

```sh
cd /Users/joacofrn/LIZTO/lizto-api
php artisan serve --host=127.0.0.1 --port=8000
```

La base de datos configurada por Laravel debe estar disponible. No ejecutar migraciones destructivas ni seeders para completar una vista. Si usás PostgreSQL/Redis de Docker, el proyecto de la API incluye su compose de desarrollo.

Para un teléfono físico en la misma Wi-Fi, Laravel debe escuchar en `0.0.0.0` y Expo debe iniciarse en modo LAN. El resolvedor de desarrollo ya deriva el host de Expo cuando la URL configurada usa localhost. En un emulador Android se puede configurar `http://10.0.2.2:8000/api/v1` según la red del emulador.

## Desarrollo nativo

```sh
cd /Users/joacofrn/LIZTO/lizto-mobile
npm run ios       # Compila y abre un simulador con Xcode/CocoaPods disponibles
npm run android   # Requiere Android SDK, JDK y emulador o dispositivo
```

`npm start` inicia Metro. Para un cliente de desarrollo personalizado ya instalado, `npm run dev:native` inicia Metro con `--dev-client`. El paquete `expo-dev-client` está incorporado para ese cliente. Expo Go no es el entorno de referencia.

La vista de navegador permite trabajar en navegación y diseño, pero no verifica permisos, almacenamiento nativo, notificaciones ni apariencia exacta de blur/tipografía en dispositivo.

## Comprobaciones

```sh
npm run typecheck
npm test -- --runInBand
npm run doctor
npm run export:web
```

Usar una versión de Node admitida por React Native 0.86: `^20.19.4`, `^22.13.0`, `^24.3.0` o `>=25`. La versión mínima también se declara en package.json; un Node anterior puede fallar al compilar o instalar. El archivo `.nvmrc` fija Node 22.23.3 para este proyecto (`nvm install` y `nvm use` si utilizás nvm). En este equipo se instaló esa versión mediante Homebrew y se activó como `node` predeterminado.

Referencia oficial: https://docs.expo.dev/workflow/web/

Pruebas opcionales contra una API local real (crean cuentas de prueba mediante registro):

```sh
LIZTO_LIVE_API_URL=http://127.0.0.1:8000/api/v1 npm run test:api
```

La suite sólo admite loopback y mantiene los tokens en memoria. No reemplaza la comprobación nativa de Secure Store, navegación ni ejecución en Android/iPhone.

Con Xcode 27 / iOS 27, `expo-build-properties` activa `ios.enableSceneSupport` en `app.config.ts`. Es necesario para que UIKit permita arrancar la app; después de modificar plugins hay que regenerar y recompilar el proyecto iOS. No basta recargar Metro.

La integración OAuth nativa (Google/Facebook), el contrato implementado y los pasos de validación están detallados en [el contrato móvil](docs/OAUTH-MOBILE-CONTRATO.md). Copiar `.env.example` a `.env.local` y completar sólo la configuración del entorno. Ambos pares de credenciales deben estar completos o ausentes; no incluir secretos de servidor. Agregar o cambiar la configuración de los SDKs exige un nuevo build de desarrollo. El login y la vinculación desde Mi cuenta consumen las rutas reales de API; Google y Facebook tienen vinculación e ingreso confirmados por Mateo en iPhone; Apple y la validación nativa Android siguen pendientes.
