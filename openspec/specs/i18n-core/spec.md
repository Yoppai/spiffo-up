# i18n Core Specification

## Purpose

Define la inicialización de i18next, la extracción de strings globales a archivos de locale y el cambio de idioma en runtime sin reiniciar la TUI.

## Requirements

### Requirement: Inicialización de i18n
El sistema SHALL inicializar `i18next` con `react-i18next` antes del primer render de la app, usando los recursos de `src/locales/`.

#### Scenario: App arranca con idioma por defecto
- **WHEN** la app se inicia sin settings previos en SQLite
- **THEN** `i18next` usa `es` como fallback y los componentes globales se renderizan en español

#### Scenario: App arranca con idioma persistido
- **WHEN** la app se inicia y SQLite tiene `locale = 'en'`
- **THEN** `i18next` inicializa en inglés antes del primer render

### Requirement: Extracción de strings globales
El sistema SHALL extraer todos los strings visibles de los componentes globales a archivos de locale.

#### Scenario: Header traducido
- **WHEN** el header se renderiza
- **THEN** el texto de marca se obtiene de `t('header.title')` y responde al idioma activo

#### Scenario: Footer traducido
- **WHEN** el footer se renderiza
- **THEN** las etiquetas de atajos (`[ESC] Back`, `[↑↓] Navegar`, etc.) se obtienen de `t('footer.*')`

#### Scenario: System Status traducido
- **WHEN** el system status se renderiza
- **THEN** las etiquetas (`Active Servers`, `Total Servers`) se obtienen de `t('systemStatus.*')`

#### Scenario: Menú global traducido
- **WHEN** el menú global se renderiza
- **THEN** las etiquetas de cada opción (`1. Crear Nuevo Servidor`, `2. Servidores Activos`, etc.) se obtienen de `t('menu.*')`

#### Scenario: Global Settings traducido
- **WHEN** el panel de configuración global se renderiza
- **THEN** las etiquetas (`Language`, `Theme`, `Backup Path`, botones, mensajes de error) se obtienen de `t('settings.*')`

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

### Requirement: Cambio de idioma sin reinicio
El sistema SHALL re-renderizar la UI global inmediatamente al cambiar el idioma, sin cerrar ni reiniciar la TUI.

#### Scenario: Cambio en runtime
- **WHEN** el usuario cambia el idioma desde Global Settings
- **THEN** `i18next.changeLanguage()` se ejecuta y todos los componentes que usan `useTranslation` se actualizan visualmente
