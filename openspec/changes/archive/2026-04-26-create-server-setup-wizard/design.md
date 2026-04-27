## Context

La TUI actual arranca en `DashboardScreen` y usa `LayoutShell` como esqueleto reutilizable de header, status, panel izquierdo, panel derecho y footer. El menú global ya incluye `Crear Nuevo Servidor`, pero el panel derecho todavía muestra `Coming Soon`. También existe persistencia local SQLite para servidores y un `ServerRecord` con `status: 'draft'`, lo que permite crear inventario local sin depender de cloud.

El PRD define que el MVP funcional será GCP, con AWS/Azure visibles como `Coming Soon`, selección de región, tiers curados de instancias y flujo guiado para autenticación/proyecto. La implementación de deploy real queda fuera de este cambio para respetar la frontera actual de “sin side effects remotos”.

## Goals / Non-Goals

**Goals:**

- Convertir la opción `Crear Nuevo Servidor` en un Setup Wizard navegable dentro de la TUI.
- Reutilizar el shell fullscreen existente y mantener `TAB` exclusivo para alternar foco entre paneles.
- Modelar un flujo por pasos: Provider → Auth/Project → Server Name → Region → Instance → Review.
- Crear un registro local `draft` con provider GCP, nombre, región/zona e instance type seleccionados.
- Mantener AWS/Azure visibles pero deshabilitados con `Coming Soon`.
- Dejar explícito que el review no ejecuta Pulumi ni provisionamiento real.

**Non-Goals:**

- Deploy real en GCP, Pulumi stacks, SSH/SFTP/RCON o Docker remoto.
- Auth real contra Google Cloud o enumeración real de proyectos vía API.
- Billing API o precios runtime exactos.
- Rehacer el Server Dashboard o cambiar el modelo de pending changes global.

## Decisions

1. **Wizard como estado TUI local, no como Server Dashboard.**
   - Decisión: agregar estado específico de wizard en Zustand y renderizarlo cuando el usuario entra desde `create-server`.
   - Razón: el wizard no pertenece al contexto de un servidor existente; compartir `dashboardPanels` mezclaría conceptos.
   - Alternativa considerada: crear una route separada con `react-router`. Se descarta para este cambio porque la app ya centraliza input y layout en una screen única, y el beneficio de routing real todavía es bajo.

2. **Crear `draft` local en review, no deploy remoto.**
   - Decisión: la confirmación persiste un servidor local `draft` y vuelve a la lista de servidores activos o muestra estado de éxito.
   - Razón: habilita valor visible y testable sin romper el límite de no side effects remotos.
   - Alternativa considerada: botón `Review & Deploy` que ejecuta Pulumi. Se pospone a una capability de deploy GCP.

3. **Catálogo hardcoded y determinístico para MVP.**
   - Decisión: definir datos estáticos para providers, regiones GCP e instance tiers basados en el PRD.
   - Razón: permite UI y tests estables; API de catálogo/precios/latencia real puede añadirse después.
   - Alternativa considerada: consultar Google Cloud APIs. Se descarta por complejidad de auth, cuotas y networking.

4. **Navegación ESC step-back.**
   - Decisión: `ESC` vuelve al paso anterior en steps 2+, y en Step 1 Provider activa `[Cancel Wizard]`.
   - Razón: coincide con la decisión de UX tomada durante explore mode y mantiene un modelo predecible.
   - Alternativa considerada: `ESC` siempre cancela. Se descarta porque sería demasiado destructivo en formularios multi-step.

5. **Validación local antes de avanzar.**
   - Decisión: bloquear avance del paso `Server Name` si el nombre está vacío o no puede derivar un id estable.
   - Razón: evita registros inválidos en SQLite y errores posteriores en dashboard/deploy.
   - Alternativa considerada: permitir drafts incompletos. Se descarta para mantener el inventario simple.

## Risks / Trade-offs

- **Texto `Review & Deploy` puede sugerir deploy real** → Mitigar mostrando copy explícito: “Creates local draft only; deploy execution is not implemented yet”.
- **Estado de wizard puede duplicar patrones de paneles** → Mitigar con tipos y acciones específicas (`wizard.step`, `wizard.draft`, `wizard.cursor`) en vez de reutilizar `DashboardPanelUiState`.
- **Catálogo hardcoded puede quedar obsoleto** → Mitigar centralizando datos en un módulo pequeño y dejando nombres/costos con prefijo `~`.
- **Entrada de texto en Ink puede ser frágil en tests** → Mitigar con handlers puros y tests de store/acciones además de tests renderizados.
- **Cancelación accidental en Step 1** → Mitigar con `[Cancel Wizard]` visible y comportamiento documentado; si ya hay campos posteriores, el usuario tendría que haber retrocedido antes.

## Migration Plan

1. Agregar el wizard como una vista nueva detrás de la opción existente `create-server`.
2. Mantener la vista `Coming Soon` para archived/settings y providers AWS/Azure.
3. Persistir solo registros nuevos `draft`; no modificar registros existentes.
4. Rollback: volver `create-server` a preview `Coming Soon` y dejar datos draft ya creados en inventario local como servidores no provisionados.

## Open Questions

Resueltas:

- El label final SHALL ser `Crear servidor` / `Create Server`, no `Create Draft` ni `Review & Deploy`. Para usuarios sin conocimiento técnico, “draft” es jerga interna y “deploy” promete infraestructura real que este cambio no ejecuta. El copy del review deberá explicar: “Se creará el servidor en tu inventario local. Podrás desplegarlo desde su dashboard cuando el deploy esté disponible.”
- Después de crear el servidor, el sistema SHALL abrir directamente el Server Dashboard del nuevo servidor. Esto reduce incertidumbre: el usuario ve inmediatamente “su” servidor, su estado `draft` y las siguientes acciones disponibles.
- El paso `Auth/Project` SHALL empezar como detección/placeholder con opción de edición manual de `projectId`, pero sin validación remota obligatoria.
  - **Ventajas de solo placeholder detectado:** flujo más simple, menos errores de tipeo, menor carga cognitiva para usuarios nuevos.
  - **Desventajas de solo placeholder detectado:** si la detección falla o el usuario tiene varios proyectos, queda bloqueado o confundido.
  - **Ventajas de edición manual:** permite avanzar aunque no haya detección automática, soporta usuarios con varios proyectos y prepara el terreno para deploy real.
  - **Desventajas de edición manual:** usuarios sin experiencia pueden pegar un valor incorrecto; sin Cloud API no se puede confirmar si existe.
  - **Decisión:** mostrar un valor detectado cuando exista; si no existe, mostrar `No project detected` y permitir `Edit project id (optional)`. Marcar el campo como “se validará al desplegar” para no presentar la creación local como autenticación real.
