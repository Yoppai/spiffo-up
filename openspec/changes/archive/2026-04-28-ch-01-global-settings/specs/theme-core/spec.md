## ADDED Requirements

### Requirement: Paleta de colores tipada
El sistema SHALL definir una paleta de colores tipada en TypeScript para el tema por defecto.

#### Scenario: Tema default-dark definido
- **WHEN` se importa `defaultDarkTheme` desde `src/themes/default-dark.ts`
- **THEN** el objeto contiene al menos: `primary`, `secondary`, `background`, `success`, `warning`, `error`, `focus`, `text`

#### Scenario: Tipado estricto
- **WHEN** un desarrollador accede a `theme.colors.primary`
- **THEN** TypeScript infiere el tipo como string de color válido para Ink (ej. `cyan`, `green`, `red`)

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
El sistema SHALL mantener el `themeId` en el store y resolver la paleta completa cuando un componente la necesita.

#### Scenario: Theme ID guardado
- **WHEN** el usuario selecciona `Default Dark`
- **THEN** el store guarda `themeId = 'default-dark'` en SQLite

#### Scenario: Resolución de paleta
- **WHEN** un componente llama a `useTheme()`
- **THEN** recibe el objeto de paleta completo correspondiente al `themeId` activo
