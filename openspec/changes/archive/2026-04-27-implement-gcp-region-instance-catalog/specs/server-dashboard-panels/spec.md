## MODIFIED Requirements

### Requirement: Provider & Region thin UI
El sistema SHALL mostrar provider, region, instance type, costo estimado y recomendación usando el catálogo GCP compartido, y SHALL permitir seleccionar región e instancia sin ejecutar cloud real.

#### Scenario: Seleccionar región encola cambio de infraestructura
- **WHEN** el usuario elige una región nueva desde el selector mock
- **THEN** el sistema añade un pending change con panel `provider-region`, categoría `infrastructure` y `requiresVmRecreate`

#### Scenario: Seleccionar instancia encola cambio de infraestructura
- **WHEN** el usuario elige un instance type nuevo desde tiers o catálogo mock
- **THEN** el sistema añade un pending change con panel `provider-region`, categoría `infrastructure` y `requiresVmRecreate`

#### Scenario: AWS y Azure aparecen deshabilitados
- **WHEN** el panel muestra proveedores cloud
- **THEN** AWS y Azure aparecen como `Coming Soon` o deshabilitados para el MVP

#### Scenario: Región muestra latencia del catálogo
- **WHEN** el panel Provider & Region muestra la región actual o seleccionable
- **THEN** el sistema muestra latencia medida, `measuring...` o fallback de latencia desde el catálogo compartido

#### Scenario: Instancia muestra costo estimado
- **WHEN** el panel Provider & Region muestra el instance type actual o seleccionable
- **THEN** el sistema muestra costo estimado hardcodeado por hora y/o mes con aviso de precio aproximado

#### Scenario: Recomendación usa MaxPlayers
- **WHEN** el servidor tiene `MaxPlayers` o `playersMax` disponible
- **THEN** el panel muestra el tier/instance type recomendado por el catálogo GCP compartido

#### Scenario: Selector usa catálogo filtrado
- **WHEN** el usuario cambia instance type desde Provider & Region
- **THEN** el sistema permite elegir entre tiers curados y opciones del catálogo filtrado sin ejecutar cloud APIs
