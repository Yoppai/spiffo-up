# Project Structure Specification

## Purpose

Define la estructura técnica base del proyecto para que futuras features del TUI de Project Zomboid mantengan boundaries consistentes entre UI, estado global, lógica de negocio, adaptadores técnicos, utilidades puras, tipos e i18n.

## Requirements

### Requirement: Estructura modular base
El sistema SHALL organizar el código fuente bajo `src/` usando la arquitectura Feature-Based Modular definida por el PRD, con carpetas base para `cli`, `screens`, `components`, `hooks`, `stores`, `services`, `infrastructure`, `lib`, `types` y `locales`.

#### Scenario: Skeleton técnico presente
- **WHEN** un desarrollador inspecciona `src/` después de aplicar el cambio
- **THEN** las carpetas base requeridas existen y comunican la responsabilidad principal de cada capa

#### Scenario: Entry point estable
- **WHEN** el binario `spiffo-up` arranca desde `index.tsx`
- **THEN** el entrypoint raíz permanece compatible con `package.json` y delega la composición de la app a módulos bajo `src/cli/`

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

### Requirement: Stores globales granulares
El sistema SHALL definir stores Zustand granulares para dominios globales distintos, incluyendo servidores, cambios pendientes, settings y estado global de app.

#### Scenario: Store de servidores aislado
- **WHEN** se actualiza la lista o selección de servidores
- **THEN** el cambio pertenece al módulo de servers store y no requiere modificar settings ni pending changes

#### Scenario: Buffer global de cambios separado
- **WHEN** una pantalla agrega cambios pendientes para aplicar luego con `Ctrl+A`
- **THEN** esos cambios pertenecen al pending changes store y no a dirty state local por panel

#### Scenario: Modal global separado de datos del buffer
- **WHEN** se abre o cierra el modal de pending changes
- **THEN** el estado de visibilidad y selección del modal pertenece al estado global de app, mientras los cambios pendientes permanecen en el pending changes store

### Requirement: Hook compatible con Ink para Zustand
El sistema SHALL exponer un hook `useInkStore` para que componentes Ink lean stores Zustand de forma compatible con re-rendering en terminal.

#### Scenario: Componente lee Zustand
- **WHEN** un componente Ink necesita seleccionar estado global de Zustand
- **THEN** usa `useInkStore` en lugar de leer el store directamente con `useStore`

### Requirement: i18n base bilingüe
El sistema SHALL preparar archivos de locale para English y Español como base de internacionalización del TUI.

#### Scenario: Locales iniciales disponibles
- **WHEN** se inicializa la capa de i18n en un cambio futuro
- **THEN** existen archivos base para `en` y `es` bajo `src/locales/`

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
