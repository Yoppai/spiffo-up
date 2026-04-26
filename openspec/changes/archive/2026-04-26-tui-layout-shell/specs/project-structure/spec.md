## MODIFIED Requirements

### Requirement: Sin comportamiento funcional prematuro
El sistema SHALL limitar este cambio a estructura, layout TUI, navegación local y previews visuales, sin implementar flujos reales de deploy, infraestructura cloud, SSH, SFTP, RCON, backups o ejecución de acciones destructivas.

#### Scenario: No deploy real
- **WHEN** se aplica este cambio
- **THEN** no se crean recursos GCP, no se ejecuta Pulumi y no se intenta conectar por SSH/SFTP/RCON

#### Scenario: TUI base permitido
- **WHEN** se aplica este cambio
- **THEN** el dashboard fullscreen, la navegación de paneles y el Server Dashboard básico pueden estar funcionales como shell visual sin ejecutar operaciones reales

#### Scenario: Acciones remotas siguen deshabilitadas
- **WHEN** el usuario ve acciones como deploy, stop, update, archive, backups o scheduler en el TUI base
- **THEN** esas acciones se presentan como previews visuales o placeholders y no disparan side effects remotos
