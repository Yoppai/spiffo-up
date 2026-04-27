## MODIFIED Requirements

### Requirement: Review sin side effects remotos
El sistema SHALL mostrar un resumen final y SHALL crear solamente un registro local `draft` al confirmar; el deploy real SHALL permanecer como acción explícita posterior desde Server Dashboard.

#### Scenario: Review muestra resumen
- **WHEN** el usuario entra al paso `Review`
- **THEN** el sistema muestra provider, auth/project placeholder, server name, región/zona e instance type seleccionados

#### Scenario: Confirmación crea draft local
- **WHEN** el usuario confirma el review
- **THEN** el sistema crea un servidor local con estado `draft` y no ejecuta Pulumi, SSH, SFTP ni RCON

#### Scenario: Draft queda listo para deploy posterior
- **WHEN** el servidor draft se crea correctamente
- **THEN** el usuario puede entrar a Server Dashboard y ejecutar `Deploy` como acción separada con confirmación

#### Scenario: Cancel wizard vuelve al menú global
- **WHEN** el usuario activa `[Cancel Wizard]`
- **THEN** el sistema vuelve al menú global sin crear un servidor nuevo
