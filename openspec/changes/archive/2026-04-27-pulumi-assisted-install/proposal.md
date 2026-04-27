## Why

El deploy GCP actual falla tarde si Pulumi CLI no existe en `PATH`, aunque la app ya tenga `@pulumi/pulumi` instalado. Esto rompe la promesa MVP de deploy con baja fricción; necesitamos pasar de “instala Pulumi manualmente” a un flujo guiado, explícito y recuperable.

## What Changes

- Agregar un preflight/doctor de infraestructura antes de `Deploy` que valide Pulumi CLI, versión mínima y acceso básico a comandos requeridos.
- Ofrecer instalación asistida opt-in del Pulumi CLI cuando falte, usando APIs oficiales de Automation API (`PulumiCommand.install()` o wrapper equivalente) con versión pinneada.
- Mostrar estado accionable en TUI: `missing`, `installing`, `ready`, `failed`, con instrucciones manuales por plataforma si el install asistido no procede.
- Persistir/cachar resultado de preflight solo como estado operativo temporal; no guardar paths sensibles ni credenciales.
- Mantener deploy real local con Pulumi Automation API y state local; no migrar aún a Pulumi Deployments ni GCP native SDK.
- Redactar errores de instalación y evitar descargar binarios sin confirmación explícita del usuario.

## Non-goals

- No eliminar Pulumi ni reemplazarlo por Google Cloud client libraries en este cambio.
- No implementar Pulumi Cloud, RemoteWorkspace ni Deployments.
- No instalar Pulumi silenciosamente ni modificar `PATH` global del sistema sin consentimiento.
- No resolver credenciales GCP completas; solo preparar el patrón para preflight extensible.
- No crear un subcomando Commander; el flujo vive dentro del TUI/servicios existentes.

## Capabilities

### New Capabilities
- `pulumi-assisted-install`: Diagnóstico e instalación asistida opt-in del Pulumi CLI para permitir deploy GCP sin configuración manual previa.

### Modified Capabilities
- `server-dashboard-panels`: `Deploy` debe mostrar/usar preflight accionable antes de ejecutar Pulumi y permitir retry después de instalación.

## Impact

- Código nuevo esperado bajo `src/infrastructure/pulumi/` o `src/services/` para preflight, instalación asistida y version checks.
- Cambios en `ServerLifecycleService`/deployer para usar una dependencia de `PulumiCommand` o wrapper inyectable.
- Cambios mínimos en `src/screens/server-dashboard/` para mostrar estado y acción de instalación/retry sin llamar Pulumi directamente desde UI.
- Tests con fakes; `bun test` no debe descargar Pulumi ni tocar red.
- README debe documentar install asistido, fallback manual y límites de seguridad.
