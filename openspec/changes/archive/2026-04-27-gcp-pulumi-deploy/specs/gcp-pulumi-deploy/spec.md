## ADDED Requirements

### Requirement: Deploy GCP explícito desde servidor draft
El sistema SHALL permitir ejecutar deploy real solamente desde una acción explícita `Deploy` para servidores GCP en estado `draft` o `error`, después de confirmación por posible costo cloud.

#### Scenario: Deploy requiere confirmación
- **WHEN** el usuario activa `Deploy` para un servidor GCP elegible
- **THEN** el sistema muestra confirmación indicando que se crearán recursos facturables antes de iniciar `pulumi up`

#### Scenario: Wizard no dispara deploy
- **WHEN** el usuario confirma el Setup Wizard
- **THEN** el sistema crea solo un `draft` local y no ejecuta `Deploy`

### Requirement: Pulumi local state por servidor
El sistema SHALL crear o seleccionar un stack Pulumi local por servidor, guardando el workspace/state fuera del repo y asociando el stack al registro local.

#### Scenario: Stack local creado
- **WHEN** inicia el deploy de un servidor sin stack existente
- **THEN** el sistema crea un workspace local bajo app data y persiste el stack name asociado al servidor

#### Scenario: State fuera del repo
- **WHEN** el sistema prepara el workspace Pulumi
- **THEN** los archivos de state no se escriben bajo el directorio del repositorio del proyecto

### Requirement: Recursos GCP mínimos
El sistema SHALL provisionar una VM Ubuntu, una IP externa estática regional, firewall rules y metadata/startup script usando Pulumi GCP.

#### Scenario: Pulumi up crea recursos base
- **WHEN** el deploy ejecuta `pulumi up` con project, zone e instance type válidos
- **THEN** el stack define `gcp.compute.Address`, `gcp.compute.Firewall` y `gcp.compute.Instance` conectados por tags y outputs

#### Scenario: IP estática se persiste
- **WHEN** `pulumi up` completa exitosamente
- **THEN** el sistema persiste la IP pública/estática en SQLite y la muestra en Server Management

### Requirement: Puertos estables por servidor
El sistema SHALL generar puertos estables por servidor una sola vez, persistirlos y reutilizarlos en firewall, Docker Compose, health checks y status, usando `30000-39999` para puertos UDP de juego y `40000-49999` para RCON TCP externo.

#### Scenario: Puertos generados al deploy plan
- **WHEN** un servidor elegible no tiene puertos asignados y se prepara el deploy
- **THEN** el sistema genera y persiste puerto UDP principal, puerto UDP secundario y puerto TCP externo de RCON

#### Scenario: Puertos evitan colisión local
- **WHEN** el sistema genera puertos para un servidor nuevo
- **THEN** no reutiliza puertos ya persistidos por otros servidores locales no archivados

#### Scenario: Reinicio conserva puertos
- **WHEN** un servidor ya tiene puertos persistidos y se reintenta o consulta deploy
- **THEN** el sistema reutiliza los mismos puertos y no genera valores nuevos automáticamente

### Requirement: Firewall Project Zomboid y RCON
El sistema SHALL abrir firewall para los puertos UDP de Project Zomboid y SHALL abrir el puerto TCP externo de RCON solo cuando RCON público esté habilitado con CIDRs configurados.

#### Scenario: Firewall abre puertos de juego
- **WHEN** el programa Pulumi crea reglas de firewall
- **THEN** permite tráfico UDP hacia los puertos persistidos del servidor Project Zomboid

#### Scenario: RCON requiere CIDRs
- **WHEN** RCON está expuesto públicamente
- **THEN** el firewall TCP de RCON usa `allowedRconCidrs` y no queda sin source ranges explícitos

#### Scenario: RCON público deshabilitado
- **WHEN** el servidor se despliega con RCON público deshabilitado
- **THEN** el sistema no crea firewall ingress público para RCON y no requiere `allowedRconCidrs` para completar deploy

#### Scenario: RCON unsafe requiere confirmación
- **WHEN** `allowedRconCidrs` contiene `0.0.0.0/0` o `::/0`
- **THEN** el sistema exige confirmación unsafe explícita y marca el servidor como RCON unsafe en la UI

