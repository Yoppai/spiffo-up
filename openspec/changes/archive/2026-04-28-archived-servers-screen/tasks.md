# Tasks: archived-servers-screen

## Meta

- Change: `archived-servers-screen`
- Order: tipos → store → componentes → integración → cleanup
- Strict TDD: tests ANTES de implementación en cada task
- Cada task ≤ 2h

---

## Task 1: Extender tipos en `src/types/index.ts`

### Descripción

Extender `GlobalRightMode` con los nuevos modos `'archived-list'` y `'archived-detail'`. Extender `ServerRecord` con campos opcionales de backup y archivado. Extender `NavigationState` con el campo de confirmación destructiva.

### Archivos afectados

- `src/types/index.ts`

### Criterios de verificación

- [ ] `GlobalRightMode` incluye `'archived-list'` y `'archived-detail'`
- [ ] `ServerRecord` tiene `backupPath?: string | null`, `backupSize?: number | null`, `archivedAt?: string | null`
- [ ] `NavigationState` tiene `globalRightConfirmAction?: string | null`
- [ ] `tsc --noEmit` pasa sin errores

### Dependencias

Ninguna.

---

## Task 2: Agregar `setGlobalRightConfirmAction` a app-store

### Descripción

Agregar el método `setGlobalRightConfirmAction` a `AppState` y su implementación en `app-store.ts`. Inicializar en `initialNavigation` como `null`.

### Archivos afectados

- `src/stores/app-store.ts`

### Criterios de verificación

- [ ] `setGlobalRightConfirmAction` existe en la interfaz `AppState`
- [ ] Implementación actualiza `navigation.globalRightConfirmAction`
- [ ] `initialNavigation` inicializa el campo como `null`
- [ ] Tests unitarios del método pasan

### Dependencias

- Task 1 (tipos)

---

## Task 3: Agregar seed data de servidor archivado en servers-store

### Descripción

Agregar al seed data de `servers-store.ts` al menos un servidor con `status='archived'` y campos `backupPath`, `backupSize`, `archivedAt` para testing visual.

### Archivos afectados

- `src/stores/servers-store.ts`

### Criterios de verificación

- [ ] Existe al menos un servidor con `status === 'archived'` en seed
- [ ] Seed incluye `backupPath`, `backupSize`, `archivedAt` populated
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 1 (tipos)

---

## Task 4: Crear componente `ArchivedEmptyState`

### Descripción

Crear el componente `ArchivedEmptyState` en `src/screens/archived-servers/`. Renderiza mensaje amigable cuando no hay servidores archivados. Componente puro sin lógica de store.

### Archivos afectados (nuevos)

- `src/screens/archived-servers/archived-empty-state.tsx`
- `src/screens/archived-servers/archived-empty-state.test.tsx` (tests PRIMERO)

### Criterios de verificación

- [ ] Test: renderiza mensaje de empty state con i18n
- [ ] Test: mensaje incluye explicación breve de archivar
- [ ] Componente usa `useTranslation` de i18next
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 1 (tipos)

---

## Task 5: Crear componente `ArchivedListView`

### Descripción

Crear `ArchivedListView` con tabla de columnas NAME, PROVIDER, ARCHIVED ON, BACKUP SIZE, STATUS, ACTIONS. Navegación ↑↓ con `globalRightCursor`. Renderiza `ArchivedEmptyState` cuando `length === 0`.

### Props

```ts
interface ArchivedListViewProps {
  servers: ServerRecord[];
  cursor: number;
  onSelect?: (index: number) => void;
}
```

### Archivos afectados (nuevos)

- `src/screens/archived-servers/archived-list-view.tsx`
- `src/screens/archived-servers/archived-list-view.test.tsx` (tests PRIMERO)

### Criterios de verificación

- [ ] Test: renderiza todas las columnas de la tabla
- [ ] Test: cursor muestra highlight en fila activa
- [ ] Test: STATUS muestra `SAVED` si hay `backupPath`, `MISSING` si null
- [ ] Test: Empty state cuando servers está vacío
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 1 (tipos)
- Task 4 (ArchivedEmptyState)

---

## Task 6: Crear componente `ArchivedDetailView`

### Descripción

