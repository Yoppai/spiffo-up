## ADDED Requirements

### Requirement: Layout fullscreen reutilizable
El sistema SHALL renderizar un shell TUI fullscreen reutilizable con cinco zonas visibles: header, system status, panel izquierdo, panel derecho y footer.

#### Scenario: Shell principal visible
- **WHEN** la app arranca en modo TUI
- **THEN** el usuario ve el header de marca, el panel de estado, dos paneles de contenido y la barra inferior de atajos

#### Scenario: Paneles con proporción PRD
- **WHEN** la terminal tiene tamaño suficiente para el dashboard
- **THEN** el panel izquierdo usa aproximadamente 35% del ancho disponible y el panel derecho usa el 65% restante

#### Scenario: Terminal crítica
- **WHEN** la terminal es demasiado pequeña para renderizar el dashboard usable
- **THEN** el sistema muestra un mensaje solicitando agrandar la terminal en lugar de romper el layout

### Requirement: Header y paneles con estilo PRD
El sistema SHALL usar las dependencias visuales previstas por el PRD para mostrar marca y contenedores titulados.

#### Scenario: Header con marca visual
- **WHEN** el shell renderiza el header
- **THEN** el título `SPIFFO-UP` aparece como ASCII art con gradiente visual

#### Scenario: Paneles titulados
- **WHEN** el shell renderiza system status, menú o contenido
- **THEN** cada sección usa un contenedor titulado con borde redondeado o fallback compatible si la librería no soporta una opción exacta

### Requirement: Menú global navegable
El sistema SHALL iniciar en Nivel 0 con foco en el panel izquierdo y un menú global navegable por teclado.

#### Scenario: Foco inicial
- **WHEN** la app carga el dashboard global
- **THEN** el foco está en el panel izquierdo y el menú global muestra la opción seleccionada

#### Scenario: Navegación vertical del menú
- **WHEN** el foco está en el panel izquierdo y el usuario presiona `↑` o `↓`
- **THEN** la selección del menú global cambia y el panel derecho actualiza su título y contenido de preview

#### Scenario: TAB exclusivo entre paneles
- **WHEN** el usuario presiona `TAB`
- **THEN** el foco alterna entre panel izquierdo y panel derecho sin moverse entre elementos internos del panel

### Requirement: Preview de servidores activos
El sistema SHALL mostrar una tabla de servidores activos basada en datos seed/mock hasta que exista persistencia real.

#### Scenario: Tabla visible en Servidores Activos
- **WHEN** la opción `Servidores Activos` está seleccionada
- **THEN** el panel derecho muestra columnas para nombre, instance type, status, players y acción disponible

#### Scenario: Navegación de filas
- **WHEN** el foco está en el panel derecho con la preview de servidores activos y el usuario presiona `↑` o `↓`
- **THEN** el cursor de fila cambia entre servidores visibles

### Requirement: Entrada y salida del Server Dashboard
El sistema SHALL permitir entrar al Server Dashboard desde un servidor activo y volver al menú global.

#### Scenario: Entrar a Server Dashboard
- **WHEN** el foco está en el panel derecho, la preview de servidores activos tiene una fila seleccionada y el usuario presiona `ENTER`
- **THEN** el sistema cambia a Nivel 1, selecciona ese servidor, enfoca el panel izquierdo y muestra el sub-menú del servidor con `Server Management` activo

#### Scenario: Volver al menú global
- **WHEN** el usuario está en el Server Dashboard y presiona `ESC`
- **THEN** el sistema vuelve al Nivel 0 con `Servidores Activos` seleccionado y la tabla de servidores en el panel derecho

### Requirement: Server Dashboard básico
El sistema SHALL renderizar el Server Dashboard con sub-menú izquierdo y contenido básico de `Server Management` sin ejecutar acciones reales.

#### Scenario: Sub-menú del servidor
- **WHEN** el sistema está en Nivel 1
- **THEN** el panel izquierdo muestra el nombre del servidor seleccionado y opciones como `Server Management`, `Provider & Region`, `Build`, `Players`, `Stats`, `Basic Settings`, `Advanced`, `Admins`, `Scheduler`, `Backups` y `Back to Servers`

#### Scenario: Preview de Server Management
- **WHEN** `Server Management` está seleccionado
- **THEN** el panel derecho muestra status, IP, branch, players y botones visuales de acciones rápidas sin ejecutar deploy, stop, update ni archive

### Requirement: Atajos globales base
El sistema SHALL soportar atajos de teclado base para navegación y salida.

#### Scenario: Q sale del programa
- **WHEN** el usuario presiona `Q` o `q`
- **THEN** la app solicita salir del proceso Ink mediante el mecanismo de salida disponible

#### Scenario: Footer documenta atajos
- **WHEN** el shell se renderiza
- **THEN** el footer muestra al menos `[ESC] Back`, `[↑↓] Navegar`, `[TAB] Cambiar Panel`, `[ENTER] Seleccionar`, `[F1] Help` y `[Q] Salir`
