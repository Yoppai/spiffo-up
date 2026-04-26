## 1. Tipos y estado de navegación

- [x] 1.1 Ampliar `src/types/index.ts` con tipos para `PanelFocus`, modo de dashboard, menú global, sub-menú de servidor y `ServerRecord` extendido para la tabla.
- [x] 1.2 Extender `src/stores/app-store.ts` con estado y acciones para foco de panel, selección de menú global, cursor de servidores, entrada/salida de Server Dashboard y selección de sub-menú.
- [x] 1.3 Extender `src/stores/servers-store.ts` con seed mock de servidores y helpers de selección sin persistencia real.

## 2. Componentes shell reutilizables

- [x] 2.1 Crear componentes bajo `src/components/` para `layout-shell`, header con `ink-big-text`/`ink-gradient`, system status, footer y panel titulado.
- [x] 2.2 Implementar cálculo responsive 35/65 y mensaje de terminal demasiado pequeña con helper testeable si aplica.
- [x] 2.3 Exportar componentes desde `src/components/index.ts` manteniendo imports ESM compatibles con Bun/bundler.

## 3. Pantallas y navegación por teclado

- [x] 3.1 Crear `src/screens/main-menu/` con menú global, previews de contenido y tabla de servidores activos.
- [x] 3.2 Crear `src/screens/server-dashboard/` con sub-menú del servidor y preview de `Server Management` sin side effects.
- [x] 3.3 Implementar `useInput` para `TAB`, `↑↓`, `ENTER`, `ESC` y `Q` según foco y modo actual.
- [x] 3.4 Conectar `src/cli/router.tsx` o `src/cli/app.tsx` para renderizar el dashboard real en lugar del placeholder.

## 4. Tests y validación

- [x] 4.1 Agregar tests de stores para navegación global, cambio de foco, entrada a Server Dashboard y regreso con `ESC`.
- [x] 4.2 Agregar tests Ink de render básico: header/status/footer, menú global, preview de servidores y Server Dashboard básico.
- [x] 4.3 Ejecutar `bun test` y corregir fallos.
- [x] 4.4 Ejecutar `bun build ./index.tsx --outdir ./dist --target node` para validar compilación Bun/Node.
