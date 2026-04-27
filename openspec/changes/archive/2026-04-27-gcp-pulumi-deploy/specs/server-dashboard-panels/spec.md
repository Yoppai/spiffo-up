## MODIFIED Requirements

### Requirement: Server Management thin UI
El sistema SHALL mostrar estado del servidor, IP, branch, players, puertos relevantes, exposición RCON y acciones rápidas de ciclo de vida conectadas a hooks reales cuando el provider sea GCP y la acción esté implementada.

#### Scenario: Acciones de ciclo de vida son seleccionables
- **WHEN** el foco está en el panel derecho de `Server Management`
- **THEN** el usuario puede navegar entre `Deploy`, `Start` o `Stop`, `Update` y `Archive`

#### Scenario: Deploy usa hook real para GCP draft
- **WHEN** el usuario confirma `Deploy` en un servidor GCP `draft` o `error`
- **THEN** el sistema invoca el servicio de lifecycle y muestra estado/progreso sin llamar Pulumi directamente desde el componente UI

#### Scenario: RCON expuesto muestra badge
- **WHEN** un servidor tiene RCON público configurado
- **THEN** Server Management muestra si RCON está `restricted` o `unsafe`

#### Scenario: Archive requiere confirmación stub
- **WHEN** el usuario confirma la acción `Archive`
- **THEN** el sistema muestra una confirmación destructiva antes de ejecutar cualquier resultado stub o cleanup implementado

### Requirement: Adapters mock/stub no ejecutan side effects remotos
El sistema SHALL mantener adapters mock/stub para capacidades aún no implementadas, pero SHALL permitir que Server Management delegue deploy, destroy y status GCP a servicios reales fuera de la UI.

#### Scenario: Acciones no implementadas siguen stub
- **WHEN** el usuario activa acciones de players, stats, advanced settings, scheduler, backups o lifecycle no cubiertas por esta change
- **THEN** el sistema no ejecuta SSH, SFTP, Docker, RCON, file picker nativo ni cloud APIs reales para esas acciones

#### Scenario: Deploy GCP sale del adapter mock
- **WHEN** el usuario activa `Deploy` para un servidor GCP elegible
- **THEN** la acción se enruta al servicio real de lifecycle y no al resultado stub local
