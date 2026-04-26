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
El sistema SHALL separar componentes puros, estado global, lógica de negocio, wrappers técnicos, utilidades puras, tipos compartidos y locales en módulos distintos para evitar acoplamiento prematuro.

#### Scenario: UI pura separada de side effects
- **WHEN** se agregan componentes reutilizables de Ink
- **THEN** viven en `src/components/` y no ejecutan deploys, acceso SQLite, SSH, SFTP, RCON ni Pulumi directamente

#### Scenario: Lógica con side effects separada
- **WHEN** se agregan flujos como deploy, backup, lifecycle o scheduler
- **THEN** la orchestration vive en `src/services/` y los wrappers de librerías externas viven en `src/infrastructure/`

#### Scenario: Reglas puras testeables
- **WHEN** se agregan validadores, formatters, paths o cálculos como RAM de JVM
- **THEN** viven en `src/lib/` y pueden probarse sin Ink ni servicios remotos

### Requirement: Stores globales granulares
El sistema SHALL definir stores Zustand granulares para dominios globales distintos, incluyendo servidores, cambios pendientes, settings y estado global de app.

#### Scenario: Store de servidores aislado
- **WHEN** se actualiza la lista o selección de servidores
- **THEN** el cambio pertenece al módulo de servers store y no requiere modificar settings ni pending changes

#### Scenario: Buffer global de cambios separado
- **WHEN** una pantalla agrega cambios pendientes para aplicar luego con `Ctrl+A`
- **THEN** esos cambios pertenecen al pending changes store y no a dirty state local por panel

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
El sistema SHALL limitar este cambio a estructura, contratos mínimos y compilabilidad, sin implementar flujos reales de deploy, infraestructura cloud, SSH, SFTP, RCON, backups o navegación completa.

#### Scenario: No deploy real
- **WHEN** se aplica este cambio
- **THEN** no se crean recursos GCP, no se ejecuta Pulumi y no se intenta conectar por SSH/SFTP/RCON

#### Scenario: No TUI completo
- **WHEN** se aplica este cambio
- **THEN** no se requiere que el dashboard fullscreen, wizard o server dashboard estén funcionalmente completos
