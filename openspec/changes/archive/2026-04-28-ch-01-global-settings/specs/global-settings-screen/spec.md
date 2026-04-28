## ADDED Requirements

### Requirement: Panel de configuración global visible
El sistema SHALL renderizar un panel derecho interactivo con 3 opciones configurables cuando el menú global selecciona `Configuración Global`.

#### Scenario: Opciones listadas
- **WHEN** el usuario navega a `Configuración Global` en el menú izquierdo
- **THEN** el panel derecho muestra: `Language`, `Theme`, `Backup Path`, cada una con su valor actual

#### Scenario: Cursor vertical en el panel
- **WHEN** el foco está en el panel derecho de Global Settings
- **THEN** `↑` y `↓` navegan entre las 3 opciones y la opción seleccionada se resalta con fondo cian

### Requirement: Edición de idioma
El sistema SHALL permitir cambiar el idioma de la interfaz entre Español e Inglés mediante una sub-lista desplegada.

#### Scenario: Desplegar selector de idioma
- **WHEN** el foco está en `Language` y el usuario presiona `ENTER`
- **THEN** el panel derecho cambia a modo `language` mostrando una lista vertical con `Español (ES)` y `English (EN)`

#### Scenario: Seleccionar idioma
- **WHEN** el usuario navega a un idioma y presiona `ENTER`
- **THEN** el idioma seleccionado se guarda en SQLite, `settings-store` se actualiza, y toda la UI global se re-renderiza en el nuevo idioma sin reiniciar la TUI

#### Scenario: Cancelar selección de idioma
- **WHEN** el usuario está en el selector de idioma y presiona `ESC`
- **THEN** vuelve a la lista principal de settings sin cambiar el idioma

### Requirement: Edición de tema
El sistema SHALL permitir seleccionar el tema visual entre las opciones disponibles, aplicando cambios inmediatamente.

#### Scenario: Desplegar selector de tema
- **WHEN** el foco está en `Theme` y el usuario presiona `ENTER`
- **THEN** el panel derecho cambia a modo `theme` mostrando una lista con los temas disponibles (inicialmente solo `Default Dark`)

#### Scenario: Seleccionar tema
- **WHEN** el usuario selecciona un tema y presiona `ENTER`
- **THEN** el tema seleccionado se guarda en SQLite, `settings-store` se actualiza, y los colores de los componentes globales cambian inmediatamente

#### Scenario: Cancelar selección de tema
- **WHEN** el usuario está en el selector de tema y presiona `ESC`
- **THEN** vuelve a la lista principal de settings sin cambiar el tema

### Requirement: Edición de ruta de backups
El sistema SHALL permitir editar la ruta local de backups mediante un campo de texto inline.

#### Scenario: Entrar a edición de path
- **WHEN** el foco está en `Backup Path` y el usuario presiona `ENTER`
- **THEN** el panel derecho cambia a modo `backup-path` mostrando un input de texto editable con la ruta actual seleccionada

#### Scenario: Confirmar path válido
- **WHEN** el usuario edita la ruta, presiona `ENTER`, y el path tiene permisos de escritura
- **THEN** la nueva ruta se guarda en SQLite y `settings-store` se actualiza

#### Scenario: Path inválido
- **WHEN** el usuario confirma una ruta sin permisos de escritura o inexistente
- **THEN** se muestra un mensaje de error en rojo debajo del input y el valor no se guarda

#### Scenario: Cancelar edición de path
- **WHEN** el usuario está editando el path y presiona `ESC`
- **THEN** se descartan los cambios del campo y se vuelve a la lista principal de settings

### Requirement: Persistencia inmediata de settings
El sistema SHALL guardar cualquier cambio de configuración global en la tabla `settings` de SQLite inmediatamente al confirmar.

#### Scenario: Cambio de idioma persistido
- **WHEN** el usuario confirma un cambio de idioma
- **THEN** la clave `locale` en tabla `settings` tiene el nuevo valor

#### Scenario: Cambio de tema persistido
- **WHEN** el usuario confirma un cambio de tema
- **THEN** la clave `theme` en tabla `settings` tiene el nuevo valor

#### Scenario: Cambio de backup path persistido
- **WHEN** el usuario confirma un cambio de backup path
- **THEN** la clave `backup_path` en tabla `settings` tiene el nuevo valor
