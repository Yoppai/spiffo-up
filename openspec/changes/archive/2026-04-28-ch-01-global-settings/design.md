## Context

El layout shell (`src/components/layout-shell.tsx`) ya renderiza correctamente el header, system status, footer y paneles 35/65. El problema actual es que el panel derecho solo sabe renderizar "Active Servers" o "Coming Soon". No existe UI state para navegar interactivamente dentro del panel derecho cuando el menú global selecciona otras opciones como `global-settings`.

`settings-store.ts` existe con `locale`, `theme`, `backupPath` pero no sincroniza automáticamente con SQLite. `LocalInventoryService` puede leer/escribir settings, pero hoy solo se usa en bootstrap. `i18next` y `react-i18next` están en `package.json` pero no inicializados.

## Goals / Non-Goals

**Goals:**
- Permitir navegación interactiva completa en el panel derecho para `global-settings`.
- Inicializar i18n y traducir todos los strings visibles en el flujo global (header, footer, system-status, menú, settings).
- Definir la paleta de colores del tema por defecto como objeto TypeScript tipado.
- Persistir cambios de settings a SQLite inmediatamente.

**Non-Goals:**
- No traducir Server Dashboard ni wizard (ch-04).
- No implementar file picker nativo (ch-12).
- No validar con Zod (ch-19).
- No soportar múltiples temas JSON dinámicos (ch-03).

## Decisions

### 1. UI State Global: extender `NavigationState` con campos dedicados
En vez de un mapa genérico, añadimos `globalRightCursor: number` y `globalRightMode: 'list' | 'language' | 'theme' | 'backup-path'` a `NavigationState`. Esto es suficiente para ch-01 y ch-02 puede reutilizar `globalRightCursor` con su propia semántica de modo.
- **Rationale:** `DashboardPanelUiState` fue diseñado para server dashboard con `subView: DashboardSubView` y `drafts`. Mezclar concerns globales con server dashboard complejiza el type system. Un par de campos simples en `NavigationState` es más claro.
- **Alternativa considerada:** Usar `dashboardPanels` con clave string. Rechazada porque forzaría a redefinir tipos y `subView` no encaja bien con modos de settings.

### 2. i18n: inicializar en `index.tsx` o `app.tsx`
Se inicializa `i18next` en un archivo separado `src/i18n/config.ts` importado desde `index.tsx` antes del `render()`.
- **Rationale:** Evita side effects en componentes. Permite usar `useTranslation` en cualquier componente sin preocuparse por orden de import.

### 3. Backup Path: input de texto inline
Se reutiliza el patrón de `ink-text-input` (ya usado en wizard) para editar el path.
- **Rationale:** No inventar un componente de file picker cuando ch-12 lo hará. El input de texto es suficiente para el MVP y permite al usuario pegar una ruta.

### 4. Tema: `src/themes/default-dark.ts` con tipo `ThemePalette`
Se define un objeto TypeScript exportado con colores tipados. El store guarda el `themeId` (`'default-dark'`), y los componentes resuelven la paleta por ID.
- **Rationale:** ch-03 convertirá esto a archivos JSON y un loader dinámico. Empezar con TS da type safety inmediata.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Extender `NavigationState` rompe tests existentes de `app-store.ts` | Los tests se actualizarán como parte de ch-01. El cambio es aditivo (nuevos campos con defaults), no debería romper lógica existente. |
| `react-i18next` puede no funcionar bien con Ink 7 en SSR-like environment | Se usará `initReactI18next` con `react: { useSuspense: false }` para evitar problemas de hidratación en TUI. |
| Cambio de tema en runtime requiere re-render de toda la app | Zustand subscription en `settings-store` fuerza re-render. Ink maneja esto bien. |
| Input de texto para backup path no valida existencia del directorio | Se muestra mensaje de error manual si `fs.existsSync` / `fs.accessSync` falla. Zod llega en ch-19. |

## Open Questions

- ¿El selector de idioma debe mostrar los nombres nativos ("Español" / "English") o traducidos según idioma actual? Decisión: nativos, como es convención estándar.
- ¿El theme preview debe mostrar una mini-barra de colores en el selector? Decisión: no en ch-01; ch-03 lo hará.
