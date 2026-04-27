## 1. Estado y datos del wizard

- [x] 1.1 Definir tipos TypeScript para steps, draft del wizard, provider options, regiones GCP e instance tiers curados.
- [x] 1.2 Agregar estado/actions Zustand específicos para wizard: abrir, cancelar, avanzar, retroceder, mover cursor, editar nombre y resetear draft.
- [x] 1.3 Crear módulo de catálogo estático para GCP con providers, regiones/zonas y tiers de instancia basados en el PRD.
- [x] 1.4 Integrar creación local de servidor `draft` reutilizando service/repository/store existente sin side effects remotos.

## 2. Render e interacción TUI

- [x] 2.1 Crear componentes del Setup Wizard usando `LayoutShell`, panel izquierdo como stepper y panel derecho como contenido del paso actual.
- [x] 2.2 Implementar step `Provider` con GCP habilitado, AWS/Azure disabled `Coming Soon`, `[Cancel Wizard]` y `[Next]`.
- [x] 2.3 Implementar step `Auth/Project` con placeholder/detección local y avance sin Cloud APIs.
- [x] 2.4 Implementar step `Server Name` con entrada de texto, validación de nombre vacío/inválido y mensajes de error.
- [x] 2.5 Implementar step `Region` con navegación por regiones/zonas GCP y estado de latencia placeholder o mock.
- [x] 2.6 Implementar step `Instance` con tiers curados, datos de vCPU/RAM/JVM/costo estimado y selección navegable.
- [x] 2.7 Implementar step `Review` con resumen, aviso de draft local/no deploy remoto y confirmación de creación.

## 3. Navegación e integración con menú global

- [x] 3.1 Conectar `Crear Nuevo Servidor` para abrir el wizard en lugar de renderizar solo `Coming Soon`.
- [x] 3.2 Implementar input handling del wizard: `ENTER`, `↑↓`, `←→`, `TAB`, `ESC` step-back y `ESC` en Provider hacia `[Cancel Wizard]`.
- [x] 3.3 Definir salida posterior a confirmación: mostrar éxito y volver al menú global o seleccionar el servidor draft según diseño implementado.
- [x] 3.4 Mantener archived servers/global settings como `Coming Soon` y no alterar Server Dashboard salvo navegación necesaria.

## 4. Tests y verificación

- [x] 4.1 Agregar tests de store/handlers para avance, retroceso, cancelación y validaciones del wizard.
- [x] 4.2 Agregar tests renderizados para provider enabled/disabled, server name error, región/instancia y review.
- [x] 4.3 Agregar tests de creación local `draft` que verifiquen que no se ejecutan Pulumi, SSH, SFTP ni RCON.
- [x] 4.4 Ejecutar `bun test` y corregir fallos relacionados.
