## Why

El Server Dashboard de Nivel 1 ya tiene shell, navegación base y buffer global de pending changes, pero la mayoría de paneles todavía renderizan placeholders. Esta change completa la experiencia navegable de gestión por servidor con thin UI y adapters mock/stub, para validar flujos de usuario antes de integrar cloud, SSH, RCON, SFTP o Docker reales.

## What Changes

- Añadir contenido funcional de UI para los paneles de Nivel 1: Server Management, Provider & Region, Build, Players, Stats, Basic Settings, Advanced Settings, Admins, Scheduler y Backups.
- Introducir un router interno de paneles dentro del Server Dashboard para separar rendering e interacción por panel sin romper el layout 35/65 existente.
- Añadir adapters mock/stub para datos y acciones de dashboard: players, stats/logs, scheduler, backups y acciones de ciclo de vida.
- Integrar paneles de configuración con el buffer global de pending changes mediante `Queue Changes`, `Ctrl+A` y los indicadores existentes.
- Mantener navegación según PRD/spec: `TAB` solo cambia foco entre paneles; `↑↓` navega vertical; `←→` navega acciones horizontales; `ESC` vuelve según contexto.
- Añadir validaciones básicas en formularios thin UI para settings, admins, build, provider/region y scheduler.
- Añadir tests de navegación, render de paneles, queue de changes y comportamiento mock/stub.

## Capabilities

### New Capabilities
- `server-dashboard-panels`: Cubre la UI navegable de Nivel 1 para gestión de servidor con paneles thin UI, mock/stub adapters, formularios, tablas, acciones y sub-vistas locales.

### Modified Capabilities
- `pending-changes-buffer`: Amplía el uso del buffer global desde paneles concretos de Server Dashboard, incluyendo cambios de settings, admins, build e infraestructura sin dirty-state por panel.

## Non-goals

- No ejecutar Pulumi, SSH, SFTP, Docker, RCON ni cloud APIs reales.
- No implementar deploy, restore, backup, cron remoto, streaming real de logs ni modificación remota de archivos.
- No introducir dirty-state por panel ni modales de unsaved changes locales.
- No rediseñar el layout shell, header, footer o sistema global de pending changes.
- No completar AWS/Azure; pueden mostrarse como `Coming Soon`.

## Impact

- Código UI: `src/screens/server-dashboard/**`, `src/screens/main-menu/main-menu-screen.tsx`.
- Estado: `src/stores/app-store.ts`, posible store local de panel/dashboard si ayuda a aislar cursores y sub-vistas.
- Types/helpers: `src/types/index.ts`, `src/lib/**` para panel metadata, validators y mock data.
- Pending changes: `src/stores/pending-changes-store.ts`, `src/lib/pending-changes.ts`, `src/components/pending-changes-modal.tsx` según necesidad de labels/agrupación.
- Tests: `src/screens/server-dashboard/**/*.test.tsx`, tests existentes de main menu y pending changes.
- Sin nuevas dependencias requeridas para el alcance mock/stub.
