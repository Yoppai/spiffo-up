# theme-selector-preview Specification

## Purpose

Selector dinámico de tema con preview inmediato y conteo dinámico de temas.

## Requirements

### Requirement: Listado dinámico

El sistema MUST listar una opción por cada paleta del registro dinámico.

#### Scenario: Renderizado con 2 temas

- GIVEN registro con 2 temas (`default-dark`, `ocean`)
- WHEN se renderiza `ThemeSelector`
- THEN muestra 2 items con `name` de cada paleta

#### Scenario: Renderizado con 3 temas

- GIVEN registro con 3 temas (`default-dark`, `ocean`, `forest`)
- WHEN se renderiza `ThemeSelector`
- THEN muestra 3 items con `name` de cada paleta

#### Scenario: Renderizado con themes externos

- GIVEN registro con 2 bundled + 1 externo cargado
- WHEN se renderiza `ThemeSelector`
- THEN muestra 3 items

### Requirement: Preview inmediato

El sistema MUST aplicar el tema seleccionado al navegar con cursor sin reiniciar el TUI.

#### Scenario: Navegación con flechas

- GIVEN el selector enfocado y tema activo `default-dark`
- WHEN el usuario presiona ↓ sobre `ocean`
- THEN el header, footer y paneles reflejan `ocean` inmediatamente

#### Scenario: Navegación con 3 temas

- GIVEN el selector con 3 temas y cursor en posición 0
- WHEN el usuario presiona ↓ dos veces
- THEN el tema en posición 2 se aplica

### Requirement: Persistencia lossless

El sistema MUST guardar el `themeId` exacto en SQLite.

#### Scenario: Guardado de ID

- GIVEN el usuario confirma la selección de `ocean`
- THEN la DB almacena `theme = 'ocean'`

#### Scenario: Guardado de ID de tema externo

- GIVEN el usuario selecciona un tema externo `my-custom-theme`
- THEN la DB almacena `theme = 'my-custom-theme'`
