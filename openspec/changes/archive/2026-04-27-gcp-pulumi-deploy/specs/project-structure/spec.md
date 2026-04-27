## MODIFIED Requirements

### Requirement: Sin comportamiento funcional prematuro
El sistema SHALL permitir comportamiento funcional real solamente a través de servicios explícitos de infraestructura/lifecycle agregados para GCP, manteniendo estructura, layout, navegación y componentes UI libres de side effects directos.

#### Scenario: No deploy real desde UI directa
- **WHEN** se aplica este cambio
- **THEN** los componentes Ink no crean recursos GCP, no ejecutan Pulumi directamente y no abren conexiones SSH/SFTP/RCON por sí mismos

#### Scenario: TUI base permitido
- **WHEN** se aplica este cambio
- **THEN** el dashboard fullscreen, la navegación de paneles y el Server Dashboard básico pueden estar funcionales como shell visual

#### Scenario: Servicios autorizados ejecutan lifecycle real
- **WHEN** una acción confirmada de deploy, destroy o status GCP cruza el boundary de `src/services/`
- **THEN** los wrappers bajo `src/infrastructure/` pueden ejecutar Pulumi/GCP y health checks según los specs de `gcp-pulumi-deploy`

#### Scenario: Acciones no migradas siguen deshabilitadas
- **WHEN** el usuario ve acciones como backups, scheduler, restore, SFTP o moderación remota no cubiertas por esta change
- **THEN** esas acciones se presentan como previews, placeholders o stubs y no disparan side effects remotos
