## Purpose

Define the Level 1 Server Dashboard thin UI with all panels rendering specific content, navigation semantics, mock/stub adapters, and pending-change queuing for configuration panels.

## Requirements

### Requirement: Server Dashboard renderiza todos los paneles de Nivel 1
El sistema SHALL renderizar contenido específico para los paneles `Server Management`, `Provider & Region`, `Build`, `Players`, `Stats`, `Basic Settings`, `Advanced Settings`, `Admins`, `Scheduler` y `Backups` dentro del Server Dashboard.

#### Scenario: Panel seleccionado muestra contenido propio
- **WHEN** el usuario navega por el sub-menú del Server Dashboard y selecciona un panel
- **THEN** el panel derecho muestra título y contenido específico de ese panel, no un placeholder genérico de implementación futura

#### Scenario: Back to Servers regresa al menú global
- **WHEN** el usuario selecciona `Back to Servers` sin pending changes
- **THEN** el sistema vuelve al menú global con `Servidores Activos` seleccionado

### Requirement: Navegación del panel derecho
El sistema SHALL permitir interacción de thin UI en el panel derecho cuando el foco esté en `right`, manteniendo `TAB` exclusivamente para alternar foco entre panel izquierdo y derecho.

#### Scenario: Flechas navegan dentro del panel derecho
- **WHEN** el foco está en el panel derecho de un panel con controles verticales u horizontales
- **THEN** `↑↓` cambia el control o fila activa y `←→` cambia la acción horizontal cuando aplique

#### Scenario: TAB no navega controles internos
- **WHEN** el usuario presiona `TAB` desde cualquier panel de Server Dashboard
- **THEN** el foco alterna entre panel izquierdo y panel derecho sin avanzar entre campos internos

### Requirement: Server Management thin UI
El sistema SHALL mostrar estado del servidor, IP, branch, players y acciones rápidas de ciclo de vida con comportamiento stub.

#### Scenario: Acciones de ciclo de vida son seleccionables
- **WHEN** el foco está en el panel derecho de `Server Management`
- **THEN** el usuario puede navegar entre `Deploy`, `Start` o `Stop`, `Update` y `Archive`

#### Scenario: Archive requiere confirmación stub
- **WHEN** el usuario confirma la acción `Archive`
- **THEN** el sistema muestra una confirmación destructiva antes de ejecutar cualquier resultado stub

### Requirement: Provider & Region thin UI
El sistema SHALL mostrar provider, region, instance type, costo estimado y recomendación usando datos locales o mock, y SHALL permitir seleccionar región e instancia sin ejecutar cloud real.

#### Scenario: Seleccionar región encola cambio de infraestructura
- **WHEN** el usuario elige una región nueva desde el selector mock
- **THEN** el sistema añade un pending change con panel `provider-region`, categoría `infrastructure` y `requiresVmRecreate`

#### Scenario: Seleccionar instancia encola cambio de infraestructura
- **WHEN** el usuario elige un instance type nuevo desde tiers o catálogo mock
- **THEN** el sistema añade un pending change con panel `provider-region`, categoría `infrastructure` y `requiresVmRecreate`

#### Scenario: AWS y Azure aparecen deshabilitados
- **WHEN** el panel muestra proveedores cloud
- **THEN** AWS y Azure aparecen como `Coming Soon` o deshabilitados para el MVP

### Requirement: Build thin UI
El sistema SHALL mostrar la branch actual, el image tag derivado y opciones `stable`, `unstable` y `outdatedunstable`.

#### Scenario: Queue de branch genera cambio build
- **WHEN** el usuario selecciona una branch distinta y activa `Queue Changes`
- **THEN** el sistema añade un pending change con panel `build`, categoría `build` y `requiresRestart`

### Requirement: Players thin UI
El sistema SHALL mostrar una lista mock de jugadores conectados y acciones de moderación stub.

#### Scenario: Lista mock de jugadores se renderiza
- **WHEN** el usuario abre `Players`
- **THEN** el sistema muestra connected players, username, status y acciones por jugador usando adapter mock

