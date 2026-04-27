## 1. Modelo local y migración

- [x] 1.1 Extender tipos compartidos para metadata de infraestructura: stack name, workspace path, puertos, CIDRs RCON, flag unsafe, deploy timestamps y errores.
- [x] 1.2 Agregar migración SQLite idempotente para campos opcionales de deploy sin perder registros existentes.
- [x] 1.3 Actualizar `LocalInventoryService` para leer/escribir metadata de deploy y mantener hidratación Zustand compatible.
- [x] 1.4 Agregar tests de migración e hidratación para servidores antiguos sin campos de infraestructura.

## 2. Generación de puertos y secrets

- [x] 2.1 Crear utilidades puras para generar puertos estables por servidor y evitar regeneración si ya existen.
- [x] 2.2 Crear utilidades para generar `RCONPASSWORD` fuerte y validar passwords existentes.
- [x] 2.3 Modelar rangos `30000-39999` para game UDP y `40000-49999` para RCON TCP externo, evitando colisiones locales.
- [x] 2.4 Modelar `publicRconEnabled`, `allowedRconCidrs`, default restringido e indicador unsafe para `0.0.0.0/0` y `::/0`.
- [x] 2.5 Implementar detector opcional de IP pública vía HTTPS echo services con fallback manual y normalización `/32` o `/128`.
- [x] 2.6 Agregar tests de puertos persistidos, password obligatorio cuando RCON público esté habilitado, fallback manual y bloqueo de RCON unsafe sin confirmación.

## 3. Docker Compose y startup script

- [x] 3.1 Crear generador de `docker-compose.yml` con env vars Project Zomboid, puertos persistidos y mapping externo RCON generado hacia `27015/tcp` interno.
- [x] 3.2 Crear generador de startup script que instala Docker, crea directorios, escribe compose con permisos restrictivos y ejecuta `docker compose up -d`.
- [x] 3.3 Redactar secrets en logs/errores controlados por la app.
- [x] 3.4 Agregar tests snapshot/estructurales del compose y startup script sin exponer secrets.

## 4. Pulumi GCP infrastructure

- [x] 4.1 Crear wrapper de Pulumi Automation API con workspace local por servidor fuera del repo.
- [x] 4.2 Implementar programa GCP para `gcp.compute.Address`, `gcp.compute.Firewall` y `gcp.compute.Instance` con tags, zone/region correctas y startup script.
- [x] 4.3 Exportar outputs no sensibles: IP, instance name, current status y resource identifiers necesarios.
- [x] 4.4 Agregar tests con mocks/fakes para validar inputs de Pulumi y rutas de workspace sin llamar GCP real.

## 5. Lifecycle service

- [x] 5.1 Crear `ServerLifecycleService` con `deploy`, `destroy` y `status` como boundary único para UI/pending changes.
- [x] 5.2 Implementar flujo `deploy`: validar server GCP, generar faltantes, marcar `provisioning`, ejecutar Pulumi, persistir outputs y health check RCON.
- [x] 5.3 Implementar manejo de falla: status `error`, `lastError`, reintento y metadata suficiente para cleanup.
- [x] 5.4 Implementar `destroy` con confirmación consumida por UI y conservación de error si falla.
- [x] 5.5 Implementar `status` sin recrear recursos y con actualización de inventario/store.

## 6. Integración UI Server Dashboard

- [x] 6.1 Reemplazar ruta stub de `Deploy` para servidores GCP elegibles por llamada al lifecycle service.
- [x] 6.2 Mostrar confirmación de billing/infra antes de deploy y confirmación destructiva antes de destroy/cleanup.
- [x] 6.3 Mostrar IP, puertos y badge `RCON exposed: restricted|unsafe` en Server Management.
- [x] 6.4 Mantener acciones no cubiertas como stubs sin side effects remotos.
- [x] 6.5 Agregar tests Ink del flujo de selección/confirmación sin ejecutar Pulumi real.

## 7. Pending changes e infraestructura

- [x] 7.1 Actualizar `PendingChangesApplicationService` para delegar cambios `infrastructure` de servidores GCP provisionados al lifecycle service.
- [x] 7.2 Conservar pipeline local para categorías no implementadas y limpiar buffer solo tras éxito.
- [x] 7.3 Agregar tests de apply exitoso/fallido para cambios de región o instance type con lifecycle fake.

## 8. Verificación

- [x] 8.1 Ejecutar `bun test` y corregir fallas sin crear recursos cloud reales.
- [x] 8.2 Ejecutar build verificado `bun build ./index.tsx --outdir ./dist --target node`.
- [x] 8.3 Revisar que ningún test o import ejecute Pulumi/GCP en carga de módulo.
- [x] 8.4 Documentar variables/credenciales GCP esperadas para deploy manual fuera de tests.
