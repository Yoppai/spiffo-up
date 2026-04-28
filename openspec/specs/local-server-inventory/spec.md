# Local Server Inventory Specification

## Purpose

Define la persistencia SQLite local como fuente de verdad para servidores, settings, pending changes y metadatos básicos de backups, manteniendo la TUI navegable mediante hidratación a stores Zustand.

## Requirements

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

#### Scenario: Actualizar metadatos de infraestructura
- **WHEN** un servicio de deploy persiste stack name, puertos generados, CIDRs RCON, IP estática o status de infraestructura
- **THEN** el sistema guarda los campos y los hidrata en los stores Zustand

#### Scenario: Archivar servidor local
- **WHEN** se marca un servidor como archived con metadatos de backup
- **THEN** el sistema conserva el registro en SQLite y lo excluye de listas activas usadas por el TUI

### Requirement: Persistencia de settings
El sistema SHALL persistir settings globales como pares `key`/`value` en SQLite y cargar defaults cuando falten claves esperadas.

#### Scenario: Cargar settings con defaults
- **WHEN** la DB no contiene `locale`, `theme` o `backup_path`
- **THEN** el sistema devuelve valores default válidos y puede persistirlos para siguientes arranques

#### Scenario: Actualizar setting
- **WHEN** una setting global cambia
- **THEN** el sistema guarda el nuevo valor en SQLite y la siguiente hidratación devuelve ese valor

### Requirement: Persistencia de pending changes
El sistema SHALL persistir el buffer global de pending changes por servidor con panel, field, old/new values no sensibles, payload cifrado para valores sensibles, categoría de cambio e indicadores de impacto, y SHALL permitir limpiarlo cuando el usuario aplica o descarta todos los cambios.

#### Scenario: Agregar pending change
- **WHEN** una pantalla encola un cambio pendiente para un servidor
- **THEN** el sistema lo persiste en `pending_changes` y lo hidrata en el store global

#### Scenario: Limpiar pending changes
- **WHEN** el usuario aplica o descarta todos los cambios pendientes
- **THEN** el sistema elimina esos registros de SQLite y el store queda vacío

#### Scenario: Rehidratar cambios conserva indicadores
- **WHEN** la aplicación arranca con pending changes persistidos
- **THEN** el store hidratado conserva suficiente información para renderizar panel, field, old/new values, categoría e impacto

#### Scenario: Persistir cambio sensible sin plaintext
- **WHEN** se persiste un pending change sensible
- **THEN** SQLite conserva metadata cifrada y no conserva el valor real del secret en columnas plaintext

### Requirement: Metadatos básicos de backups
El sistema SHALL persistir metadatos locales de backups sin ejecutar creación, restore ni eliminación de archivos remotos.

#### Scenario: Registrar backup local
- **WHEN** se registra un backup con path, size, type y status
- **THEN** el sistema guarda el metadato asociado al servidor en SQLite

#### Scenario: Listar backups por servidor
- **WHEN** el TUI o un servicio solicita backups de un servidor
- **THEN** el sistema devuelve los backups ordenables por fecha de creación

### Requirement: Campos opcionales de backup en ServerRecord
El sistema SHALL permitir que `ServerRecord` incluya `backupPath?: string | null` y `backupSize?: number | null` para persistir metadatos de backup al archivar.

#### Scenario: Servidor archivado con metadatos
- **GIVEN** un servidor con `status='archived'`, `backupPath` y `backupSize`
- **WHEN** se hidrata en `servers-store`
- **THEN** los campos estan disponibles para la UI sin romper tipos existentes

#### Scenario: Servidor sin metadatos de backup
- **GIVEN** un servidor sin `backupPath` ni `backupSize`
- **WHEN** se usa en componentes de archived servers
- **THEN** no produce error de TypeScript por `strict: true`

### Requirement: Hidratación Zustand desde SQLite
El sistema SHALL hidratar los stores Zustand de servidores, settings y pending changes desde SQLite durante el arranque.

#### Scenario: Boot con inventario persistido
- **WHEN** la aplicación arranca con registros existentes en SQLite
- **THEN** los stores Zustand reflejan esos registros antes de renderizar el dashboard principal

#### Scenario: Boot con DB vacía
- **WHEN** la aplicación arranca con una DB sin servidores
- **THEN** inserta demo data idempotente y la hidrata para mantener el TUI navegable

#### Scenario: Rehidratación no destruye datos
- **WHEN** la aplicación se reinicia después de cambios persistidos
- **THEN** no reemplaza datos de usuario con seeds demo

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
