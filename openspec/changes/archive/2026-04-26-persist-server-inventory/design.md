## Context

El proyecto ya tiene un shell TUI con React Ink, stores Zustand granulares y un wrapper `useInkStore`. Hoy `servers-store`, `settings-store` y `pending-changes-store` arrancan con datos en memoria; `src/infrastructure/database.ts` solo abre `bun:sqlite` y declara un schema placeholder.

El PRD pide una base SQLite local robusta para mantener inventario, settings, pending changes y metadatos de backups. Este cambio debe convertir SQLite en la fuente persistente local sin adelantar deploys remotos ni flujos cloud.

## Goals / Non-Goals

**Goals:**

- Crear schema SQLite real para `servers`, `settings`, `pending_changes`, `backups` y tracking de migraciones.
- Definir un boundary claro: `src/infrastructure/` abre/migra SQLite, `src/services/` expone CRUD/hydration, `src/stores/` mantiene estado reactivo para el TUI.
- Hidratar Zustand desde SQLite al boot y conservar demo data solo como seed inicial cuando no hay servidores.
- Probar CRUD, migración, seed idempotente e hidratación con `bun test`.

**Non-Goals:**

- Ejecutar Pulumi, SSH, SFTP, RCON, lifecycle remoto o backups reales.
- Resolver cifrado completo de SSH private keys o passphrase maestra.
- Implementar UI completa para crear/editar/eliminar servidores, settings globales o backups.

## Decisions

### SQLite como source of truth; Zustand como cache reactiva

SQLite será la fuente persistente. Al iniciar, la app abre la DB, ejecuta migraciones, siembra demo data cuando está vacía y carga snapshots hacia stores Zustand.

Alternativa considerada: usar Zustand como fuente y persistir cada mutation al disco. Se descarta para este cambio porque aumenta el riesgo de divergencia y hace más difícil testear rehidratación.

### Repository/service entre stores y SQLite

La UI no accederá a SQLite. `src/infrastructure/database.ts` se limitará a conexión, pragmas, schema y transacciones. Un servicio de inventario bajo `src/services/` manejará CRUD y mapping entre rows y modelos de dominio.

Alternativa considerada: poner queries directamente en stores. Se descarta porque acopla estado reactivo con detalles SQL y complica tests aislados.

### Schema MVP compatible con PRD, pero sin bloquear por SSH crypto

El schema cubrirá tablas core: `servers`, `settings`, `pending_changes`, `backups` y `schema_migrations`. Los campos usados por el TUI se mapearán desde nombres persistentes (`instance_type`, `static_ip`, `game_branch`). Metadatos de SSH se dejarán fuera o nullable hasta el cambio de deploy/auth.

Alternativa considerada: implementar `ssh_keys` completo ahora. Se pospone porque requiere decisiones de cifrado/passphrase fuera del scope de inventario local básico.

### Seed demo idempotente

La demo data actual se mantiene como seed, pero solo se inserta si `servers` está vacía. Tests y usuarios no deben perder datos persistidos por reiniciar la app.

Alternativa considerada: mantener seeds siempre en store y sobrescribir. Se descarta porque destruiría persistencia real.

### Pending changes persistentes y legibles

`pending_changes` guardará server, panel, field, old/new values e impactos (`requires_restart`, `requires_vm_recreate`). El store actual puede empezar con un label derivado, pero el modelo debe quedar listo para el modal global del PRD.

### Path local bajo `~/.spiffo-up/`

La DB local vivirá por defecto en `~/.spiffo-up/spiffo-up.sqlite`. Otros datos locales derivados del inventario pueden colgar del mismo root (`~/.spiffo-up/`) salvo que una setting específica indique otra ruta, como `backup_path`.

Alternativa considerada: usar `~/.zomboid-cli/` por referencias históricas del PRD. Se descarta para este cambio porque el nombre de producto/binario actual es `spiffo-up` y el comentario de revisión fija `~/.spiffo-up/` como root local.

### Players como telemetry runtime

`playersOnline` y métricas equivalentes de ocupación conectada se tratarán como telemetry runtime, no como inventario persistente fuerte. `playersMax` se deriva de configuración del servidor (`MaxPlayers`) cuando exista lectura de config; mientras tanto puede permanecer como dato demo/hidratado solo para preview TUI.

Alternativa considerada: persistir snapshots de jugadores en `servers`. Se descarta porque el PRD describe jugadores conectados como estado runtime vía RCON/Stats, no como campo del schema core SQLite.

### Archived como estado persistente

El inventario modelará servidores archivados con `status='archived'`, siguiendo el PRD. No se agregará un boolean persistente `archived`; cualquier helper UI como `isActiveServer` debe derivar actividad desde `status`.

Alternativa considerada: mantener `archived?: boolean` por compatibilidad con tipos actuales. Se descarta como modelo persistente porque duplicaría estado y podría divergir de `servers.status`.

## Risks / Trade-offs

- Boot async puede dejar TUI leyendo stores antes de hidratar → agregar estado de inicialización o una función explícita de bootstrap antes de renderizar dashboard.
- Diferencia entre tipos actuales y PRD puede romper UI → mantener mapper central y compatibilidad de campos visibles (`branch`, `publicIp`, `players*`).
- SQLite path real puede variar por OS → encapsular resolución de path y permitir `:memory:` en tests.
- Migraciones futuras pueden ser frágiles → introducir `schema_migrations` desde el primer schema aunque solo exista versión 1.
- Backups en DB sin archivos reales pueden confundir → limitar CRUD a metadatos y marcar acciones de archivo/restore como fuera de scope.

## Migration Plan

1. Crear schema v1 y migración idempotente.
2. Agregar servicio de inventario con seed demo si DB vacía.
3. Integrar bootstrap para hidratar stores antes de mostrar datos finales.
4. Mantener rollback simple: borrar la DB local de desarrollo o usar `:memory:` en tests; no hay migración de datos de producción existente.

## Open Questions

- Ninguna abierta para este cambio. Path local, players telemetry y archived status quedan decididos arriba.
