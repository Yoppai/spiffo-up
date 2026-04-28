# Proposal: Archived Servers Screen

## Intent

Reemplazar el stub `ArchivedServersPanel` ("Coming Soon") por una pantalla funcional de servidores archivados con tabla de lista, vista de detalle y acciones stub, siguiendo PRD §2.2.3 y el patrón de sub-vistas establecido en `GlobalSettingsPanel`.

## Scope

### In Scope
- Vista lista: tabla con columnas NAME, PROVIDER, ARCHIVED ON, BACKUP SIZE, STATUS (SAVED/MISSING), ACTIONS.
- Vista detalle: metadatos del servidor + sección de backup + acciones Restore Server y Delete Record.
- Empty state: mensaje "No archived servers found" con explicación de qué es archivar.
- Navegación por teclado: ↑↓ en lista, ENTER para detalle, ESC para volver, TAB para cambiar paneles.
- Confirmación inline destructiva para Delete (patrón `confirmableAction` de dashboard panels).
- Seed data: al menos un servidor con `status='archived'` para testing visual.

### Out of Scope
- Restore real de servidor desde backup (ch-18).
- Archive flow con backup obligatorio + `pulumi destroy` (ch-17).
- Verificación en tiempo real de existencia de archivo en disco (solo lectura de metadatos del store).

## Capabilities

### New Capabilities
- `archived-servers-screen`: Pantalla completa de servidores archivados con sub-vistas lista/detalle, manejo de foco y teclado propio.

### Modified Capabilities
- `local-server-inventory`: Extender `ServerRecord` con campos opcionales `backupPath?: string | null` y `backupSize?: number | null` para persistir metadatos de backup al archivar.
- `i18n-core`: Agregar keys de traducción para títulos, columnas, acciones, empty state y confirmaciones de archived servers.

## Approach

Reutilizar el patrón de `GlobalSettingsPanel`: `globalRightMode` controla sub-vista (`'archived-list'` | `'archived-detail'`), `globalRightCursor` navega filas, y `main-menu-screen.tsx` despacha teclas según modo activo. Crear componentes en `src/screens/archived-servers/` y actualizar `main-menu-view.tsx` para renderizar el nuevo entry point. Agregar un servidor archivado al seed de `servers-store.ts`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/screens/archived-servers/` | New | Entry panel, list view, detail view, keyboard input handler. |
| `src/screens/main-menu/main-menu-view.tsx` | Modified | Renderizar nuevo `ArchivedServersPanel` para `id === 'archived-servers'`. |
| `src/screens/main-menu/main-menu-screen.tsx` | Modified | Dispatch de teclado para `globalRightMode === 'archived-list'` y `'archived-detail'`. |
| `src/types/index.ts` | Modified | Extender `GlobalRightMode` con `'archived-list'` y `'archived-detail'`; extender `ServerRecord`. |
| `src/stores/servers-store.ts` | Modified | Agregar servidor archivado al seed data. |
| `src/locales/{en,es}.json` | Modified | Nuevas keys para contenido de archived servers. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Conflicto de merge con ch-01 en `main-menu-screen.tsx` (ambos usan `globalRightMode`) | Med | Verificar switch-case de keyboard dispatch cubra todos los modos tras merge. |
| Cambios a `ServerRecord` rompen otros componentes | Low | Campos opcionales; `strict: true` en `tsconfig.json` detecta usos inválidos. |

## Rollback Plan

Reemplazar el import en `main-menu-view.tsx` por el stub original. Eliminar carpeta `src/screens/archived-servers/`. Revertir cambios a `types/index.ts`, `servers-store.ts` y locales.

## Dependencies

- `ch-00` (TUI Layout Shell) — completado; proporciona `LayoutShell` y navegación base.
- `ch-01` (Global Settings Screen) — patrón de sub-vistas con `globalRightMode` / `globalRightCursor` ya implementado.

## Success Criteria

- [ ] Lista renderiza servidores con `status='archived'` desde `servers-store`.
- [ ] ↑↓ navega filas en lista; ENTER abre detalle; ESC vuelve a lista o menú.
- [ ] Empty state aparece cuando no hay servidores archivados.
- [ ] Delete muestra confirmación inline antes de ejecutar acción stub.
- [ ] `bun test` pasa sin regressions en tests existentes.

## Non-goals

- No construir restore real ni wizard de restauración (ch-18).
- No construir archive flow real con `pulumi destroy` (ch-17).
- No introducir modales globales nuevos; la confirmación destructiva es inline, siguiendo el patrón `confirmableAction` existente en dashboard panels.
