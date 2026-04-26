## MODIFIED Requirements

### Requirement: Boundaries de módulos
El sistema SHALL separar componentes puros, estado global, lógica de negocio, wrappers técnicos, utilidades puras, tipos compartidos y locales en módulos distintos para evitar acoplamiento prematuro, incluyendo un boundary explícito para persistencia SQLite local.

#### Scenario: UI pura separada de side effects
- **WHEN** se agregan componentes reutilizables de Ink
- **THEN** viven en `src/components/` y no ejecutan deploys, acceso SQLite, SSH, SFTP, RCON ni Pulumi directamente

#### Scenario: Lógica con side effects separada
- **WHEN** se agregan flujos como deploy, backup, lifecycle o scheduler
- **THEN** la orchestration vive en `src/services/` y los wrappers de librerías externas viven en `src/infrastructure/`

#### Scenario: Reglas puras testeables
- **WHEN** se agregan validadores, formatters, paths o cálculos como RAM de JVM
- **THEN** viven en `src/lib/` y pueden probarse sin Ink ni servicios remotos

#### Scenario: Persistencia SQLite separada de UI
- **WHEN** se agregan operaciones de inventario local persistente
- **THEN** la conexión, schema y migraciones SQLite viven en `src/infrastructure/`, el CRUD/hydration vive en `src/services/`, y los componentes Ink no ejecutan queries SQL directamente
