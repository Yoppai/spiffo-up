# Delta for theme-core

## ADDED Requirements

### Requirement: Campo accent requerido

El sistema MUST incluir `colors.accent: string` en `ThemePalette` y exigirlo en todo JSON de paleta.

#### Scenario: Schema con accent

- GIVEN `default-dark.json` define `colors.accent`
- WHEN se valida
- THEN se acepta como paleta válida

#### Scenario: Componentes leen accent seguro

- GIVEN un tema activo válido
- WHEN cualquier componente lee `theme.colors.accent`
- THEN siempre es `string`, nunca `undefined`

### Requirement: Carga externa de temas en runtime

El sistema MUST cargar temas JSON desde `process.cwd()/themes` y `SPIFFO_THEME_DIR` al iniciar, sin recompilar.

#### Scenario: External theme cargado

- GIVEN un archivo válido `process.cwd()/themes/mytheme.json`
- WHEN `loadExternalThemes()` se llama al startup
- THEN `themeRegistry['mytheme']` contiene la paleta

#### Scenario: External theme override

- GIVEN un tema externo con id `default-dark` en `process.cwd()/themes/default-dark.json`
- WHEN `loadExternalThemes()` se llama
- THEN `themeRegistry['default-dark']` contiene el tema externo (override del bundled)

#### Scenario: Invalid external theme skip

- GIVEN un archivo JSON inválido en `process.cwd()/themes/`
- WHEN `loadExternalThemes()` se llama
- THEN se skippea sincrónicamente; no crashea

### Requirement: Background color en LayoutShell

El sistema MUST aplicar `backgroundColor={theme.colors.background}` al `<Box>` raíz en `LayoutShell`.

#### Scenario: Background theming

- GIVEN tema activo `ocean` (background: black)
- WHEN `LayoutShell` renderiza
- THEN el root `<Box>` tiene `backgroundColor="black"`

## MODIFIED Requirements

### Requirement: Campo border requerido

El sistema MUST incluir `border: string` en `ThemePalette` y exigir `colors.border` en todo JSON de paleta.
(Previously: border no era requerido.)

#### Scenario: Schema con border

- GIVEN `default-dark.json` define `colors.border`
- WHEN se valida
- THEN se acepta como paleta válida

#### Scenario: Componentes leen border seguro

- GIVEN un tema activo válido
- WHEN `archived-list-view` o `archived-detail-view` renderizan
- THEN `theme.colors.border` es siempre `string`, nunca `undefined`

### Requirement: Paleta de colores tipada (10 campos)

El sistema SHALL definir una paleta de colores tipada que incluya `border` y `accent` como campos requeridos.
(Previously: 9 campos, border no requerido, accent no existía.)

#### Scenario: Tema default-dark definido

- GIVEN `default-dark.json` con `colors.border` y `colors.accent`
- WHEN se importa `defaultDarkTheme`
- THEN contiene `primary`, `secondary`, `background`, `success`, `warning`, `error`, `focus`, `text`, `accent`, `border`

### Requirement: Store resuelve tema por ID

El sistema SHALL mantener `themeId`, resolver alias `dark` → `default-dark`, y usar `default-dark` como fallback no destructivo.
(Previously: resolución directa sin alias ni fallback no destructivo.)

#### Scenario: Theme ID guardado

- GIVEN el usuario confirma selección
- WHEN el tema activo es `default-dark`
- THEN el store guarda `themeId = 'default-dark'` en SQLite

#### Scenario: Resolución por ID conocido

- GIVEN `themeId = 'default-dark'`
- WHEN un componente llama `useTheme()`
- THEN recibe la paleta `default-dark`

## REMOVED Requirements

None.