Crear `ArchivedDetailView` con metadatos del servidor, sección de backup y fila de acciones [Restore Server, Delete Record]. Muestra banner de confirmación inline si `confirmAction === 'delete'`.

### Props

```ts
interface ArchivedDetailViewProps {
  server: ServerRecord;
  cursor: number;
  confirmAction: string | null;
  onRestore: () => void;
  onDelete: () => void;
}
```

### Archivos afectados (nuevos)

- `src/screens/archived-servers/archived-detail-view.tsx`
- `src/screens/archived-servers/archived-detail-view.test.tsx` (tests PRIMERO)

### Criterios de verificación

- [ ] Test: renderiza todos los campos de metadatos
- [ ] Test: sección backup muestra info o "no disponible"
- [ ] Test: acciones Restore y Delete visibles
- [ ] Test: cursor highlight en acción activa
- [ ] Test: banner inline aparece cuando `confirmAction === 'delete'`
- [ ] Test: opciones [Cancelar] y [Eliminar] en banner
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 1 (tipos)

---

## Task 7: Crear `ArchivedServersPanel` (entry point)

### Descripción

Crear `ArchivedServersPanel` como entry point en `src/screens/archived-servers/`. Lee `navigation.globalRightMode` y renderiza `ArchivedListView` o `ArchivedDetailView`. No recibe props; consume stores directamente.

### Archivos afectados (nuevos)

- `src/screens/archived-servers/archived-servers-panel.tsx`
- `src/screens/archived-servers/archived-servers-panel.test.tsx` (tests PRIMERO)

### Criterios de verificación

- [ ] Test: renderiza list view cuando `globalRightMode === 'archived-list'`
- [ ] Test: renderiza list view cuando modo es `'list'` (backwards compatible)
- [ ] Test: renderiza detail view cuando `globalRightMode === 'archived-detail'`
- [ ] Test: filtra servidores con `status === 'archived'`
- [ ] Test: pasa cursor y confirm state a views
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 1 (tipos)
- Task 5 (ArchivedListView)
- Task 6 (ArchivedDetailView)

---

## Task 8: Crear keyboard handler `archived-servers-input.ts`

### Descripción

Crear `archived-servers-input.ts` que despacha eventos de teclado para los modos archived. Seguir la firma de `global-settings-input.ts`. Lógica:

- Modo `'archived-list'` (o `'list'`): `↑↓` mueve cursor, `ENTER` entra a detalle, `ESC` vuelve al menú global (no hace nada local), `TAB` cambia panel.
- Modo `'archived-detail'`: `↑↓` mueve cursor sobre acciones, `ENTER` ejecuta o activa confirmación, `ESC` vuelve a lista.
- Confirm: `ENTER` en delete ejecuta stub y limpia confirm; `ESC` cancela.

### Firma

```ts
export function handleArchivedServersInput(params: {
  app: AppState;
  key: string;
  navigation: NavigationState;
  serverStore: ServersState;
}): void
```

### Archivos afectados (nuevos)

- `src/screens/archived-servers/archived-servers-input.ts`
- `src/screens/archived-servers/archived-servers-input.test.tsx` (tests PRIMERO)

### Criterios de verificación

- [ ] Test: `↑` decrementa cursor en modo list
- [ ] Test: `↓` incrementa cursor en modo list
- [ ] Test: `ENTER` cambia modo a `'archived-detail'`
- [ ] Test: `ESC` en modo detail vuelve a `'archived-list'`
- [ ] Test: `↑↓` navegan acciones en modo detail
- [ ] Test: `ENTER` en Delete activa confirmación (`globalRightConfirmAction === 'delete'`)
- [ ] Test: Segundo `ENTER` con confirm ejecuta stub delete y limpia confirm
- [ ] Test: `ESC` cancela confirmación y limpia `globalRightConfirmAction`
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 1 (tipos)
- Task 2 (setGlobalRightConfirmAction)
- Task 7 (ArchivedServersPanel)

---

## Task 9: Modificar `main-menu-view.tsx`

### Descripción

Reemplazar el import del stub `ArchivedServersPanel` por el nuevo componente en `src/screens/archived-servers/`. El stub actual vive en `src/screens/main-menu/archived-servers-panel.tsx`.

