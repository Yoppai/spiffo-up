## ADDED Requirements

### Requirement: Paneles de Server Dashboard encolan cambios concretos
El sistema SHALL permitir que paneles concretos del Server Dashboard añadan pending changes al buffer global con `panel`, `field`, `category`, valores old/new e indicadores de impacto correctos.

#### Scenario: Provider & Region encola infraestructura
- **WHEN** un panel encola cambios de región o instance type
- **THEN** los cambios se guardan con panel `provider-region`, categoría `infrastructure` y `requiresVmRecreate`

#### Scenario: Build encola cambio de branch
- **WHEN** el panel Build encola un cambio de branch
- **THEN** el cambio se guarda con panel `build`, categoría `build` y `requiresRestart`

#### Scenario: Basic Settings encola env e INI
- **WHEN** Basic Settings encola cambios de campos de entorno o descripción
- **THEN** los cambios se guardan con panel `basic-settings`, categoría `env` o `ini-lua` según el campo y `requiresRestart`

#### Scenario: Admins encola secrets sensibles
- **WHEN** Admins encola cambio de password
- **THEN** el cambio se guarda con panel `admins`, categoría `env`, `requiresRestart`, y valor sensible enmascarado/cifrado según el flujo existente

### Requirement: Navegación entre paneles no crea dirty-state local
El sistema SHALL conservar el flujo de buffer global y SHALL NOT mostrar modales de unsaved changes por abandonar un panel con edits locales no encolados.

#### Scenario: Edit local sin Queue se descarta al cambiar panel
- **WHEN** el usuario modifica drafts en un panel y navega a otro panel sin activar `Queue Changes`
- **THEN** el sistema no añade pending changes automáticamente y no muestra modal de dirty-state por panel

#### Scenario: Indicadores usan panel del pending change
- **WHEN** existen pending changes encolados por paneles del Server Dashboard
- **THEN** el sub-menú muestra `•` en los paneles cuyo `panel` coincide y el banner global muestra el conteo total
