## Why

La app arranca en Ink, pero todavía no ofrece el dashboard fullscreen descrito por el PRD. Este cambio crea la base visual y de navegación para que las futuras vistas de servidores, configuración y gestión puedan compartir un layout estable.

## What Changes

- Agrega un layout TUI reutilizable con cinco zonas: header, system status, panel izquierdo, panel derecho y footer.
- Implementa navegación de Nivel 0 con menú global, foco inicial en el panel izquierdo, `TAB` exclusivo para alternar paneles, `↑↓` para navegar y `ENTER` para seleccionar.
- Muestra una vista `Active Servers Preview` con servidores mock/seed hasta que exista persistencia real.
- Permite entrar al Server Dashboard desde la tabla de servidores activos y volver al menú global con `ESC`.
- Agrega el shell básico del Server Dashboard con sub-menú izquierdo y vista `Server Management` de preview, sin ejecutar acciones reales.
- Usa las dependencias visuales ya previstas por el PRD: `ink-big-text`, `ink-gradient` y `@mishieck/ink-titled-box`.
- Mantiene `Q` como salida global del programa.

## Non-goals

- No implementar deploy real, Pulumi, SSH, SFTP, RCON, backups ni scheduler.
- No implementar modales, resumen de cambios pendientes, pipeline de `Apply Changes` ni `Ctrl+A` funcional.
- No implementar wizards completos, editores inline, selectores de región/instancia ni persistencia SQLite.
- No crear subcomandos CLI antes del TUI fullscreen.

## Capabilities

### New Capabilities
- `tui-layout-shell`: Cubre el layout fullscreen reutilizable, navegación de paneles, menú global, preview de servidores activos y entrada/salida básica del Server Dashboard.

### Modified Capabilities
- `project-structure`: Actualiza el alcance esperado para permitir que el TUI fullscreen y navegación base existan sobre la estructura modular ya definida.

## Impact

- Código UI bajo `src/components/` para shell, header, status, footer y paneles reutilizables.
- Pantallas bajo `src/screens/` para Global Dashboard y Server Dashboard básico.
- Estado global en `src/stores/app-store.ts` y `src/stores/servers-store.ts` para modo de navegación, foco, selección y datos seed.
- Tipos compartidos en `src/types/index.ts` para navegación, panel focus y servers mock.
- Router/app bajo `src/cli/` para montar la pantalla principal.
- Tests con `bun test` e `ink-testing-library` para render básico y navegación clave.
