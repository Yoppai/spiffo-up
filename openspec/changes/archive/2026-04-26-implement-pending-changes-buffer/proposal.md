## Why

El PRD define el buffer global de pending changes como el corazón UX del Server Dashboard: permite editar varios paneles, revisar el impacto completo y aplicar todo de forma deliberada. Hoy el proyecto solo persiste cambios pendientes y muestra un conteo básico; faltan el flujo `Queue Changes` → global buffer → `Ctrl+A` → Apply All, los indicadores visuales y las decisiones explícitas de aplicar, descartar o volver a editar.

## What Changes

- Agregar la capacidad TUI de buffer global para pending changes dentro del Server Dashboard.
- Mostrar indicadores visuales cuando existan cambios pendientes: banner en panel derecho, dots en sub-menú por panel y footer `[Ctrl+A] Apply (N)`.
- Implementar `Ctrl+A` como atajo global del Server Dashboard para abrir el modal `Apply Pending Changes`.
- Crear un modal de resumen agrupado por panel con old/new values, cambios sensibles enmascarados e impact summary.
- Soportar acciones `Apply All`, `Discard All` y `Back to Edit`.
- Al salir del Server Dashboard con `ESC` o `Back to Servers`, intervenir solo si el buffer global contiene cambios pendientes.
- Mantener la regla clave: no reintroducir dirty-state por panel; edits locales no encolados no bloquean navegación.
- Implementar el apply pipeline como orchestration local/no-op remota para esta etapa: calcula orden e impacto, marca resultado visual y limpia el buffer tras éxito, sin ejecutar Pulumi, SSH, SFTP, Docker ni RCON reales.

## Capabilities

### New Capabilities
- `pending-changes-buffer`: Cubre el buffer global de cambios pendientes, indicadores, modal `Apply Pending Changes`, descarte, vuelta a edición, resumen de impacto y pipeline local de aplicación.

### Modified Capabilities
- `project-structure`: Refuerza que `pending changes` pertenece al store global y no a dirty-state local por panel.
- `local-server-inventory`: Extiende el uso de la persistencia existente para que apply/discard limpien SQLite y store de forma coherente.

## Impact

- `src/types/index.ts`: tipos de categorías de cambio, impacto, modal state y resultado de aplicación.
- `src/stores/pending-changes-store.ts`: selectores/acciones para agrupar, contar por panel, descartar y reflejar aplicación.
- `src/stores/app-store.ts`: estado de modal y navegación para pending changes.
- `src/screens/main-menu/main-menu-screen.tsx`: manejo de `Ctrl+A`, `ESC` con buffer y acciones del modal.
- `src/screens/server-dashboard/server-dashboard-screen.tsx`: banner global, dots por panel, botón `Apply All Changes` y modal superpuesto.
- `src/components/`: componentes reutilizables para footer, modal y resumen de cambios.
- `src/services/`: servicio local para planificar/aplicar pipeline sin side effects remotos y limpiar persistencia.
- Tests con `bun test` para store, servicio, keyboard flow y render de indicadores/modal.

## Non-goals

- No ejecutar Pulumi, SSH, SFTP, Docker, RCON ni cambios remotos reales.
- No construir editores completos de Basic Settings, Admins, Provider & Region, Build o Advanced Settings.
- No reintroducir modales de unsaved/dirty state por panel.
- No implementar stack de modales; sigue siendo un modal único a la vez.
- No agregar nuevos package scripts de lint/typecheck ni comandos fuera de los ya verificados.
