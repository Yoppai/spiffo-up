## Why

El MVP ya permite crear servidores locales `draft`, elegir zona/instancia GCP y encolar cambios, pero las acciones de lifecycle siguen siendo stubs sin infraestructura real. Este cambio convierte GCP en el primer provider funcional: crea una VM con IP estática, firewall y Docker Compose para correr Project Zomboid desde el Server Dashboard.

## What Changes

- Agregar deploy real para servidores GCP `draft` usando Pulumi Automation API con state local por servidor.
- Crear recursos GCP mínimos: VM Ubuntu, IP pública estática, firewall rules, metadata/startup script y tags.
- Generar puertos estables por servidor una sola vez y persistirlos: puertos UDP de juego y puerto TCP externo para RCON.
- Exponer RCON en un puerto externo generado, siempre con `RCONPASSWORD` fuerte, CIDRs permitidos y advertencia si se usa modo unsafe.
- Generar `docker-compose.yml` completo dentro del startup script y arrancar el contenedor `Danixu/project-zomboid-server-docker` sin SFTP inicial.
- Agregar hooks de lifecycle `deploy`, `destroy` y `status` conectados al Server Dashboard y al inventario local.
- Mantener el Setup Wizard como creación de borrador local; el usuario ejecuta `Deploy` explícitamente después.
- Actualizar estados persistidos: `draft → provisioning → running|error`, IP pública/estática, stack name, puertos y último error.

## Non-goals

- No implementar AWS ni Azure; siguen como `Coming Soon`.
- No implementar múltiples servidores por VM; solo se prepara el modelo de puertos para ese futuro.
- No implementar restore completo desde backup ni scheduler remoto.
- No implementar SFTP inicial para compose; el startup script escribe y arranca todo.
- No migrar a Pulumi Cloud; el state será local.

## Capabilities

### New Capabilities
- `gcp-pulumi-deploy`: Provisionamiento real en GCP con Pulumi local, VM, IP estática, firewall, startup script, Docker Compose, deploy/destroy/status y health check.

### Modified Capabilities
- `local-server-inventory`: Persistir metadatos de infraestructura real, puertos generados, stack local, estado de deploy y errores.
- `server-dashboard-panels`: Cambiar acciones de Server Management de stubs a hooks reales para servidores GCP.
- `create-server-setup-wizard`: Reafirmar que el wizard crea solo `draft` local y no ejecuta deploy.
- `pending-changes-buffer`: Permitir que cambios de infraestructura usen el hook real de recreate/deploy en vez de solo limpiar buffer local.
- `project-structure`: Permitir servicios de infraestructura reales fuera de componentes UI, manteniendo UI sin side effects directos.

## Impact

- Código nuevo esperado bajo `src/infrastructure/` y `src/services/` para Pulumi, lifecycle, compose, puertos y status.
- Cambios en `src/types/index.ts`, SQLite schema y `LocalInventoryService` para campos de infraestructura.
- Cambios en `src/screens/server-dashboard/` y aplicación de pending changes para llamar servicios reales vía boundary.
- Pruebas nuevas con mocks de Pulumi/servicios externos; no deben crear recursos reales durante `bun test`.
- Requiere credenciales GCP disponibles localmente para deploy real fuera de tests.
