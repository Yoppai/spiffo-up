## 1. Infraestructura base

- [x] 1.1 Crear `src/i18n/config.ts` con inicialización de `i18next` + `initReactI18next`, resources desde `src/locales/`, y `useSuspense: false`. Importar en `index.tsx` antes de `render()`.
- [x] 1.2 Definir `src/themes/default-dark.ts` con `ThemePalette` tipada (primary, secondary, background, success, warning, error, focus, text) y exportar `defaultDarkTheme`.
- [x] 1.3 Crear hook `useTheme()` en `src/hooks/use-theme.ts` que lee `themeId` del `settings-store` y retorna la paleta resuelta (solo `default-dark` por ahora).
- [x] 1.4 Conectar `settings-store.ts` con `LocalInventoryService`: al inicializar, cargar settings desde DB; al llamar `updateSettings`, persistir inmediatamente vía `updateSettings()` del service.
- [x] 2.1 Extender `NavigationState` en `src/types/index.ts` con `globalRightCursor: number` y `globalRightMode: 'list' | 'language' | 'theme' | 'backup-path'`.
- [x] 2.2 Añadir helpers al `app-store.ts`: `moveGlobalRightCursor(delta, itemCount)`, `setGlobalRightMode(mode)`, `resetGlobalRightUi()`.
- [x] 2.3 Actualizar `main-menu-screen.tsx`: cuando `focusedPanel === 'right'` y `globalMenuIndex === 3`, delegar input a `handleGlobalSettingsInput()` en lugar de `moveActiveServersCursor`.
- [x] 2.4 Implementar `handleGlobalSettingsInput()` en archivo nuevo `src/screens/main-menu/global-settings-input.ts`: `↑↓` mueve cursor, `ENTER` entra a modo, `ESC` sale de modo/sub-modo.

## 3. Panel de Configuración Global

- [x] 3.1 Crear `src/screens/global-settings/global-settings-panel.tsx`: renderiza lista de 3 opciones con cursor, usa `useTranslation` y `useTheme`.
- [x] 3.2 Crear sub-componente `LanguageSelector`: lista vertical `es` / `en`, cambia idioma vía `i18next.changeLanguage()` y persiste.
- [x] 3.3 Crear sub-componente `ThemeSelector`: lista vertical de themes disponibles (solo `default-dark` inicialmente), persiste `themeId`.
- [x] 3.4 Crear sub-componente `BackupPathInput`: usa `ink-text-input` para editar path, valida permisos de escritura con `fs.accessSync`, muestra error en rojo si falla.
- [x] 3.5 Exportar `GlobalSettingsPanel` desde `src/screens/index.ts`.
- [x] 4.1 Actualizar `main-menu-view.tsx`: importar `GlobalSettingsPanel` y renderizarlo en `GlobalPreview` cuando `selectedMenu.id === 'global-settings'`.
- [x] 4.2 Asegurar que `ArchivedServersPanel` (stub) se renderice para `archived-servers`, manteniendo `ServerList` para `active-servers`.
- [x] 4.3 Verificar que `LayoutShell` reciba el `rightTitle` correcto (`Global Settings`, `Archived Servers`) según selección.

## 5. Traducciones

- [x] 5.1 Expandir `src/locales/es.json` con namespaces: `header`, `footer`, `systemStatus`, `menu`, `settings`, `common`.
- [x] 5.2 Expandir `src/locales/en.json` con las mismas claves traducidas al inglés.
- [x] 5.3 Reemplazar strings hardcodeados en `Header.tsx`, `Footer.tsx`, `SystemStatus.tsx`, `main-menu-view.tsx` (labels de menú) por `t('...')`.
- [x] 5.4 Reemplazar strings hardcodeados en `GlobalSettingsPanel` y sub-componentes por `t('...')`.

## 6. Tests

- [x] 6.1 Agregar tests a `app-store.test.ts` (o crearlo) para `moveGlobalRightCursor`, `setGlobalRightMode`.
- [x] 6.2 Agregar tests de render para `GlobalSettingsPanel` usando `ink-testing-library`: verificar que las 3 opciones se renderizan y el cursor responde a input.
- [x] 6.3 Agregar tests para `useTheme`: retorna paleta correcta para `default-dark`.
- [x] 6.4 Verificar que `bun test` pasa sin regresiones en tests existentes.
