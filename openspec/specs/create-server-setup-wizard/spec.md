# Create Server Setup Wizard Specification

## Purpose

Define un asistente step-by-step (Setup Wizard) para crear servidores Project Zomboid desde la TUI, guiando al usuario por selección de provider, auth/project, nombre, región, instancia y review, y creando solo un registro local `draft` al confirmar, sin side effects remotos.

## Requirements

### Requirement: Wizard accesible desde el menú global
El sistema SHALL abrir un Setup Wizard cuando el usuario selecciona `Crear Nuevo Servidor` desde el menú global.

#### Scenario: Abrir wizard desde menú global
- **WHEN** el foco está en el panel izquierdo del menú global, la opción `Crear Nuevo Servidor` está seleccionada y el usuario presiona `ENTER`
- **THEN** el sistema muestra el Setup Wizard con el paso `Provider` activo

#### Scenario: Shell reutilizado en wizard
- **WHEN** el Setup Wizard está visible
- **THEN** el sistema conserva header, status, panel izquierdo, panel derecho y footer del shell TUI fullscreen

### Requirement: Stepper de creación de servidor
El sistema SHALL guiar al usuario por los pasos `Provider`, `Auth/Project`, `Server Name`, `Region`, `Instance` y `Review`.

#### Scenario: Pasos visibles
- **WHEN** el Setup Wizard está visible
- **THEN** el panel izquierdo muestra la lista de pasos del wizard con el paso actual resaltado

#### Scenario: Avance entre pasos
- **WHEN** el usuario completa un paso válido y presiona `ENTER` sobre la acción `Next`
- **THEN** el sistema avanza al siguiente paso del wizard

#### Scenario: Retroceso con ESC
- **WHEN** el usuario está en cualquier paso posterior a `Provider` y presiona `ESC`
- **THEN** el sistema vuelve al paso anterior conservando las selecciones ya ingresadas

#### Scenario: ESC en primer paso cancela wizard
- **WHEN** el usuario está en el paso `Provider` y presiona `ESC`
- **THEN** el sistema enfoca o activa la acción `[Cancel Wizard]`

### Requirement: Selección de provider MVP
El sistema SHALL permitir seleccionar GCP como provider habilitado y SHALL mostrar AWS/Azure como opciones deshabilitadas `Coming Soon`.

#### Scenario: GCP habilitado
- **WHEN** el paso `Provider` está visible
- **THEN** la opción `GCP` aparece seleccionable y puede usarse para continuar el wizard

#### Scenario: AWS y Azure deshabilitados
- **WHEN** el paso `Provider` está visible
- **THEN** las opciones `AWS` y `Azure` aparecen con texto `Coming Soon` y no pueden seleccionarse como provider activo

### Requirement: Auth/project placeholder
El sistema SHALL mostrar un paso `Auth/Project` con estado placeholder o detección local sin requerir autenticación cloud real.

#### Scenario: Auth no bloquea MVP local
- **WHEN** el usuario entra al paso `Auth/Project`
- **THEN** el sistema muestra información de project/auth detectada o placeholder y permite continuar sin llamar Cloud APIs

### Requirement: Validación de server name
El sistema SHALL requerir un nombre de servidor válido antes de avanzar desde el paso `Server Name`.

#### Scenario: Nombre vacío bloqueado
- **WHEN** el usuario intenta avanzar desde `Server Name` sin ingresar un nombre válido
- **THEN** el sistema permanece en el paso y muestra un error de validación

#### Scenario: Nombre válido aceptado
- **WHEN** el usuario ingresa un nombre válido y avanza
- **THEN** el sistema conserva el nombre en el draft del wizard y muestra el paso `Region`

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

### Requirement: Review sin side effects remotos
El sistema SHALL mostrar un resumen final y SHALL crear solamente un registro local `draft` al confirmar.

#### Scenario: Review muestra resumen
- **WHEN** el usuario entra al paso `Review`
- **THEN** el sistema muestra provider, auth/project placeholder, server name, región/zona e instance type seleccionados

#### Scenario: Confirmación crea draft local
- **WHEN** el usuario confirma el review
- **THEN** el sistema crea un servidor local con estado `draft` y no ejecuta Pulumi, SSH, SFTP ni RCON

#### Scenario: Cancel wizard vuelve al menú global
- **WHEN** el usuario activa `[Cancel Wizard]`
- **THEN** el sistema vuelve al menú global sin crear un servidor nuevo
