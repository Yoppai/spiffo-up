## MODIFIED Requirements

### Requirement: Schema SQLite de inventario local
El sistema SHALL instalar un schema SQLite local versionado para persistir servidores, settings, pending changes, metadatos básicos de backups y metadatos de infraestructura GCP real como stack local, puertos generados, IPs y flags de exposición RCON.

#### Scenario: Instalación idempotente del schema
- **WHEN** la aplicación inicializa la base SQLite en una DB vacía
- **THEN** crea las tablas requeridas y registra la versión de schema sin requerir servicios remotos

#### Scenario: Reejecución de migración
- **WHEN** la aplicación inicializa una DB que ya tiene el schema actual
- **THEN** no duplica datos, no falla por tablas existentes y conserva los registros existentes

#### Scenario: Migración conserva servidores existentes
- **WHEN** la aplicación inicializa una DB previa sin campos de infraestructura real
- **THEN** agrega campos opcionales para stack, puertos, CIDRs RCON, IPs y timestamps sin perder servidores existentes

### Requirement: CRUD básico de servidores
El sistema SHALL exponer operaciones locales para crear, leer, actualizar y archivar servidores en SQLite mediante una capa service/repository, incluyendo creación de servidores `draft` desde el Setup Wizard y actualización de metadatos de deploy desde servicios de infraestructura.

#### Scenario: Crear servidor local
- **WHEN** se crea un servidor con campos mínimos válidos de inventario
- **THEN** el sistema persiste el registro en `servers` con timestamps y lo puede leer de vuelta

#### Scenario: Crear draft desde wizard
- **WHEN** el usuario confirma el review del Setup Wizard con provider GCP, nombre, región/zona e instance type válidos
- **THEN** el sistema persiste un servidor local con estado `draft` y lo puede hidratar en los stores Zustand

#### Scenario: Actualizar servidor local
- **WHEN** se actualiza provider, zona, instance type, branch, IP, status o error del servidor
- **THEN** el sistema persiste el cambio y actualiza `updated_at`

#### Scenario: Actualizar metadatos de infraestructura
- **WHEN** un servicio de deploy persiste stack name, puertos generados, CIDRs RCON, IP estática o status de infraestructura
- **THEN** el sistema guarda los campos y los hidrata en los stores Zustand

#### Scenario: Archivar servidor local
- **WHEN** se marca un servidor como archived con metadatos de backup
- **THEN** el sistema conserva el registro en SQLite y lo excluye de listas activas usadas por el TUI

### Requirement: Sin side effects remotos
El sistema SHALL limitar las operaciones puras de inventario y la confirmación del Setup Wizard a persistencia local; solo los servicios explícitos de lifecycle/deploy pueden ejecutar Pulumi, SSH, Docker o RCON.

#### Scenario: CRUD local no dispara cloud
- **WHEN** se crean, actualizan, archivan o cargan servidores del inventario directamente
- **THEN** no se ejecuta Pulumi, SSH, SFTP ni RCON

#### Scenario: Confirmar wizard no dispara cloud
- **WHEN** el usuario confirma el review del Setup Wizard
- **THEN** el sistema crea solo el registro local y no ejecuta Pulumi, SSH, SFTP ni RCON

#### Scenario: Lifecycle service puede persistir resultados remotos
- **WHEN** un servicio de lifecycle completa deploy, destroy o status
- **THEN** el inventario persiste los resultados recibidos sin ejecutar side effects por sí mismo
