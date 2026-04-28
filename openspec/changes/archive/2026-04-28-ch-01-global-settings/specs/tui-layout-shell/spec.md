## ADDED Requirements

### Requirement: Panel derecho condicional por menú global
El sistema SHALL renderizar contenido específico en el panel derecho según la opción seleccionada del menú global, no solo "Active Servers" o "Coming Soon".

#### Scenario: Configuración Global renderiza panel interactivo
- **WHEN** `Configuración Global` está seleccionada en el menú izquierdo
- **THEN** el panel derecho renderiza `GlobalSettingsPanel` con navegación vertical interactiva en lugar de "Coming Soon"

#### Scenario: Servidores Archivados renderiza lista (stub)
- **WHEN** `Servidores Archivados` está seleccionada en el menú izquierdo
- **THEN** el panel derecho renderiza `ArchivedServersPanel` (puede ser stub inicialmente, pero el hook de rendering existe)

#### Scenario: Foco en panel derecho global
- **WHEN** el foco está en el panel derecho y el menú global no es `Servidores Activos` ni `Crear Nuevo Servidor`
- **THEN** `↑` y `↓` navegan por los elementos del panel derecho correspondiente (settings options, archived servers rows, etc.)

#### Scenario: ESC desde panel derecho global
- **WHEN** el usuario está en un sub-modo del panel derecho global (ej. selector de idioma) y presiona `ESC`
- **THEN** el panel derecho vuelve al modo lista principal de esa opción de menú
