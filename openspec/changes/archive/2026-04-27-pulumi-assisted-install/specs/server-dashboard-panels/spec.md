## MODIFIED Requirements

### Requirement: Server Management thin UI
El sistema SHALL mostrar estado del servidor, IP, branch, players y acciones rápidas de ciclo de vida; para servidores GCP elegibles, `Deploy` SHALL usar preflight Pulumi accionable antes de ejecutar lifecycle real, mientras acciones no cubiertas siguen como stub.

#### Scenario: Acciones de ciclo de vida son seleccionables
- **WHEN** el foco está en el panel derecho de `Server Management`
- **THEN** el usuario puede navegar entre `Deploy`, `Start` o `Stop`, `Update` y `Archive`

#### Scenario: Deploy muestra preflight Pulumi faltante
- **WHEN** el usuario confirma `Deploy` para un servidor GCP elegible y Pulumi CLI falta
- **THEN** el panel muestra que Pulumi está `missing`, no ejecuta `pulumi up` y ofrece `Install Pulumi` o instrucciones manuales

#### Scenario: Install Pulumi requiere confirmación
- **WHEN** el usuario selecciona `Install Pulumi`
- **THEN** el panel muestra una confirmación explícita antes de descargar o instalar el CLI

#### Scenario: Deploy continúa tras CLI listo
- **WHEN** el preflight Pulumi está `ready` después de detectar o instalar el CLI
- **THEN** el sistema permite reintentar `Deploy` y enruta la acción al servicio de lifecycle sin ejecutar Pulumi directamente desde la UI

#### Scenario: Archive requiere confirmación stub
- **WHEN** el usuario confirma la acción `Archive`
- **THEN** el sistema muestra una confirmación destructiva antes de ejecutar cualquier resultado stub
