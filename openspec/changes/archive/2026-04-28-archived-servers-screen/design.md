# Design: Archived Servers Screen

## Enfoque Técnico

Reutilizar el patrón de sub-vistas de `GlobalSettingsPanel`: `globalRightMode` y `globalRightCursor` controlan el estado de lista/detalle. Un handler separado `archived-servers-input.ts` despacha eventos de teclado desde `main-menu-screen.tsx`, igual que `global-settings-input.ts`. Los componentes viven en `src/screens/archived-servers/` y son puros (sin lógica de input). La confirmación destructiva usa un campo opcional `globalRightConfirmAction` agregado a `NavigationState`, paralelo a `DashboardPanelUiState.confirmAction`.

## Decisiones de Arquitectura

| Decisión | Opciones | Tradeoff | Elección |
|---|---|---|---|
| Estado de sub-vistas | Reusar `globalRightMode` / `globalRightCursor` vs. nuevo slice en app-store | Reuse mantiene consistencia con Global Settings; nuevo slice añade complejidad | Reusar existentes. `GlobalRightMode` se extiende con `'archived-list'` y `'archived-detail'`. |
| Default list mode | `'list'` universal vs. `'archived-list'` explícito | `'list'` ya es el default de `moveGlobalMenu`; `'archived-list'` es más declarativo | Agregar ambos a `GlobalRightMode`. `ArchivedServersPanel` acepta `'list'` y `'archived-list'` como vista lista para robustez. |
| Confirmación inline | `globalRightConfirmAction` en `NavigationState` vs. state local React | State local no es accesible desde el handler centralizado de teclado | Campo opcional `globalRightConfirmAction?: string \| null` en `NavigationState`. App-store expone `setGlobalRightConfirmAction`. |
| Keyboard dispatch | Handler separado vs. lógica inline en `main-menu-screen.tsx` | Separado sigue el patrón establecido por `global-settings-input.ts` | Handler separado `archived-servers-input.ts` importado y llamado desde `handleGlobalInput`. |
| Tabla de lista | Ink `Box`/`Text` manual vs. librería externa | Ink no tiene table primitive; librería externa añade dependencia innecesaria | Render manual con `Box flexDirection="column"` y filas `Text`. |

## Flujo de Datos

```
servers-store (filter status='archived')
        |
        v
ArchivedServersPanel --globalRightMode--> ArchivedListView / ArchivedDetailView
        ^                                          |
        |                                          v
archived-servers-input.ts <-------- globalRightCursor + globalRightConfirmAction
```

1. `servers-store` filtra servidores con `status='archived'`.
2. `ArchivedServersPanel` lee `navigation.globalRightMode` y renderiza lista o detalle.
3. `archived-servers-input.ts` recibe `key`, actualiza `globalRightCursor`, cambia `globalRightMode`, o ejecuta acciones según confirm state.
4. Delete muestra banner inline vía `globalRightConfirmAction`; segundo Enter ejecuta stub.

## Cambios de Archivos

