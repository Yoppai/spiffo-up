## Context

`gcp-pulumi-deploy` usa Pulumi Automation API local para crear stacks GCP por servidor. En ejecución real, Automation API llama al binario `pulumi`; si no está instalado o no está en `PATH`, el deploy falla tarde con un error crudo de shell. Ya existe un preflight mínimo (`pulumi version`) que vuelve el error más claro, pero todavía obliga al usuario a salir del TUI, instalar manualmente, reiniciar y reintentar.

La meta de este cambio es reducir fricción sin cambiar el backend de infraestructura: seguir con Pulumi local, pero convertir la dependencia del CLI en un flujo guiado y testeable.

## Goals / Non-Goals

**Goals:**

- Validar Pulumi CLI antes de iniciar `pulumi up`, `destroy` o `status`.
- Ofrecer instalación asistida opt-in cuando falta el CLI.
- Usar versión pinneada del Pulumi CLI para reproducibilidad.
- Mostrar errores y próximos pasos accionables en la UI.
- Mantener side effects fuera de componentes Ink: UI solo dispara servicios.
- Hacer tests con fakes, sin descargar Pulumi ni ejecutar cloud real.

**Non-Goals:**

- No migrar a Google Cloud client libraries/REST.
- No usar Pulumi Cloud, RemoteWorkspace ni Deployments.
- No instalar silenciosamente ni modificar `PATH` global automáticamente.
- No resolver todo el preflight GCP/IAM en este cambio.

## Decisions

### Wrapper `PulumiCliManager`

Crear un wrapper bajo `src/infrastructure/pulumi/` que encapsule:
- `check()` para detectar binario y versión.
- `install()` para instalación asistida con versión pinneada.
- `getCommand()` o equivalente para entregar un `PulumiCommand` al deployer.

Alternativas consideradas:
- Seguir solo con `spawnSync('pulumi version')`: simple, pero no reduce fricción.
- Descargar binario manualmente: más control, más riesgo de checksum/plataforma.
- Usar `PulumiCommand.install()`: API oficial, mejor balance para MVP.

### Instalación opt-in y local al app data

La app SHALL pedir confirmación antes de descargar Pulumi. La instalación asistida debe usar un directorio controlado por la app, por ejemplo `~/.spiffo-up/bin/pulumi/<version>/`, no modificar PATH global. El deployer debe usar ese comando explícito si está disponible.

Alternativas consideradas:
- `winget install Pulumi.Pulumi`: buen fallback manual, pero depende de salir del TUI.
- Modificar PATH del usuario: frágil y demasiado invasivo.

### Estado operativo en servicio, no en schema persistente

El estado `missing/installing/ready/failed` es operativo y temporal. No requiere migración SQLite. Se puede reflejar en Zustand/UI como mensaje del panel o modal.

Alternativas consideradas:
- Persistir estado en SQLite: innecesario; la presencia del binario se revalida rápido.

### Boundary UI mínimo

Server Dashboard debe mostrar acción clara: “Install Pulumi” o “Retry Deploy”. El componente no llama `PulumiCommand` ni `spawn`; invoca servicios. El deploy sigue pasando por `ServerLifecycleService`.

Alternativas consideradas:
- Agregar subcomando `doctor`: útil futuro, pero contradice el enfoque TUI-first actual.

## Risks / Trade-offs

- Descarga binario desde internet puede fallar → fallback manual por OS y retry.
- Supply-chain/version drift → versión pinneada y tests sin red.
- Antivirus/proxy corporativo puede bloquear instalación → error accionable y manual install.
- Binario instalado en app data puede no estar en PATH → usar `PulumiCommand` explícito, no depender de PATH.
- Automation API puede cambiar detalles de `PulumiCommand.install()` → aislar en wrapper mockeable.

## Migration Plan

1. Introducir `PulumiCliManager` sin cambiar deploy behavior.
2. Cambiar `GcpPulumiAutomationDeployer` para recibir manager/comando inyectable.
3. Conectar UI a preflight/install opt-in.
4. Mantener fallback manual documentado.
5. Rollback: volver a preflight PATH actual; no hay migración de datos.

## Open Questions

- Versión exacta de Pulumi CLI a pinnear para MVP.
- Si la acción de instalación debe estar en Server Management únicamente o también en una pantalla global `doctor` futura.
