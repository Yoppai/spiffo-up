## MODIFIED Requirements

### Requirement: Persistencia de pending changes
El sistema SHALL persistir el buffer global de pending changes por servidor con panel, field, old/new values no sensibles, payload cifrado para valores sensibles, categoría de cambio e indicadores de impacto, y SHALL permitir limpiarlo cuando el usuario aplica o descarta todos los cambios.

#### Scenario: Agregar pending change
- **WHEN** una pantalla encola un cambio pendiente para un servidor
- **THEN** el sistema lo persiste en `pending_changes` y lo hidrata en el store global

#### Scenario: Limpiar pending changes
- **WHEN** el usuario aplica o descarta todos los cambios pendientes
- **THEN** el sistema elimina esos registros de SQLite y el store queda vacío

#### Scenario: Rehidratar cambios conserva indicadores
- **WHEN** la aplicación arranca con pending changes persistidos
- **THEN** el store hidratado conserva suficiente información para renderizar panel, field, old/new values, categoría e impacto

#### Scenario: Persistir cambio sensible sin plaintext
- **WHEN** se persiste un pending change sensible
- **THEN** SQLite conserva metadata cifrada y no conserva el valor real del secret en columnas plaintext