### Requirement: Sugerencia de allowedRconCidrs
El sistema SHALL poder sugerir `allowedRconCidrs` detectando la IP pública del operador mediante HTTPS echo services solo cuando el usuario lo solicite, normalizando el resultado a CIDR de host exacto.

#### Scenario: Detectar IPv4 pública
- **WHEN** el usuario solicita detectar su IP pública y el servicio devuelve una IPv4 válida
- **THEN** el sistema sugiere esa IP como `<ip>/32` y requiere confirmación antes de guardarla

#### Scenario: Detectar IPv6 pública
- **WHEN** el usuario solicita detectar su IP pública y el servicio devuelve una IPv6 válida
- **THEN** el sistema sugiere esa IP como `<ip>/128` y requiere confirmación antes de guardarla

#### Scenario: Detección falla
- **WHEN** todos los HTTPS echo services fallan o devuelven una respuesta inválida
- **THEN** el sistema permite ingresar `allowedRconCidrs` manualmente sin usar `0.0.0.0/0` ni `::/0` como default

### Requirement: RCON password obligatorio y secreto
El sistema SHALL exigir `RCONPASSWORD` fuerte para todo deploy con RCON público habilitado y SHALL tratarlo como secret redacted.

#### Scenario: Password faltante se genera
- **WHEN** el servidor no tiene `RCONPASSWORD` al preparar deploy
- **THEN** el sistema genera un password fuerte y lo persiste como secret sin mostrarlo en logs ni outputs

#### Scenario: Deploy bloquea password inválido
- **WHEN** el deploy plan contiene RCON expuesto sin password válido
- **THEN** el sistema bloquea `pulumi up` y muestra error accionable

### Requirement: Startup script genera Docker Compose completo
El sistema SHALL inyectar un startup script que instala Docker, crea directorios, escribe `docker-compose.yml` completo y ejecuta `docker compose up -d`.

#### Scenario: Compose creado en boot
- **WHEN** la VM arranca por primera vez
- **THEN** el startup script crea los directorios requeridos, escribe compose con env vars del servidor y arranca el contenedor

#### Scenario: Secrets no se imprimen
- **WHEN** se genera o ejecuta el startup script
- **THEN** no usa `set -x`, aplica permisos restrictivos y no imprime `ADMINPASSWORD`, `RCONPASSWORD` ni server password en logs controlados por la app

### Requirement: Health check y estado de deploy
El sistema SHALL actualizar estado de deploy durante el lifecycle y verificar disponibilidad mediante polling RCON con timeout.

#### Scenario: Deploy exitoso
- **WHEN** Pulumi completa, la VM arranca y RCON responde dentro del timeout
- **THEN** el sistema marca el servidor como `running`, limpia `lastError` y persiste outputs relevantes

#### Scenario: Deploy fallido
- **WHEN** cualquier fase de deploy falla
- **THEN** el sistema marca el servidor como `error`, persiste `lastError` y ofrece `Retry Deploy` o `Destroy & Clean Up`

### Requirement: Destroy y cleanup GCP
El sistema SHALL permitir destruir recursos GCP de un servidor provisionado mediante el stack Pulumi local asociado.

#### Scenario: Destroy ejecuta pulumi destroy
- **WHEN** el usuario confirma cleanup destructivo de un servidor provisionado
- **THEN** el sistema ejecuta `pulumi destroy` sobre el stack local asociado y actualiza estado/IP según resultado

#### Scenario: Destroy fallido conserva error
- **WHEN** `pulumi destroy` falla
- **THEN** el sistema conserva metadata del stack y registra el error para reintento

### Requirement: Status consulta infraestructura local/remota
El sistema SHALL exponer un hook `status` que lea outputs/estado conocido del stack y actualice el inventario sin recrear recursos.

#### Scenario: Status actualiza inventario
- **WHEN** el usuario solicita status de un servidor provisionado
- **THEN** el sistema consulta el boundary de infraestructura y refleja status, IP y error conocido en SQLite/store
