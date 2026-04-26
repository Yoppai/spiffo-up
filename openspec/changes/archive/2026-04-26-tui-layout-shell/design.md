## Context

El proyecto ya tiene entrypoint Bun/Ink, router React y stores Zustand mínimos, pero el TUI todavía no monta el dashboard fullscreen del PRD. La estructura existente separa `src/cli/`, `src/components/`, `src/screens/`, `src/stores/`, `src/hooks/` y `src/types/`, por lo que el shell debe respetar esos boundaries y evitar lógica cloud o side effects remotos.

El alcance acordado para este cambio es la base visual y navegación: shell de cinco zonas, menú global, preview de servidores con seed mock, entrada básica al Server Dashboard y regreso con `ESC`.

## Goals / Non-Goals

**Goals:**
- Montar un layout reusable con header, system status, panel izquierdo, panel derecho y footer.
- Mantener división horizontal 35% / 65% entre paneles de contenido.
- Usar `ink-big-text`, `ink-gradient` y `@mishieck/ink-titled-box` para acercarse al PRD.
- Centralizar navegación de alto nivel en Zustand: modo global/server, foco de panel, selección de menú, selección de servidor y sub-menú.
- Soportar `TAB`, `↑↓`, `ENTER`, `ESC` y `Q` para el flujo base.
- Cubrir render y navegación con tests de `bun test` e `ink-testing-library`.

**Non-Goals:**
- No ejecutar acciones de infraestructura, lifecycle ni conexiones remotas.
- No implementar modales, `Ctrl+A`, pending changes modal ni pipelines de aplicación.
- No resolver persistencia SQLite ni carga real de inventario.
- No completar todas las vistas internas del Server Dashboard más allá de previews estáticos.

## Decisions

### Estado de navegación en `app-store`

Se modelará la navegación como estado global explícito: `mode` (`global` | `server`), `focusedPanel` (`left` | `right`), índices seleccionados del menú global/sub-menú y cursor de la tabla de servidores.

Alternativa considerada: estado local en cada pantalla. Se descarta porque `TAB`, `ESC`, entrada/salida de Server Dashboard y futuro `Ctrl+A` son atajos globales que cruzan paneles.

### Datos seed en `servers-store`

La preview usará registros seed/mock en `servers-store` mientras no exista SQLite. Los campos mínimos se ampliarán para renderizar la tabla: instance type, players, capacity, branch e IP opcional.

Alternativa considerada: pantalla vacía hasta persistencia real. Se descarta porque impide validar el flujo de navegación del PRD.

### Componentes puros bajo `src/components/`

El shell y piezas visuales (`layout-shell`, `header`, `system-status`, `footer`, `titled-panel`) serán componentes sin side effects remotos. Las pantallas viven co-localizadas por feature bajo `src/screens/<feature>/` y componen esos componentes conectando stores.

Alternativa considerada: una pantalla monolítica. Se descarta porque el PRD exige reutilización del layout en Nivel 0 y Nivel 1.

### Router simple para la pantalla principal

`src/cli/router.tsx` seguirá siendo el punto de integración y renderizará el dashboard principal. No se agregan subcomandos ni rutas complejas todavía.

Alternativa considerada: mapear cada panel a rutas. Se pospone porque el flujo actual es TUI fullscreen con navegación interna por teclado.

### Responsive pragmático

El layout calculará anchos con base en columnas disponibles y mantendrá 35/65. Para terminales críticas mostrará advertencia de tamaño mínimo; truncamiento/scroll avanzado queda preparado pero no exhaustivo.

Alternativa considerada: implementar scroll horizontal completo ahora. Se pospone para evitar sobredimensionar este primer slice.

## Risks / Trade-offs

- [APIs visuales de libs Ink varían] → Validar imports reales con `bun test` y ajustar wrappers de componentes.
- [Emoji/ancho Unicode puede desalinear tablas] → Mantener tabla simple y tests enfocados en contenido/navegación, no snapshots rígidos de columnas.
- [Estado global puede crecer demasiado] → Limitar store a navegación shell; acciones de dominio futuras deberán ir a stores/servicios específicos.
- [Seed mock confundible con data real] → Nombrar helpers/constantes como mock/seed y no persistirlos.
- [Terminal resize difícil de probar] → Cubrir cálculo puro de anchos si se extrae a helper y validar advertencia de tamaño mínimo.

## Migration Plan

1. Agregar tipos de navegación, panel focus y datos de servidor extendidos.
2. Extender stores con navegación shell y seed de servidores.
3. Crear componentes visuales reutilizables del shell.
4. Crear pantallas Global Dashboard y Server Dashboard básico.
5. Conectar router/app al dashboard.
6. Agregar tests de render y navegación.

Rollback: revertir los archivos del cambio deja el entrypoint/router anterior sin tocar dependencias externas nuevas, porque las dependencias visuales ya están en `package.json`.

## Open Questions

- El umbral exacto de terminal crítica puede ajustarse durante implementación; propuesta inicial: advertir bajo 60 columnas o altura insuficiente.
- La forma final de i18n para labels queda fuera de este slice; textos pueden quedar inline inicialmente y migrarse luego a locales.
