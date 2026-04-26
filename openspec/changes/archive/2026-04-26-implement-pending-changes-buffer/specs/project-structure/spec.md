## MODIFIED Requirements

### Requirement: Stores globales granulares
El sistema SHALL definir stores Zustand granulares para dominios globales distintos, incluyendo servidores, cambios pendientes, settings y estado global de app. El buffer de pending changes SHALL ser global y no SHALL reintroducir dirty-state por panel.

#### Scenario: Store de servidores aislado
- **WHEN** se actualiza la lista o selección de servidores
- **THEN** el cambio pertenece al módulo de servers store y no requiere modificar settings ni pending changes

#### Scenario: Buffer global de cambios separado
- **WHEN** una pantalla agrega cambios pendientes para aplicar luego con `Ctrl+A`
- **THEN** esos cambios pertenecen al pending changes store y no a dirty state local por panel

#### Scenario: Modal global separado de datos del buffer
- **WHEN** se abre o cierra el modal de pending changes
- **THEN** el estado de visibilidad y selección del modal pertenece al estado global de app, mientras los cambios pendientes permanecen en el pending changes store
