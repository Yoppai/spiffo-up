## 1. Tipos, persistencia y helpers

- [x] 1.1 Extender `PendingChange` con categoría `env | ini-lua | build | infrastructure`, sensibilidad opcional y defaults backwards-compatible.
- [x] 1.2 Actualizar schema/mappers de `pending_changes` para conservar categoría, sensibilidad, metadata cifrada e indicadores sin romper registros existentes.
- [x] 1.3 Agregar helpers de cifrado con `node:crypto`: `scrypt` para derivar key de passphrase y `AES-256-GCM` para encrypt/decrypt de secrets.
- [x] 1.4 Agregar helpers puros para agrupar cambios por panel, contar cambios por panel y enmascarar valores sensibles.
- [x] 1.5 Agregar helpers puros para calcular impact summary y ordenar pipeline `infrastructure` → `build` → `env` → `ini-lua`.

## 2. Stores y servicio local

- [x] 2.1 Ampliar `usePendingChangesStore` con acciones/selectores para add/set/clear, grouped changes, panel indicators y discard all.
- [x] 2.2 Ampliar `useAppStore` con estado de modal único para pending changes y selección de acción del modal.
- [x] 2.3 Agregar estado de desbloqueo de passphrase de sesión sin persistir la passphrase ni secrets plaintext.
- [x] 2.4 Crear servicio local de apply/discard que planifica pasos, descifra secrets solo en el boundary de apply, simula aplicación sin side effects remotos y limpia SQLite/store tras éxito.
- [x] 2.5 Asegurar que `clearPendingChanges` de SQLite y store se ejecutan coherentemente en apply/discard.

## 3. UI del buffer global

- [x] 3.1 Actualizar footer para mostrar `[Ctrl+A] Apply (N)` cuando haya pending changes.
- [x] 3.2 Agregar banner amarillo en el panel derecho del Server Dashboard con conteo y atajo `Ctrl+A`.
- [x] 3.3 Mostrar punto `•` en los ítems del sub-menú del servidor que tengan cambios pendientes.
- [x] 3.4 Agregar botón visual `Apply All Changes (N)` en Server Management cuando el buffer no esté vacío.

## 4. Modal e input routing

- [x] 4.1 Crear componente `Apply Pending Changes` con grupos por panel, old/new values, masking e impact summary.
- [x] 4.2 Implementar navegación del modal con `←`/`→`, `ENTER` y `ESC`, bloqueando interacción con el layout subyacente.
- [x] 4.3 Conectar `Ctrl+A` en Server Dashboard para abrir el modal solo cuando existan pending changes.
- [x] 4.4 Interceptar `ESC` y `Back to Servers` cuando haya buffer pendiente para ofrecer aplicar, descartar o seguir editando.
- [x] 4.5 Agregar prompt/desbloqueo de passphrase cuando `Apply All` incluya secrets cifrados y la sesión no esté desbloqueada.

## 5. Tests y validación

- [x] 5.1 Agregar tests de crypto helpers para encrypt/decrypt correcto, passphrase inválida y ausencia de plaintext en payload persistible.
- [x] 5.2 Agregar tests de helpers de grouping, masking, impact summary y pipeline order.
- [x] 5.3 Agregar tests de stores para modal state, panel indicators, apply/discard, passphrase unlock y reset.
- [x] 5.4 Agregar tests de servicio local para limpiar persistencia en apply/discard, descifrar solo en apply y no ejecutar side effects remotos.
- [x] 5.5 Agregar tests de render/input para footer, banner, dots, `Ctrl+A`, modal actions, prompt de passphrase y `ESC` con buffer.
- [x] 5.6 Ejecutar `bun test` y corregir fallos.
