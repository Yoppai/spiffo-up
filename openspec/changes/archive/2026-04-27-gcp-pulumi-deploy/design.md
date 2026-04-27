## Context

El proyecto ya tiene TUI, inventario SQLite, catálogo GCP, pending changes y acciones visuales de lifecycle, pero las integraciones remotas están deliberadamente en stub. Las dependencias necesarias ya existen (`@pulumi/pulumi`, `@pulumi/gcp`, `yaml`, `rcon-client`, `ssh2`), y el PRD define GCP como único provider funcional del MVP.

Este cambio cruza varias capas: UI Server Dashboard, servicios de lifecycle, inventario local, Pulumi/GCP, generación de puertos, generación de Docker Compose y health checks. La UI debe seguir sin ejecutar side effects directos; solo dispara servicios.

## Goals / Non-Goals

**Goals:**

- Provisionar un servidor Project Zomboid en GCP desde un registro `draft` mediante acción `Deploy` explícita.
- Usar Pulumi Automation API con state local por servidor fuera del repo.
- Crear VM, static IP, firewall rules, startup script y Docker Compose en un solo flujo idempotente cuando sea posible.
- Generar y persistir puertos estables por servidor: UDP game ports y TCP externo de RCON.
- Exponer RCON solo con password fuerte, CIDRs permitidos y advertencia unsafe cuando aplique.
- Persistir resultado del deploy en SQLite y stores: status, IP, stack name, ports y errores.

**Non-Goals:**

- No soportar AWS/Azure.
- No soportar más de un servidor por VM.
- No crear restore completo ni backups remotos.
- No usar Pulumi Cloud.
- No mover compose por SFTP durante deploy inicial.

## Decisions

### Pulumi Automation API con programa inline/local

Usar `@pulumi/pulumi/automation` desde `src/infrastructure/pulumi/` para crear o seleccionar un stack por servidor. El workspace local vive bajo un app data dir como `~/.spiffo-up/pulumi/<server-id>/`, no dentro del repo.

Alternativas consideradas:
- Pulumi CLI shell-out: más simple al inicio, pero peor para capturar outputs/status y testear.
- Pulumi Cloud: resuelve state remoto/locking, pero agrega cuenta externa y contradice la decisión de state local.

### Lifecycle service como boundary único

Crear un servicio de lifecycle en `src/services/` que exponga `deploy`, `destroy` y `status`. La UI invoca este boundary; Pulumi, RCON y file generation quedan detrás de servicios/infrastructure.

Alternativas consideradas:
- Llamar Pulumi desde paneles Ink: rompe boundaries y hace tests UI frágiles.
- Expandir `dashboard-mock-adapter`: útil como transición, pero mezcla mock y real.

### Startup script escribe compose completo

El startup script instala Docker, crea directorios, escribe `docker-compose.yml` con `umask 077` y ejecuta `docker compose up -d`. Esto elimina SFTP inicial y hace el deploy atómico desde Pulumi.

Alternativas consideradas:
- Cloud-init mínimo + SFTP compose: más flexible para updates, pero agrega dependencia SSH antes del primer boot.
- Imagen custom prebuild: más rápida, pero agrega registry/build pipeline fuera del MVP.

### Puertos estables generados una vez

Generar puertos al crear el plan de deploy si faltan, persistirlos y reutilizarlos siempre. No se randomizan en cada arranque. Para RCON, mapear puerto externo generado hacia `27015/tcp` interno si la imagen no soporta `RCONPort` por env var.

Rangos elegidos para MVP:
- Game UDP primary: `30000-39998`, eligiendo un puerto par.
- Game UDP secondary: `primary + 1`.
- RCON TCP externo: `40000-49999`.

Estos rangos evitan puertos privilegiados, defaults conocidos (`16261`, `16262`, `27015`) y el rango ephemeral moderno típico `49152-65535`. La generación debe validar que no haya colisión con otros servidores persistidos localmente.

Alternativas consideradas:
- Defaults fijos: simples para 1 VM, pero menos future-proof y más fingerprinting.
- Random por arranque: rompe firewall, favoritos, health checks y automation.

### RCON expuesto con restricciones

RCON público queda permitido por decisión de producto, pero no debe ser obligatorio. El servidor puede desplegarse con RCON público habilitado o deshabilitado. Si está habilitado, el deploy requiere `RCONPASSWORD` fuerte y `allowedRconCidrs`. El default debe ser CIDR restringido del operador si se puede detectar; `0.0.0.0/0` o `::/0` requiere confirmación unsafe explícita y badge persistente.

La detección sugerida de IP pública usa HTTPS echo services bajo acción explícita del usuario, nunca en startup automático. Estrategia: consultar `api.ipify.org` como primario, `ifconfig.co` y `checkip.amazonaws.com` como fallbacks con timeout corto; normalizar IPv4 a `/32` e IPv6 a `/128`; mostrar el resultado para confirmación y permitir edición manual. No se debe guardar raw response ni ampliar a rangos como `/24` sin acción explícita.

Alternativas consideradas:
- SSH tunnel only: más seguro y era el PRD original, pero se descarta por decisión actual.
- RCON abierto a Internet por default: menor fricción, riesgo inaceptable.

### Wizard sigue creando solo draft

El Setup Wizard no factura ni llama cloud. Confirmar review persiste `draft`; deploy se hace desde Server Dashboard con confirmación de billing/infra.

Alternativas consideradas:
- Deploy al finalizar wizard: menos clicks, pero mezcla creación local con operación costosa/destructiva.

## Risks / Trade-offs

- RCON público aumenta superficie de ataque → Mitigar con CIDRs restringidos, password fuerte, redacción y warnings unsafe.
- Local Pulumi state puede perderse → Guardar path estable en app data y persistir stack/resource metadata suficiente para orientar cleanup manual.
- Secrets en startup script/metadata/compose → Usar `umask 077`, evitar `set -x`, redactar logs y no exportar outputs secretos.
- Startup script puede fallar después de crear recursos → Persistir `error`, ofrecer `Retry Deploy` y `Destroy & Clean Up`.
- Tests no deben crear recursos reales → Diseñar wrappers mockeables y testear generación de plan/program/compose sin llamar GCP.

## Migration Plan

1. Agregar migración SQLite para campos opcionales de infra/puertos/stack sin romper registros existentes.
2. Hidratar registros antiguos con puertos `null`; generar al primer deploy.
3. Mantener stubs para acciones no cubiertas (`Update`, backups, scheduler) hasta futuros cambios.
4. En rollback, los servidores ya provisionados conservan stack local; `destroy` sigue siendo el camino de cleanup.

## Open Questions

- Ninguna por ahora. Decidido: puertos game en `30000-39999`, RCON externo en `40000-49999`, detección opcional de IP pública vía HTTPS echo services con fallback manual, y deploy permitido sin RCON público.