#### Scenario: Kick y Ban requieren confirmación
- **WHEN** el usuario selecciona `Kick` o `Ban` para un jugador
- **THEN** el sistema muestra una confirmación antes de completar el resultado stub

### Requirement: Stats thin UI
El sistema SHALL mostrar métricas mock de contenedor, logs snapshot y acciones de refresh/logs sin ejecutar SSH o Docker real.

#### Scenario: Stats muestra métricas y logs mock
- **WHEN** el usuario abre `Stats`
- **THEN** el sistema muestra CPU, memoria, red, disk I/O y últimas líneas de logs desde adapter mock

#### Scenario: Refresh actualiza snapshot local
- **WHEN** el usuario activa `Refresh Stats`
- **THEN** el sistema solicita un nuevo snapshot al adapter mock sin ejecutar comandos remotos

### Requirement: Basic Settings thin UI
El sistema SHALL mostrar formulario editable para Server Name, Public Name, Description, Server Password y Public Listing con validaciones básicas.

#### Scenario: Queue de Basic Settings genera pending changes
- **WHEN** el usuario modifica campos válidos y activa `Queue Changes`
- **THEN** el sistema añade pending changes con panel `basic-settings`, categorías `env` o `ini-lua` según el campo y `requiresRestart`

#### Scenario: Password se marca sensible
- **WHEN** el usuario encola cambio de Server Password
- **THEN** el pending change se marca como `sensitive` y no expone plaintext en el resumen

### Requirement: Advanced Settings thin UI
El sistema SHALL mostrar archivos de configuración esperados para el servidor y acciones stub de edit, replace y download.

#### Scenario: Lista archivos esperados por SERVERNAME
- **WHEN** el usuario abre `Advanced Settings`
- **THEN** el sistema muestra `${SERVERNAME}.ini`, `${SERVERNAME}_SandboxVars.lua` y `${SERVERNAME}_spawnregions.lua`

#### Scenario: Acciones de archivo no ejecutan SFTP real
- **WHEN** el usuario selecciona edit, replace o download
- **THEN** el sistema muestra una sub-vista o resultado stub sin conexión remota

### Requirement: Admins thin UI
El sistema SHALL mostrar formulario editable para Admin Username y Admin Password con validaciones básicas.

#### Scenario: Queue de Admins genera pending changes sensibles
- **WHEN** el usuario modifica admin credentials válidas y activa `Queue Changes`
- **THEN** el sistema añade pending changes con panel `admins`, categoría `env`, `requiresRestart`, y marca password como `sensitive`

### Requirement: Scheduler thin UI
El sistema SHALL mostrar scheduled tasks mock y permitir crear, editar, habilitar, deshabilitar o eliminar tareas como stub local.

#### Scenario: Lista tareas mock
- **WHEN** el usuario abre `Scheduler`
- **THEN** el sistema muestra tareas con tipo, cron legible y estado enabled/disabled

#### Scenario: Edición de tarea valida cron básico
- **WHEN** el usuario edita una tarea con cron inválido
- **THEN** el sistema muestra error local y no completa el stub de guardado

### Requirement: Backups thin UI
El sistema SHALL mostrar historial mock de backups, ubicación local y acciones stub de create, restore y delete.

#### Scenario: Backup history se renderiza
- **WHEN** el usuario abre `Backups`
- **THEN** el sistema muestra fecha, tamaño, tipo, status y acciones por backup desde adapter mock

#### Scenario: Restore y Delete requieren confirmación
- **WHEN** el usuario selecciona restore o delete para un backup
- **THEN** el sistema muestra confirmación destructiva antes de completar el resultado stub

### Requirement: Adapters mock/stub no ejecutan side effects remotos
El sistema SHALL limitar todos los adapters de esta change a datos deterministas o resultados stub locales.

#### Scenario: Acciones stub no llaman integraciones reales
- **WHEN** el usuario activa acciones de lifecycle, players, stats, advanced settings, scheduler o backups
- **THEN** el sistema no ejecuta Pulumi, SSH, SFTP, Docker, RCON, file picker nativo ni cloud APIs
