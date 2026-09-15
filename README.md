# Lizto mobile

App React Native + Expo para clientes y profesionales. Diseño oscuro con Manrope, IBM Plex Mono, violeta y verde lima. El avance y la comparación con web están en [docs/MOBILE_ROADMAP.md](docs/MOBILE_ROADMAP.md).

## Ver el frontend en tu Mac

Desde una terminal:

```sh
cd /Users/joacofrn/LIZTO/lizto-mobile
npm install
npm run dev
```

Abrí http://localhost:8081. Es la app móvil renderizada en el navegador mediante React Native Web. Los cambios se actualizan con Fast Refresh. No es la aplicación Next.js de `lizto-web`.

Si 8081 está ocupado, detené la instancia anterior con Ctrl+C o usá `npm run web -- --port 8082`.

Inicio y catálogo son públicos. Solicitudes y cuenta requieren una sesión real para consultar datos privados. En web la sesión es temporal en memoria: al recargar hay que volver a ingresar. En iOS/Android se usa Secure Store.

## Conectar la API

El frontend necesita Laravel para mostrar categorías, perfiles y solicitudes. Si no está disponible se muestra un error con reintento; no se inventan datos.

El archivo local `.env.local` puede contener:

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

`npm start` inicia Metro. Para un cliente de desarrollo personalizado ya instalado, `npm run dev:native` inicia Metro con `--dev-client`. El paquete expo-dev-client no se añadió en esta entrega; incorporarlo antes de preparar ese tipo de cliente. Expo Go no es el entorno de referencia.

La vista de navegador permite trabajar en navegación y diseño, pero no verifica permisos, almacenamiento nativo, notificaciones ni apariencia exacta de blur/tipografía en dispositivo.

## Comprobaciones

```sh
npm run typecheck
npm test -- --runInBand
npm run doctor
npm run export:web
```

Usar una versión de Node admitida por React Native 0.86: `^20.19.4`, `^22.13.0`, `^24.3.0` o `>=25`. La instalación local encontrada es Node 23.6.0 y produce avisos de compatibilidad, aunque el servidor web inició.

Referencia oficial: https://docs.expo.dev/workflow/web/
