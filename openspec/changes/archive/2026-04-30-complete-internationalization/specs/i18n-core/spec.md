# Delta for i18n-core

## ADDED Requirements

### Requirement: Extracción de strings de server dashboard panels
El sistema SHALL extraer todos los strings visibles de `dashboard-panels.tsx` a keys de `serverDashboard.*`.

#### Scenario: Panel de recursos traducido
- GIVEN el idioma activo es `es`
- WHEN se renderiza el panel de recursos
- THEN las etiquetas (`CPU`, `RAM`, `Disk`, `Network`) se obtienen de `t('serverDashboard.resources.*')`

#### Scenario: Panel de jugadores traducido
- GIVEN el idioma activo es `en`
- WHEN se renderiza el panel de jugadores
- THEN los headers y empty state se obtienen de `t('serverDashboard.players.*')`

### Requirement: Extracción de strings de create server wizard
El sistema SHALL extraer todos los strings visibles de `create-server-wizard-screen.tsx` a keys de `wizard.*`.

#### Scenario: Pasos del wizard traducidos
- GIVEN el wizard está activo
- WHEN el usuario navega entre pasos
- THEN los títulos, descripciones, labels y botones se obtienen de `t('wizard.*')`

#### Scenario: Mensajes de error del wizard traducidos
- GIVEN una validación falla en el wizard
- THEN el mensaje de error visible se obtiene de `t('wizard.errors.*')`

### Requirement: Extracción de strings de pending changes modal
El sistema SHALL extraer todos los strings visibles de `pending-changes-modal.tsx` a keys de `pendingChanges.*`.

#### Scenario: Modal de cambios pendientes traducido
- GIVEN hay cambios pendientes sin aplicar
- WHEN se abre el modal
- THEN el título, la lista de cambios y las acciones se obtienen de `t('pendingChanges.*')`

### Requirement: Extracción de strings de main menu y server list
El sistema SHALL extraer todos los strings visibles de `main-menu-view.tsx`, `main-menu-screen.tsx` y `server-list.tsx` a keys de `menu.*` y `serverList.*`.

#### Scenario: Lista de servidores traducida
- GIVEN el idioma activo es `es`
- WHEN se renderiza `server-list.tsx`
- THEN los headers de columna se obtienen de `t('serverList.columns.*')`

#### Scenario: Menú principal traducido
- GIVEN el menú principal está visible
- THEN los títulos de sección y mensajes de estado se obtienen de `t('menu.*')`

### Requirement: Extracción de strings de layout shell
El sistema SHALL extraer todos los strings visibles de `layout-shell.tsx` a keys de `layout.*`.

#### Scenario: Mensaje de terminal pequeña traducido
- GIVEN el terminal es demasiado pequeño
- WHEN se muestra el mensaje de advertencia
- THEN el texto se obtiene de `t('layout.terminalTooSmall')`

### Requirement: Localización de formatters
El sistema SHALL refactorizar `formatServerStatus()` y `formatRconExposure()` para recibir la función `t` como parámetro y retornar strings traducidos.

#### Scenario: Formatter de status traducido
- GIVEN `formatServerStatus` recibe `t` de `useTranslation()`
- WHEN se invoca con un status canónico
- THEN retorna la etiqueta traducida sin mutar el valor canónico subyacente

#### Scenario: Formatter fuera del React tree
- GIVEN una función pura fuera del React tree necesita traducir
- THEN recibe `t` como argumento en vez de usar `useTranslation()` directamente

### Requirement: Localización de catálogo y store
El sistema SHALL proveer keys de i18n para labels de catálogo y mensajes de status del app store.

#### Scenario: Labels de catálogo traducidas
- GIVEN se renderiza una opción del catálogo
- THEN su label visible se obtiene de `t('catalog.*')`

#### Scenario: Status messages del store traducidos
- GIVEN el app store actualiza un mensaje de status visible
- THEN usa `i18next.t()` directamente para obtener el string traducido

### Requirement: Paridad y completitud de locales
El sistema SHALL garantizar que `en.json` y `es.json` contengan exactamente el mismo set de keys para todos los dominios nuevos.

#### Scenario: Key parity
- GIVEN ambos archivos de locale
- WHEN se comparan las keys recursivamente
- THEN no existen keys presentes en uno y ausentes en el otro

### Requirement: Tests con idioma fijado
El sistema SHALL fijar el idioma a `en` en el setup de tests que asertan strings exactos, o cubrir ambos idiomas donde corresponda.

#### Scenario: Tests estables en inglés
- GIVEN un test que verifica texto renderizado
- WHEN se ejecuta
- THEN `i18next.changeLanguage('en')` se invoca antes del render

#### Scenario: Tests de cambio de idioma
- GIVEN un test de cambio de idioma
- WHEN se cambia a `es`
- THEN los componentes muestran las traducciones españolas correctas

## MODIFIED Requirements

### Requirement: Extracción de strings globales
El sistema SHALL extraer todos los strings visibles de los componentes globales a archivos de locale.
(Previously: cubría header, footer, system status, menú global, global settings y archived servers)

#### Scenario: Header traducido
- WHEN el header se renderiza
- THEN el texto de marca se obtiene de `t('header.title')` y responde al idioma activo

#### Scenario: Footer traducido
- WHEN el footer se renderiza
- THEN las etiquetas de atajos se obtienen de `t('footer.*')`

#### Scenario: System Status traducido
- WHEN el system status se renderiza
- THEN las etiquetas se obtienen de `t('systemStatus.*')`

#### Scenario: Menú global traducido
- WHEN el menú global se renderiza
- THEN las etiquetas de cada opción se obtienen de `t('menu.*')`

#### Scenario: Global Settings traducido
- WHEN el panel de configuración global se renderiza
- THEN las etiquetas, botones y mensajes de error se obtienen de `t('settings.*')`

#### Scenario: Archived servers traducido
- GIVEN el idioma activo es `es` o `en`
- WHEN se renderiza cualquier sub-vista de `ArchivedServersPanel`
- THEN todos los strings visibles se obtienen de `t('archived.*')`

#### Scenario: Keys faltantes no rompen UI
- GIVEN una key de traducción no definida en el locale activo
- WHEN se renderiza el componente
- THEN i18next muestra la key como fallback y la UI permanece funcional
