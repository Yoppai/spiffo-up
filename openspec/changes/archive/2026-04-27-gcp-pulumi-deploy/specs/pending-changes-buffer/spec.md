## MODIFIED Requirements

### Requirement: Acciones del modal
El sistema SHALL permitir aplicar, descartar o volver a edición desde el modal de pending changes; cuando existan cambios de infraestructura para servidores GCP provisionados, SHALL delegar esa fase al servicio real de lifecycle antes de limpiar el buffer.

#### Scenario: Apply All ejecuta pipeline local
- **WHEN** el usuario confirma `Apply All` sin cambios que requieran infraestructura real
- **THEN** el sistema ejecuta el pipeline local en orden `infrastructure`, `build`, `env`, `ini-lua`, muestra resultado y limpia store y SQLite si termina exitosamente

#### Scenario: Apply All ejecuta infraestructura real
- **WHEN** el usuario confirma `Apply All` con cambios `infrastructure` de un servidor GCP provisionado
- **THEN** el sistema ejecuta la fase de infraestructura mediante lifecycle service y solo limpia el buffer si la fase termina exitosamente

#### Scenario: Discard All limpia buffer
- **WHEN** el usuario confirma `Discard All`
- **THEN** el sistema elimina todos los pending changes del store y SQLite y cierra el modal

#### Scenario: Back to Edit conserva buffer
- **WHEN** el usuario selecciona `Back to Edit` o presiona `ESC` dentro del modal
- **THEN** el sistema cierra el modal y conserva todos los pending changes

### Requirement: Pipeline sin side effects remotos
El sistema SHALL limitar la aplicación local de pending changes a planificación y persistencia, excepto por cambios `infrastructure` de servidores GCP provisionados que SHALL usar el servicio de lifecycle real definido por `gcp-pulumi-deploy`.

#### Scenario: Apply All no ejecuta remotos para categorías no implementadas
- **WHEN** el usuario aplica cambios de build, env o INI/LUA sin infraestructura real soportada
- **THEN** el sistema no ejecuta SSH, SFTP, Docker ni RCON reales durante este cambio

#### Scenario: Apply All puede recrear infraestructura GCP
- **WHEN** el buffer contiene cambio de región o instance type para un servidor GCP provisionado
- **THEN** el sistema puede ejecutar destroy/deploy o update via Pulumi a través del lifecycle service
