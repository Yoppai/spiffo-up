# theme-loader Specification

## Purpose

Descubrimiento y carga sincrónica de paletas JSON desde `src/themes/` y carga externa en runtime desde directorios configurables.

## Requirements

### Requirement: Descubrimiento de archivos (bundled)

El sistema MUST leer todos los `*.json` en `src/themes/` al iniciar la aplicación.

#### Scenario: Carga exitosa

- GIVEN archivos `default-dark.json`, `ocean.json` y `forest.json` en `src/themes/`
- WHEN inicia la app
- THEN el registro contiene 3 entradas tipadas

#### Scenario: Directorio vacío

- GIVEN `src/themes/` vacío
- WHEN inicia la app
- THEN el registro está vacío y el fallback usa `default-dark`

### Requirement: Validación de schema (10 campos)

El sistema MUST validar que cada paleta defina `name` y `colors` con `primary`, `secondary`, `background`, `success`, `warning`, `error`, `focus`, `text`, `accent`, `border`.

#### Scenario: JSON válido con 10 campos

- GIVEN un JSON con todos los 10 campos requeridos incluyendo `accent` y `border`
- WHEN se carga
- THEN se incluye en el registro

#### Scenario: JSON sin border

- GIVEN un JSON que omite `colors.border`
- WHEN se carga
- THEN se rechaza o excluye del registro

#### Scenario: JSON sin accent

- GIVEN un JSON que omite `colors.accent`
- WHEN se carga
- THEN se rechaza o excluye del registro

### Requirement: Exposición tipada

El sistema MUST exponer `Record<string, ThemePalette>`.

#### Scenario: Consumo tipado

- GIVEN un consumidor importa el registro
- WHEN accede a `registry['default-dark'].colors.border`
- THEN TypeScript infiere `string`

### Requirement: Carga externa en runtime

El sistema MUST cargar temas JSON desde `process.cwd()/themes` y `SPIFFO_THEME_DIR` al iniciar la aplicación, permitiendo override de temas bundled.

#### Scenario: External theme discovery

- GIVEN `process.cwd()/themes/my-theme.json` existe y es válido
- WHEN `loadExternalThemes()` se llama
- THEN `themeRegistry['my-theme']` contiene la paleta

#### Scenario: External theme override bundled

- GIVEN `process.cwd()/themes/default-dark.json` existe y es válido
- WHEN `loadExternalThemes()` se llama
- THEN `themeRegistry['default-dark']` se actualiza con el tema externo

#### Scenario: SPIFFO_THEME_DIR env var

- GIVEN `SPIFFO_THEME_DIR=/path/to/themes` y `/path/to/themes/custom.json` existe
- WHEN `loadExternalThemes()` se llama
- THEN `themeRegistry['custom']` contiene la paleta

#### Scenario: Invalid external JSON skip

- GIVEN `process.cwd()/themes/invalid.json` existe pero no es JSON válido
- WHEN `loadExternalThemes()` se llama
- THEN no crashea; el archivo se skippea

#### Scenario: Non-existent external dir skip

- GIVEN ni `process.cwd()/themes` ni `SPIFFO_THEME_DIR` existen
- WHEN `loadExternalThemes()` se llama
- THEN no crashea; retorna silenciosamente