### Archivos afectados

- `src/screens/main-menu/main-menu-view.tsx`

### Criterios de verificación

- [ ] Import apunta a `src/screens/archived-servers/archived-servers-panel`
- [ ] Renderiza `ArchivedServersPanel` para `id === 'archived-servers'`
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 7 (ArchivedServersPanel)

---

## Task 10: Modificar `main-menu-screen.tsx`

### Descripción

En `handleGlobalInput`, agregar dispatch hacia `handleArchivedServersInput` cuando `globalMenuIndex` corresponde a archived-servers y el foco está en el panel derecho.

### Archivos afectados

- `src/screens/main-menu/main-menu-screen.tsx`

### Criterios de verificación

- [ ] Importa `handleArchivedServersInput`
- [ ] Keyboard dispatch para archived-servers cuando foco en panel derecho
- [ ] `↑↓` actualiza cursor correctamente
- [ ] `ENTER` entra a detalle
- [ ] `ESC` vuelve al menú global
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 8 (archived-servers-input)

---

## Task 11: Agregar i18n keys a locales

### Descripción

Agregar todas las keys de traducción necesarias para la pantalla de servidores archivados. Keys con prefijo `archived.*`.

### Keys requeridas

```json
{
  "archived": {
    "title": "Servidores Archivados",
    "list": {
      "name": "Name",
      "provider": "Provider",
      "archivedOn": "Archived On",
      "backupSize": "Backup Size",
      "status": "Status",
      "actions": "Actions"
    },
    "detail": {
      "provider": "Provider",
      "projectId": "Project ID",
      "instanceType": "Instance Type",
      "zone": "Zone",
      "staticIp": "Static IP",
      "gameBranch": "Game Branch",
      "created": "Created",
      "archived": "Archived",
      "backupSection": "Backup",
      "backupPath": "Path",
      "backupSize": "Size",
      "backupStatus": "Status",
      "saved": "SAVED",
      "missing": "MISSING",
      "noBackupInfo": "No backup information available",
      "restore": "Restore Server",
      "delete": "Delete Record"
    },
    "empty": {
      "title": "No archived servers found",
      "description": "Servers that have been archived will appear here. Use the server management menu to archive active servers."
    },
    "confirm": {
      "title": "Delete Server Record",
      "message": "This action cannot be undone. The backup will not be removed.",
      "cancel": "Cancel",
      "confirm": "Delete"
    }
  }
}
```

### Archivos afectados

- `src/locales/en.json`
- `src/locales/es.json`

### Criterios de verificación

- [ ] Todas las keys existen en ambos locales
- [ ] Traducciones coherentes con el tono del proyecto
- [ ] Fallback muestra la key si falta traducción

### Dependencias

Ninguna.

---

## Task 12: Eliminar stub antiguo

### Descripción

Eliminar el archivo stub `archived-servers-panel.tsx` de `src/screens/main-menu/` ya que fue reemplazado por el nuevo componente.

### Archivos eliminados

- `src/screens/main-menu/archived-servers-panel.tsx`

### Criterios de verificación

- [ ] Archivo no existe
- [ ] Import en `main-menu-view.tsx` no rompe (verificado en Task 9)
- [ ] `tsc --noEmit` pasa

### Dependencias

- Task 9 (main-menu-view actualizado)

---

## Resumen de archivos

| Task | Create | Modify | Delete |
|------|--------|--------|--------|
| 1 | | `src/types/index.ts` | |
| 2 | | `src/stores/app-store.ts` | |
| 3 | | `src/stores/servers-store.ts` | |
| 4 | `archived-empty-state.tsx` + test | | |
| 5 | `archived-list-view.tsx` + test | | |
| 6 | `archived-detail-view.tsx` + test | | |
| 7 | `archived-servers-panel.tsx` + test | | |
| 8 | `archived-servers-input.ts` + test | | |
| 9 | | `main-menu-view.tsx` | |
| 10 | | `main-menu-screen.tsx` | |
| 11 | | `en.json`, `es.json` | |
| 12 | | | `archived-servers-panel.tsx` (stub) |

**Total: 5 nuevos archivos con tests, 6 modificados, 1 eliminado.**