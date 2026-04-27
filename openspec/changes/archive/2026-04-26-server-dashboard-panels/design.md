## Context

El Server Dashboard ya reutiliza `LayoutShell`, muestra el sub-menú completo de Nivel 1 y tiene integración global con `pending-changes-store`. Hoy solo `Server Management` muestra datos reales básicos; el resto de paneles son placeholders. El PRD describe paneles amplios, pero el alcance de esta change es thin UI con adapters mock/stub y sin side effects remotos.

Restricciones principales:
- `TAB` sigue siendo exclusivo para alternar foco entre panel izquierdo y derecho.
- El buffer global de pending changes es la única persistencia intermedia de cambios en configuración.
- Edits locales no encolados se pueden descartar al navegar; no se reintroduce dirty-state por panel.
- Bun + React Ink + Zustand siguen como stack base, sin dependencias nuevas obligatorias.

## Goals / Non-Goals

**Goals:**
- Separar cada panel de Nivel 1 en componentes testeables y pequeños.
- Añadir un dispatcher de input para que el panel derecho pueda manejar cursores, acciones horizontales, sub-vistas y formularios.
- Proveer mock/stub adapters para listas de players, stats/logs, scheduler, backups y acciones peligrosas.
- Encolar cambios desde Provider & Region, Build, Basic Settings y Admins en el buffer global existente.
- Mantener Server Dashboard usable completo antes de integrar servicios reales.

**Non-Goals:**
- Ejecutar infraestructura, SSH/SFTP, Docker, RCON, file picker nativo o streaming real.
- Persistir estado remoto real fuera del inventario local y pending changes existentes.
- Cambiar la arquitectura visual 35/65 o el shell reusable.
- Crear dirty-state por panel, prompts de unsaved changes locales o navegación por `TAB` dentro del panel derecho.

## Decisions

### 1. Panel router explícito dentro de Server Dashboard

Usar un mapping por `ServerMenuId` que resuelva `{title, component, inputHandler}` para cada panel. Esto evita un `switch` gigante en `server-dashboard-screen.tsx` y deja cada panel evolucionar sin tocar todos los demás.

Alternativa considerada: mantener todo en un único componente. Se descarta porque diez paneles con sub-vistas harían difícil testear input y rendering.

### 2. Store liviano de UI local para paneles

Agregar estado de UI para cursores y sub-vistas del panel derecho, por ejemplo `activePanelView`, `rightCursor`, `rightActionCursor`, draft form values y errores. Puede vivir en `app-store` si sigue pequeño, o en un store dedicado de dashboard si el archivo crece.

Alternativa considerada: estado React local en cada panel. Se descarta parcialmente porque `useInput` vive arriba en `DashboardScreen`; el input dispatcher necesita leer/escribir cursores de forma centralizada.

### 3. Mock adapter como boundary futuro

Definir un adapter interno con métodos como `listPlayers`, `getStatsSnapshot`, `listBackups`, `listScheduledTasks`, `requestLifecycleAction`. La implementación inicial devuelve datos deterministas y resultados stub. Esto deja claro dónde sustituir por SSH/RCON/SFTP/Pulumi más adelante.

Alternativa considerada: hardcodear datos en componentes. Se descarta porque mezcla UI con futuros integration points y dificulta tests.

### 4. Formularios con drafts locales y `Queue Changes`

Basic Settings, Admins, Build y Provider & Region mantienen drafts en UI hasta que el usuario activa `Queue Changes` o selecciona una opción que encola explícitamente. Al encolar, generan `PendingChange` con `panel`, `field`, `category`, `requiresRestart`, `requiresVmRecreate` y `sensitive` según corresponda.

Alternativa considerada: encolar al editar cada campo. Se descarta porque el PRD quiere acción explícita y el buffer global debe representar cambios deliberados.

### 5. Acciones destructivas solo muestran modal/stub

Archive, Kick, Ban, Restore y Delete muestran confirmación donde aplique, pero su confirmación solo registra resultado local/toast textual o no-op. El objetivo es validar navegación y UX, no side effects.

Alternativa considerada: ocultar acciones peligrosas hasta integración real. Se descarta porque Nivel 1 debe estar completo visualmente y descubrible.

## Risks / Trade-offs

- Panel router + store pueden sobredimensionarse para thin UI → Mitigación: tipos simples, sin frameworks nuevos, componentes pequeños.
- PRD contiene texto obsoleto de dirty-state por panel → Mitigación: seguir `pending-changes-buffer` vigente y AGENTS.md: buffer global, sin dirty prompts locales.
- Mock data puede confundirse con real → Mitigación: labels claros como `Mock`, `Stub`, `Coming Soon` y sin mutaciones remotas.
- Input global puede volverse frágil con muchas sub-vistas → Mitigación: handlers puros por panel y tests de navegación por panel.

## Migration Plan

1. Introducir panel router y mantener `Server Management` equivalente.
2. Añadir paneles read-only/mock primero.
3. Añadir formularios y queue de pending changes.
4. Añadir stubs de confirmación para acciones peligrosas.
5. Cubrir navegación y buffer con tests.

Rollback: eliminar el mapping de paneles nuevos y volver a placeholders, sin migración de datos requerida.

## Resolved Questions

### Stub feedback strategy

Los resultados de acciones mock/stub SHALL mostrarse como mensaje de estado dentro del panel derecho activo, no como sistema global de toast persistente.

Razón: el alcance thin UI necesita feedback visible y testeable, pero un toast global en Ink añadiría complejidad de foco/rendering que no aporta todavía. Cada panel puede mostrar una línea tipo `Status: Stub: backup created locally (mock)` o `Status: Mock: player kick requested`.

### Advanced Settings scope

`Advanced Settings` SHALL implementar lista de archivos esperados más acciones stub de preview/edit/replace/download. El edit puede abrir una sub-vista fake con contenido mock y acción `Queue File Change Stub`, pero esta change SHALL NOT implementar editor multiline real ni SFTP/file picker real.

Razón: valida navegación, descubribilidad y boundary futura de SFTP sin introducir complejidad de edición de texto antes de integrar persistencia remota.

### Scheduler persistence model

`Scheduler` SHALL usar comportamiento local mock/stub inmediato para create/edit/toggle/delete y SHALL NOT encolar cambios en el pending buffer global en esta change.

Razón: el pending buffer vigente cubre configuración, build e infraestructura. Scheduler modela crontab remoto futuro; en thin UI basta con validar navegación, cron validation y feedback stub sin mezclar operaciones scheduler con apply pipeline.
