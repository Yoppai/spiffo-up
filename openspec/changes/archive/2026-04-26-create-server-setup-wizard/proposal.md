## Why

El menú global ya promete `Crear Nuevo Servidor`, pero hoy la vista muestra `Coming Soon` y no existe un flujo guiado para transformar la intención del usuario en un registro local de servidor. Este cambio habilita el primer camino completo del MVP para crear un servidor GCP desde la TUI, manteniendo AWS/Azure visibles como futuras integraciones.

## What Changes

- Agregar un Setup Wizard accesible desde `Crear Nuevo Servidor` en el menú global.
- Guiar al usuario por pasos: provider, auth/project, server name, region selector, instance selector y review.
- Permitir seleccionar GCP como provider funcional del MVP; mostrar AWS y Azure deshabilitados con `Coming Soon`.
- Mostrar placeholder/detección básica para auth/project sin bloquear el flujo por integración cloud real.
- Validar nombre de servidor antes de avanzar al review.
- Reutilizar catálogo GCP curado del PRD para regiones e instance types, incluyendo tiers recomendados para Project Zomboid.
- Crear un registro local `draft` al confirmar el review, sin ejecutar Pulumi, SSH, SFTP ni RCON.
- Definir navegación del wizard: `ESC` vuelve al paso anterior; en Step 1 Provider, `ESC` enfoca/activa `[Cancel Wizard]`.
- Mantener `Review & Deploy` como revisión previa, pero sin deploy remoto real en este cambio.

## Non-goals

- No ejecutar deploy real en GCP con Pulumi.
- No implementar OAuth/login real ni selección completa de proyectos mediante Cloud APIs.
- No habilitar AWS ni Azure más allá de estados disabled `Coming Soon`.
- No implementar medición real de latencia HTTP si requiere networking adicional; puede usarse estado placeholder/mock.
- No crear infraestructura remota, abrir puertos, configurar Docker ni conectar por SSH/SFTP/RCON.
- No cambiar el Server Dashboard ni el pipeline global de pending changes salvo lo necesario para navegar hacia/desde el wizard.

## Capabilities

### New Capabilities

- `create-server-setup-wizard`: Flujo TUI guiado para crear un servidor local `draft` desde el menú global con provider GCP, auth/project placeholder, nombre, región, instancia y review.

### Modified Capabilities

- `tui-layout-shell`: La opción global `Crear Nuevo Servidor` deja de ser solo preview `Coming Soon` y puede abrir un flujo wizard navegable.
- `local-server-inventory`: El wizard crea un registro local de servidor en estado `draft` sin side effects remotos.

## Impact

- Código TUI: `src/screens/main-menu/*`, posible nuevo folder `src/screens/create-server-wizard/*`, `src/cli/router.tsx` o flujo de `DashboardScreen` según integración elegida.
- Estado: `src/stores/app-store.ts` para navegación/step state del wizard; `src/stores/servers-store.ts` para insertar/hidratar el nuevo draft local.
- Tipos: `src/types/index.ts` para steps, draft shape, selección de provider/region/instance.
- Persistencia local: repository/service existente de servidores para guardar el draft.
- Tests: `bun test` con cobertura de navegación, validación, estados disabled y creación local sin side effects remotos.
