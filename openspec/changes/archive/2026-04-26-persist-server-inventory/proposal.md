## Why

El TUI ya muestra un inventario de servidores, settings y cambios pendientes, pero esos datos viven solo como seeds en memoria. Para que el MVP pueda administrar servidores reales entre sesiones, necesita una base SQLite local robusta que actúe como fuente persistente del inventario.

## What Changes

- Agregar persistencia local SQLite para servidores, settings, pending changes y backups básicos.
- Reemplazar los seeds hardcodeados como fuente primaria por un flujo de boot que inicializa la DB, inserta demo data solo cuando corresponde e hidrata Zustand.
- Definir CRUD básico para inventario local mediante una capa de repository/service separada de la UI.
- Mapear filas SQLite hacia los modelos usados por el TUI sin ejecutar deploys, SSH, SFTP, RCON ni Pulumi.
- Persistir cambios de servidores/settings/pending changes de forma transaccional donde aplique.
- Mantener la TUI usable con datos demo cuando la base está vacía, para conservar previews del dashboard.

## Non-goals

- No implementar deploy real, lifecycle remoto, SSH/SFTP/RCON, Pulumi ni operaciones cloud.
- No implementar cifrado completo de claves privadas ni gestión de passphrase maestra.
- No implementar flujos completos de backup/restore; solo modelo y CRUD local mínimo para metadatos.
- No construir todavía pantallas completas de create server, archived servers, backups o global settings.
- No introducir subcomandos CLI antes del arranque TUI.

## Capabilities

### New Capabilities
- `local-server-inventory`: Persistencia SQLite local para inventario de servidores, settings, pending changes y metadatos básicos de backups, con hidratación hacia Zustand.

### Modified Capabilities
- `project-structure`: Se extiende la arquitectura base para formalizar el boundary entre `src/infrastructure/` para SQLite, `src/services/` para CRUD/hydration y stores Zustand como estado reactivo del TUI.

## Impact

- Afecta `src/infrastructure/database.ts` con schema, migración inicial y helpers SQLite.
- Agrega servicios/repositories bajo `src/services/` para inventario local e hidratación.
- Actualiza `src/stores/servers-store.ts`, `src/stores/settings-store.ts` y `src/stores/pending-changes-store.ts` para aceptar datos hidratados y exponer acciones persistibles.
- Actualiza tipos compartidos en `src/types/index.ts` para alinear campos actuales con el schema persistente mínimo.
- Agrega tests con `bun test` usando bases SQLite temporales o `:memory:`.
