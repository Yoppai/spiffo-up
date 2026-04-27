## MODIFIED Requirements

### Requirement: Selector de región GCP
El sistema SHALL permitir seleccionar una zona GCP desde el catálogo compartido `gcp-cloud-catalog`, mostrando zonas agrupadas por continente, ubicación descriptiva y latencia HTTP medida o fallback.

#### Scenario: Regiones visibles
- **WHEN** el usuario entra al paso `Region`
- **THEN** el sistema muestra zonas GCP agrupadas o listadas con nombre técnico, ubicación descriptiva y estado de latencia placeholder o medido

#### Scenario: Zonas ordenadas por latencia dentro de continente
- **WHEN** existen mediciones de latencia para zonas del mismo continente
- **THEN** el sistema muestra esas zonas de menor a mayor ping dentro del grupo

#### Scenario: Región seleccionada
- **WHEN** el usuario selecciona una región/zona y confirma
- **THEN** el sistema conserva la selección y permite avanzar al paso `Instance`

### Requirement: Selector de instancia GCP
El sistema SHALL permitir seleccionar un instance type GCP desde tiers curados o desde el catálogo filtrado compartido orientado a Project Zomboid.

#### Scenario: Tiers curados visibles
- **WHEN** el usuario entra al paso `Instance`
- **THEN** el sistema muestra tiers como `Budget`, `Balanced`, `Performance`, `Growth` y `Heavy/Modded` con vCPU, RAM y costo estimado

#### Scenario: Recomendación visible
- **WHEN** el usuario entra al paso `Instance`
- **THEN** el sistema marca el tier recomendado por `MaxPlayers` o el fallback `Balanced` si el wizard aún no tiene `MaxPlayers`

#### Scenario: Catálogo filtrado visible
- **WHEN** el usuario revisa las opciones avanzadas de instancia
- **THEN** el sistema muestra categorías filtradas de instance types aptas para game servers

#### Scenario: Instancia seleccionada
- **WHEN** el usuario selecciona un instance type y confirma
- **THEN** el sistema conserva la selección y permite avanzar al paso `Review`

#### Scenario: Instancia filtrada aceptada en validación
- **WHEN** el usuario selecciona una instancia que no es tier curado pero existe en el catálogo filtrado
- **THEN** el sistema acepta el draft local como válido
