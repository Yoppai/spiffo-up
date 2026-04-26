## ADDED Requirements

### Requirement: Buffer global de pending changes
El sistema SHALL mantener un buffer global de pending changes para cambios encolados desde paneles del Server Dashboard, sin depender de dirty-state local por panel.

#### Scenario: Cambio encolado aparece en buffer global
- **WHEN** una pantalla encola un cambio con `Queue Changes` o acción equivalente
- **THEN** el cambio queda disponible en el pending changes store global con panel, campo, valores old/new, categoría e indicadores de impacto

#### Scenario: Navegación no usa dirty-state por panel
- **WHEN** el usuario navega fuera de un panel con edits locales que no fueron encolados
- **THEN** el sistema no muestra modal de unsaved changes por panel ni agrega esos edits al buffer global automáticamente

### Requirement: Categorías de pending changes
El sistema SHALL clasificar cambios pendientes en las categorías `env`, `ini-lua`, `build` e `infrastructure` para calcular orden de aplicación e impacto.

#### Scenario: Categoría determina impacto
- **WHEN** el buffer contiene cambios de varias categorías
- **THEN** el sistema calcula el impacto total usando las categorías y flags de restart o VM recreation

### Requirement: Indicadores visuales globales
El sistema SHALL mostrar indicadores visuales cuando el Server Dashboard tenga pending changes en el buffer global.

#### Scenario: Banner muestra conteo y atajo
- **WHEN** el Server Dashboard renderiza el panel derecho y existen pending changes
- **THEN** muestra un banner amarillo con el conteo y el texto `Press Ctrl+A to apply`

#### Scenario: Sub-menú muestra paneles con cambios
- **WHEN** existen pending changes asociados a un panel del Server Dashboard
- **THEN** el sub-menú izquierdo muestra un punto `•` junto al panel correspondiente

#### Scenario: Footer muestra acción de apply
- **WHEN** existen pending changes
- **THEN** el footer muestra `[Ctrl+A] Apply (N)` con el conteo actual

### Requirement: Atajo global Ctrl+A
El sistema SHALL abrir el modal `Apply Pending Changes` al presionar `Ctrl+A` desde cualquier panel del Server Dashboard cuando existan pending changes.

#### Scenario: Ctrl+A abre modal con cambios
- **WHEN** el usuario presiona `Ctrl+A` en Server Dashboard y el buffer contiene cambios
- **THEN** el sistema abre el modal `Apply Pending Changes` y bloquea la interacción con el layout subyacente

#### Scenario: Ctrl+A sin cambios no abre modal
- **WHEN** el usuario presiona `Ctrl+A` en Server Dashboard y el buffer está vacío
- **THEN** el sistema conserva la navegación actual sin mostrar el modal

### Requirement: Modal Apply Pending Changes
El sistema SHALL mostrar un modal centrado que agrupa pending changes por panel, presenta old/new values y resume el impacto total.

#### Scenario: Resumen agrupado por panel
- **WHEN** el modal se abre con cambios de múltiples paneles
- **THEN** los cambios aparecen agrupados por panel con label, old value y new value cuando corresponda

#### Scenario: Valores sensibles se enmascaran
- **WHEN** un pending change representa un password o secreto
- **THEN** el modal muestra `[changed]` en lugar del valor real

#### Scenario: Modal muestra acciones disponibles
- **WHEN** el modal está abierto
- **THEN** muestra las acciones `Apply All`, `Discard All` y `Back to Edit` con navegación horizontal

### Requirement: Acciones del modal
El sistema SHALL permitir aplicar, descartar o volver a edición desde el modal de pending changes.

#### Scenario: Apply All ejecuta pipeline local
- **WHEN** el usuario confirma `Apply All`
- **THEN** el sistema ejecuta el pipeline local en orden `infrastructure`, `build`, `env`, `ini-lua`, muestra resultado y limpia store y SQLite si termina exitosamente

#### Scenario: Discard All limpia buffer
- **WHEN** el usuario confirma `Discard All`
- **THEN** el sistema elimina todos los pending changes del store y SQLite y cierra el modal

#### Scenario: Back to Edit conserva buffer
- **WHEN** el usuario selecciona `Back to Edit` o presiona `ESC` dentro del modal
- **THEN** el sistema cierra el modal y conserva todos los pending changes

### Requirement: Persistencia cifrada de secrets sensibles
El sistema SHALL cifrar valores sensibles de pending changes antes de persistirlos en SQLite usando una clave derivada con `scrypt` desde una passphrase de sesión y cifrado autenticado `AES-256-GCM`.

#### Scenario: Guardar cambio sensible cifrado
- **WHEN** un pending change representa password o secreto
- **THEN** SQLite no guarda old/new values en plaintext
- **AND** guarda ciphertext, salt, nonce, auth tag y metadata de versión suficientes para descifrar durante `Apply All`

#### Scenario: Hidratar cambio sensible enmascarado
- **WHEN** la aplicación arranca con pending changes sensibles persistidos
- **THEN** el store global recibe metadata y display value `[changed]`
- **AND** no recibe plaintext del secreto

#### Scenario: Apply All requiere desbloqueo para secrets
- **WHEN** el usuario aplica cambios pendientes que incluyen secrets cifrados y la sesión no está desbloqueada
- **THEN** el sistema solicita la passphrase de sesión antes de descifrar y aplicar esos cambios

#### Scenario: Passphrase inválida no aplica secrets
- **WHEN** el usuario ingresa una passphrase inválida para cambios sensibles cifrados
- **THEN** el sistema no aplica esos cambios y ofrece volver a editar o descartar el buffer

#### Scenario: Bcrypt no se usa para secrets recuperables
- **WHEN** el sistema necesita recuperar un secret para `Apply All`
- **THEN** no usa `bcrypt` porque bcrypt solo permite hash/verify y no descifrado reversible

### Requirement: Salida del Server Dashboard con buffer pendiente
El sistema SHALL interceptar la salida del Server Dashboard cuando existan pending changes en el buffer global.

#### Scenario: ESC con buffer abre opciones globales
- **WHEN** el usuario presiona `ESC` desde el Server Dashboard y existen pending changes
- **THEN** el sistema ofrece aplicar, descartar o seguir editando sin salir inmediatamente al menú global

#### Scenario: ESC sin buffer sale normalmente
- **WHEN** el usuario presiona `ESC` desde el Server Dashboard y el buffer está vacío
- **THEN** el sistema vuelve al menú global de servidores activos

### Requirement: Pipeline sin side effects remotos
El sistema SHALL limitar la aplicación de pending changes de este cambio a planificación y persistencia local, sin ejecutar operaciones remotas reales.

#### Scenario: Apply All no ejecuta infraestructura remota
- **WHEN** el usuario aplica cambios de infraestructura, build, env o INI/LUA
- **THEN** el sistema no ejecuta Pulumi, SSH, SFTP, Docker ni RCON reales durante este cambio
