## Why

El Menú Global tiene 4 opciones, pero 3 de ellas (`Crear Nuevo Servidor`, `Servidores Archivados`, `Configuración Global`) muestran `"Coming Soon"`. El MVP requiere que `Configuración Global` sea funcional para gestionar idioma, tema y ruta de backups, sentando las bases para i18n y theming del resto de la TUI.

## What Changes

- **Nueva screen** `src/screens/global-settings/` con panel derecho interactivo para editar 3 opciones: idioma, tema y backup path.
- **Infraestructura i18n**: inicializar `react-i18next` en la app, extraer strings hardcodeados de componentes globales (header, footer, system-status, menú, settings) a `src/locales/{es,en}.json`.
- **Tema base**: definir `src/themes/default-dark.ts` con paleta de colores tipada, usada por los componentes globales. El store extiende el theme string a referencia de objeto.
- **UI state global**: extender `NavigationState` con `globalRightCursor` y `globalRightMode` reutilizables para cualquier panel derecho global (settings, archived servers, etc.).
- **Persistencia**: conectar `settings-store.ts` con `LocalInventoryService` para que los cambios se guarden en SQLite tabla `settings` inmediatamente.

## Capabilities

### New Capabilities
- `global-settings-screen`: Pantalla de configuración global con navegación interactiva en el panel derecho.
- `i18n-core`: Infraestructura de internacionalización para componentes globales.
- `theme-core`: Sistema de temas con paleta tipada y theme default.

### Modified Capabilities
- `tui-layout-shell`: El layout shell debe soportar rendering condicional del panel derecho según `globalMenuIndex`, no solo para "Active Servers".

## Impact

- `src/screens/main-menu/main-menu-view.tsx`: reemplazar `"Coming Soon"` por `GlobalSettingsPanel`.
- `src/screens/main-menu/main-menu-screen.tsx`: agregar input handler para navegación en panel derecho global.
- `src/stores/app-store.ts`: nuevos campos en `NavigationState` y helpers de navegación global.
- `src/stores/settings-store.ts`: sincronización bidireccional con `LocalInventoryService`.
- `src/locales/es.json` / `en.json`: expansión masiva de strings globales.
- `src/themes/default-dark.ts`: nuevo archivo de paleta.

## Non-goals

- No se implementa File Picker nativo para backup path (usa input de texto simple; file picker llega en ch-12).
- No se traducen componentes del Server Dashboard ni del wizard (van en ch-04).
- No se implementan validaciones con Zod (van en ch-19).
- No se soportan múltiples themes JSON dinámicos (van en ch-03).
- No se implementa preview visual del tema en el selector (van en ch-03).
