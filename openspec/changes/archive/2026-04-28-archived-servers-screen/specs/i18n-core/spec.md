# Delta for i18n Core

## ADDED Requirements

### Requirement: Traducciones de archived servers
El sistema SHALL proveer keys de i18next para titulos, columnas de tabla, acciones, empty state y confirmaciones de la pantalla de servidores archivados.

#### Scenario: Strings traducidos
- **GIVEN** el idioma activo es `es` o `en`
- **WHEN** se renderiza cualquier sub-vista de `ArchivedServersPanel`
- **THEN** todos los strings visibles se obtienen de `t('archived.*')`

#### Scenario: Keys faltantes no rompen UI
- **GIVEN** una key de traduccion no definida en el locale activo
- **WHEN** se renderiza el componente
- **THEN** i18next muestra la key como fallback y la UI permanece funcional
