## 1. Pulumi CLI manager

- [x] 1.1 Crear `PulumiCliManager`/tipos para estados `missing`, `ready`, `installing`, `failed` y versión mínima pinneada.
- [x] 1.2 Implementar `check()` para detectar CLI gestionado por app y fallback en `PATH` sin ejecutar deploy remoto.
- [x] 1.3 Implementar `install()` opt-in con `PulumiCommand.install()` o wrapper equivalente, directorio app data y versión pinneada.
- [x] 1.4 Asegurar redacción de errores de instalación y mensajes manuales por plataforma.

## 2. Integración con deployer/lifecycle

- [x] 2.1 Cambiar `GcpPulumiAutomationDeployer` para recibir manager/comando Pulumi inyectable en vez de depender solo de `PATH`.
- [x] 2.2 Usar CLI gestionado explícitamente cuando exista, sin modificar `PATH` global.
- [x] 2.3 Exponer preflight desde `ServerLifecycleService` para que la UI consulte estado antes de `deploy`.
- [x] 2.4 Mantener bloqueo seguro: si preflight no está `ready`, no ejecutar `pulumi up`, `destroy` ni `status`.

## 3. UI Server Management

- [x] 3.1 Mostrar estado Pulumi (`ready`, `missing`, `installing`, `failed`) en Server Management para servidores GCP elegibles.
- [x] 3.2 Agregar acción/confirmación `Install Pulumi` cuando el CLI esté faltante o incompatible.
- [x] 3.3 Agregar `Retry Deploy` después de instalación exitosa o falla recuperable.
- [x] 3.4 Mantener acciones no cubiertas como stubs sin side effects remotos.

## 4. Tests y documentación

- [x] 4.1 Agregar tests unitarios del manager con fakes: CLI faltante, CLI en PATH, CLI gestionado, instalación exitosa y fallida.
- [x] 4.2 Agregar tests de lifecycle/deployer que confirmen que no corre Pulumi si preflight no está `ready`.
- [x] 4.3 Agregar tests Ink del flujo `missing → confirm install → ready/retry` sin descargar Pulumi real.
- [x] 4.4 Actualizar README con install asistido, fallback manual y nota de que tests no descargan Pulumi.
- [x] 4.5 Ejecutar `bun test`.
- [x] 4.6 Ejecutar `bun build ./index.tsx --outdir ./dist --target node`.
