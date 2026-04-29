# Archived Servers Screen Specification

## Purpose

Definir la pantalla de servidores archivados con tabla de lista, vista de detalle, empty state, navegacion por teclado y confirmacion inline destructiva.

## Requirements

### Requirement: Tabla de lista de archivados
El sistema SHALL renderizar una tabla en el panel derecho con servidores `status='archived'`, mostrando columnas NAME, PROVIDER, ARCHIVED ON, BACKUP SIZE, STATUS y ACTIONS.

#### Scenario: Renderizar lista
- **GIVEN** servidores archivados en `servers-store`
- **WHEN** el usuario selecciona `Servidores Archivados` y el foco esta en el panel derecho
- **THEN** la tabla muestra las filas con columnas definidas y navegacion con `↑` / `↓`

#### Scenario: Estado del backup en tabla
- **GIVEN** un servidor con `backupPath` definido
- **WHEN** se renderiza su fila
- **THEN** `STATUS` muestra `SAVED`; si `backupPath` es null, muestra `MISSING`

### Requirement: Vista de detalle
El sistema SHALL mostrar metadatos del servidor, seccion de backup y acciones Restore Server / Delete Record al presionar `ENTER` en una fila.

#### Scenario: Abrir detalle
- **GIVEN** foco en una fila de la lista
- **WHEN** el usuario presiona `ENTER`
- **THEN** el panel derecho muestra Provider, Project ID, Instance Type, Zone, Static IP, Game Branch, Created, Archived, Backup Path, Backup Size y Backup Status

#### Scenario: Detalle sin backup
- **GIVEN** un servidor sin `backupPath` ni `backupSize`
- **WHEN** se abre su detalle
- **THEN** la seccion de backup indica que no hay informacion disponible

### Requirement: Empty state
El sistema SHALL mostrar un mensaje amigable cuando no hay servidores archivados.

#### Scenario: Sin archivados
- **GIVEN** cero servidores con `status='archived'`
- **WHEN** el usuario selecciona `Servidores Archivados`
- **THEN** el panel derecho muestra `No archived servers found` con una breve explicacion

### Requirement: Navegacion por teclado
El sistema SHALL soportar navegacion coherente con el patron `globalRightMode` / `globalRightCursor`.

#### Scenario: Lista a detalle y regreso
- **GIVEN** el panel derecho en modo lista (`archived-list`)
- **WHEN** el usuario presiona `↑` / `↓`, `ENTER`, `ESC` o `TAB`
- **THEN** navega filas, abre detalle (`archived-detail`), vuelve a lista, o cambia de panel respectivamente

#### Scenario: ESC desde lista
- **GIVEN** el panel derecho en modo lista y foco en panel derecho
- **WHEN** el usuario presiona `ESC`
- **THEN** el foco vuelve al panel izquierdo (menu global)

### Requirement: Confirmacion inline para Delete
El sistema SHALL usar el patron `confirmableAction` antes de ejecutar Delete Record.

#### Scenario: Confirmar eliminacion
- **GIVEN** foco en `Delete Record` en detalle
- **WHEN** el usuario presiona `ENTER`
- **THEN** aparece confirmacion inline con `[Cancelar]` (default) y `[Eliminar]`

#### Scenario: Ejecutar stub
- **GIVEN** confirmacion inline visible
- **WHEN** el usuario selecciona `[Eliminar]`
- **THEN** se ejecuta accion stub, se cierra la confirmacion y se vuelve a la lista
