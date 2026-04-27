## MODIFIED Requirements

### Requirement: CRUD básico de servidores
El sistema SHALL exponer operaciones locales para crear, leer, actualizar y archivar servidores en SQLite mediante una capa service/repository, incluyendo creación de servidores `draft` desde el Setup Wizard.

#### Scenario: Crear servidor local
- **WHEN** se crea un servidor con campos mínimos válidos de inventario
- **THEN** el sistema persiste el registro en `servers` con timestamps y lo puede leer de vuelta

#### Scenario: Crear draft desde wizard
- **WHEN** el usuario confirma el review del Setup Wizard con provider GCP, nombre, región/zona e instance type válidos
- **THEN** el sistema persiste un servidor local con estado `draft` y lo puede hidratar en los stores Zustand

#### Scenario: Actualizar servidor local
- **WHEN** se actualiza provider, zona, instance type, branch, IP, status o error del servidor
- **THEN** el sistema persiste el cambio y actualiza `updated_at`

#### Scenario: Archivar servidor local
- **WHEN** se marca un servidor como archived con metadatos de backup
- **THEN** el sistema conserva el registro en SQLite y lo excluye de listas activas usadas por el TUI

### Requirement: Sin side effects remotos
El sistema SHALL limitar esta capacidad a persistencia local y no ejecutar operaciones cloud ni conexiones remotas, incluyendo la confirmación del Setup Wizard.

#### Scenario: CRUD local no dispara cloud
- **WHEN** se crean, actualizan, archivan o cargan servidores del inventario
- **THEN** no se ejecuta Pulumi, SSH, SFTP ni RCON

#### Scenario: Confirmar wizard no dispara cloud
- **WHEN** el usuario confirma el review del Setup Wizard
- **THEN** el sistema crea solo el registro local y no ejecuta Pulumi, SSH, SFTP ni RCON
