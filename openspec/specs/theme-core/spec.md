# Theme Core Specification

## Purpose

Define la paleta de colores tipada, la resolución de temas por ID, la carga externa en runtime y la integración visual en componentes globales del TUI. Actualizado para el sistema de paletas JSON dinámicas (10 campos: `accent` y `border` requeridos).

## Requirements

### Requirement: Paleta de colores tipada (10 campos)

El sistema SHALL definir una paleta de colores tipada en TypeScript que incluya `border` y `accent` como campos requeridos.
(Anteriormente: 9 campos, border no requerido, accent no existía.)

#### Scenario: Tema default-dark definido

- GIVEN `default-dark.json` con `colors.border` y `colors.accent`
- WHEN se importa `defaultDarkTheme`
- THEN contiene `primary`, `secondary`, `background`, `success`, `warning`, `error`, `focus`, `text`, `accent`, `border`

#### Scenario: Tipado estricto

- **WHEN** un desarrollador accede a `theme.colors.border` o `theme.colors.accent`
- **THEN** TypeScript infiere el tipo como `string` (nunca `undefined`)

### Requirement: Campo border requerido

El sistema MUST incluir `border: string` en `ThemePalette` y exigir `colors.border` en todo JSON de paleta.
(Anteriormente: border no era requerido.)

#### Scenario: Schema con border

- GIVEN `default-dark.json` define `colors.border`
- WHEN se valida
- THEN se acepta como paleta válida

#### Scenario: Componentes leen border seguro

- GIVEN un tema activo válido
- WHEN `archived-list-view` o `archived-detail-view` renderizan
- THEN `theme.colors.border` es siempre `string`, nunca `undefined`

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

### Requirement: Integración del tema en componentes globales

El sistema SHALL usar la paleta activa para colorear los componentes globales en lugar de strings hardcodeados.

#### Scenario: Header usa tema

- **WHEN** el header se renderiza
- **THEN** el gradiente y los colores del ASCII art usan `theme.colors.primary` y `theme.colors.secondary`

#### Scenario: Footer usa tema

- **WHEN** el footer se renderiza
- **THEN** los colores de los atajos usan `theme.colors.text` y resaltados usan `theme.colors.focus`

#### Scenario: System Status usa tema

- **WHEN** el system status se renderiza
- **THEN** los valores numéricos usan `theme.colors.accent` y los separadores usan `theme.colors.text`

#### Scenario: Panel enfocado usa tema

- **WHEN** un panel (izquierdo o derecho) tiene el foco
- **THEN** el borde o indicador de foco usa `theme.colors.focus`

### Requirement: Store resuelve tema por ID

El sistema SHALL mantener `themeId`, resolver alias `dark` → `default-dark`, y usar `default-dark` como fallback no destructivo.
(Anteriormente: resolución directa sin alias ni fallback no destructivo.)

#### Scenario: Theme ID guardado

- GIVEN el usuario confirma selección
- WHEN el tema activo es `default-dark`
- THEN el store guarda `themeId = 'default-dark'` en SQLite

#### Scenario: Resolución por ID conocido

- GIVEN `themeId = 'default-dark'`
- WHEN un componente llama `useTheme()`
- THEN recibe la paleta `default-dark`

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