| Archivo | Acción | Descripción |
|---|---|---|
| `src/screens/archived-servers/archived-servers-panel.tsx` | Create | Entry point. Switch entre list/detalle como `GlobalSettingsPanel`. |
| `src/screens/archived-servers/archived-list-view.tsx` | Create | Tabla con columnas NAME, PROVIDER, ARCHIVED ON, BACKUP SIZE, STATUS, ACTIONS. Cursor ↑↓. Renderiza `ArchivedEmptyState` si `length === 0`. |
| `src/screens/archived-servers/archived-detail-view.tsx` | Create | Metadatos del servidor, sección backup, action row [Restore, Delete]. Muestra banner de confirmación si `confirmAction === 'delete'`. |
| `src/screens/archived-servers/archived-empty-state.tsx` | Create | Empty state reutilizable con mensaje descriptivo. |
| `src/screens/archived-servers/archived-servers-input.ts` | Create | Dispatch de teclas para modos archived. Importado en `main-menu-screen.tsx`. |
| `src/types/index.ts` | Modify | Extender `GlobalRightMode` con `'archived-list' \| 'archived-detail'`; extender `ServerRecord` con `backupPath?: string \| null`, `backupSize?: number \| null`, `archivedAt?: string \| null`; extender `NavigationState` con `globalRightConfirmAction?: string \| null`. |
| `src/stores/app-store.ts` | Modify | Agregar `setGlobalRightConfirmAction` a `AppState` e implementación. Inicializar en `initialNavigation` como `null`. |
| `src/stores/servers-store.ts` | Modify | Agregar al seed un servidor con `status='archived'` y campos de backup para testing visual. |
| `src/screens/main-menu/main-menu-view.tsx` | Modify | Reemplazar import del stub `ArchivedServersPanel` por el nuevo en `src/screens/archived-servers/`. |
| `src/screens/main-menu/main-menu-screen.tsx` | Modify | En `handleGlobalInput`, cuando `globalMenuIndex === archived-servers` y `focusedPanel === 'right'`, despachar a `handleArchivedServersInput`. |
| `src/screens/main-menu/archived-servers-panel.tsx` | Delete | Stub obsoleto reemplazado. |
| `src/locales/en.json` | Modify | Keys: `archived.*` para títulos, columnas, acciones, empty state, confirmación. |
| `src/locales/es.json` | Modify | Traducciones equivalentes a `en.json`. |

## Interfaces / Contracts

```ts
// src/types/index.ts
export type GlobalRightMode =
  | 'list'
  | 'language'
  | 'theme'
  | 'backup-path'
  | 'archived-list'
  | 'archived-detail';

export interface ServerRecord {
  // ... campos existentes
  backupPath?: string | null;
  backupSize?: number | null;
  archivedAt?: string | null;
}

export interface NavigationState {
  // ... campos existentes
  globalRightConfirmAction?: string | null;
}
```

Props de componentes:
- `ArchivedServersPanel`: no recibe props. Lee `navigation` vía `useInkStore(useAppStore, ...)`. Lee `servers` vía `useServersStore` y filtra `status === 'archived'`.
- `ArchivedListView`: `{ servers: ServerRecord[]; cursor: number; onSelect?: (index: number) => void }`
- `ArchivedDetailView`: `{ server: ServerRecord; cursor: number; confirmAction: string | null; }`
- `ArchivedEmptyState`: no recibe props.

## Integración con Navegación

En `main-menu-screen.tsx`, dentro de `handleGlobalInput`:

```ts
const GLOBAL_MENU_ARCHIVED_SERVERS_INDEX = 2;

if (navigation.globalMenuIndex === GLOBAL_MENU_ARCHIVED_SERVERS_INDEX) {
  return handleArchivedServersInput({ app, key, navigation, serverStore });
}
```

El handler `archived-servers-input.ts` sigue la firma de `global-settings-input.ts`:
- Modo `'archived-list'` (o `'list'`): `↑↓` mueve `globalRightCursor` sobre filas; `ENTER` entra a detalle (`setGlobalRightMode('archived-detail')`); `ESC` no hace nada (ya está en lista).
- Modo `'archived-detail'`: `↑↓` mueve cursor sobre acciones [Restore, Delete]; `ENTER` ejecuta acción o activa confirmación; `ESC` vuelve a lista (`setGlobalRightMode('archived-list')`).
- Confirm: si `globalRightConfirmAction === 'delete'` y se presiona `ENTER`, ejecuta stub delete y limpia confirm. `ESC` cancela confirmación.

## Testing Strategy

| Layer | Qué testear | Approach |
|---|---|---|
| Unit | `archived-servers-input.ts` | Llamar función con mock de `app` y `navigation`; assert mutations en store. |
| Unit | `ArchivedListView` / `ArchivedDetailView` | `ink-testing-library`; assert columnas, cursor highlight, banner confirm. |
| Integration | Flujo list → detail → confirm → delete | Render `DashboardScreen`, simular `useInput` con secuencia de teclas. |

## Migration / Rollout

No migration required. Cambios aditivos: campos opcionales en `ServerRecord`, seed data adicional.

## Open Questions

- Ninguna.
