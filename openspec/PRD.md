# Product Requirements Document (PRD) & Technical Architecture
## Zomboid-CLI Multi-Cloud Orchestrator MVP

### 1. Executive Summary
**Problem Statement:** Desplegar y gestionar múltiples servidores dedicados de Project Zomboid en la nube es complejo, propenso a errores y requiere manejar diferentes plataformas (GCP, AWS, Azure), Linux, redes, Pulumi y copias de seguridad.
**Proposed Solution:** Una herramienta CLI interactiva (TUI) construida en Bun y React Ink que actúa como un Panel de Control Multi-Cloud local. Permite administrar un inventario de servidores, automatiza el provisionamiento vía Pulumi, gestiona el ciclo de vida de los contenedores y sincroniza configuraciones avanzadas.
**Alcance del MVP:** Se sentarán las bases visuales y de datos para un entorno Multi-Cloud, pero **la única infraestructura funcional será GCP**. AWS y Azure se mostrarán en la UI como "Coming Soon". El MVP asume 1 servidor por Máquina Virtual, pero la arquitectura de red sentará las bases para múltiples servidores por VM en el futuro.
**Success Criteria:**
- Interfaz fluida con Menú Global para gestionar múltiples servidores simultáneamente.
- Despliegue en GCP con guía interactiva para autenticación y selección de proyecto.
- Medición de latencia HTTP para recomendar la mejor región.
- Selección inteligente de hardware (Tiers curados) y catálogo dinámico.
- Inyección remota de configuraciones locales vía explorador de archivos multiplataforma (SFTP).
- Base de datos local robusta (SQLite) para mantener el inventario.
- Internacionalización bilingüe (ES/EN).

---

### 2. UI / UX & Navigation Structure
La TUI (Terminal User Interface) se estructurará en dos niveles de profundidad: Un Menú Global y un Dashboard por Servidor. La CLI arranca directamente en modo TUI fullscreen (React Ink), sin subcomandos previos de Commander.

#### 2.1 Global Main Menu / Dashboard Layout (Nivel 0)

La interfaz principal del dashboard es un **layout reutilizable y responsive** compuesto por un contenedor principal (`<Box>`) que ocupa el ancho y alto máximo de la terminal con un color de fondo definido por el tema. El layout debe adaptarse dinámicamente al tamaño de la terminal, recalculando dimensiones y ajustando contenido (truncamiento, scroll, o reacomodo) cuando el usuario redimensione la ventana. Este layout se reutiliza en diferentes vistas; lo que varía son los títulos de los paneles izquierdo y derecho, así como su contenido dinámico.

**Distribución de Ancho:**
*   **Panel Izquierdo (Menú):** Ocupa exactamente el **35%** del ancho total disponible.
*   **Panel Derecho (Contenido):** Ocupa el **65%** restante del ancho total.
*   **Responsividad:** Si la terminal es demasiado estrecha (ej. < 80 columnas), el layout debe mantener la proporción 35/65 pero activar truncamiento inteligente de texto y scroll horizontal si es necesario. En tamaños críticamente pequeños, mostrar un mensaje de advertencia pidiendo al usuario agrandar la terminal.

##### Estructura Visual del Layout Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         [ZOMBOID-CLI ASCII ART]                             │
│                    (ink-big-text + ink-gradient)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  System Status  ┌───────────────────────────────────────────────────────┐   │
│                 │ v1.2.3 | Active Servers: 3 | Total Servers: 5 | Uptime: 45m │
│                 └───────────────────────────────────────────────────────┘   │
├─────────────────┬───────────────────────────────────────────────────────────┤
│  Menu           │  Active Servers Preview                                   │
│  ─────────────  │  ───────────────────────                                  │
│  [+] 1. Crear   │  NAME   │ INSTANCE TYPE │ STATUS     │ PLAYERS │ ACCIONES    │
│      Nuevo      │  ─────────────────────────────────────────────────────────│
│      Servidor   │  main   │ e2-std-2  │ 🟢 RUNNING │ 12/20   │ stop        │
│  >[▶] 2.        │  PvP    │ n2-std-4  │ ⚠️ INICIANDO│ -/-    │ stop        │
│  Servidores     │  dev    │ e2-std-2  │ ❌ DETENIDO│ -/-     │ start       │
│  Activos        │                                                           │
│  [📦] 3.        │                                                           │
│  Servidores     │                                                           │
│  Archivados     │                                                           │
│  [⚙] 4.         │                                                           │
│  Configuración  │                                                           │
│  Global         │                                                           │
│                 │                                                           │
├─────────────────┴───────────────────────────────────────────────────────────┤
│ [ESC] Back  [↑↓] Navegar  [TAB] Cambiar Panel  [ENTER] Seleccionar [F1] Help [Q] Salir │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### 1. Encabezado (Header)
*   **Posición:** Parte superior, centrado horizontalmente.
*   **Contenido:** Título de la herramienta renderizado con `ink-big-text` para generar arte ASCII grande.
*   **Estilo:** Aplicar `ink-gradient` sobre el texto ASCII para un efecto visual moderno y distintivo.
*   **Reutilización:** El texto del ASCII art puede ser estático ("ZOMBOID-CLI") o parametrizable para sub-vistas.

##### 2. Panel de Estado del Sistema (System Status)
*   **Posición:** Justo debajo del título, ocupa todo el ancho disponible.
*   **Contenedor:** Recuadro horizontal con bordes `rounded` usando `ink-titled-box`. El título "System Status" se posiciona en la esquina `left` con estilo `rounded`.
*   **Información Mostrada:**
    *   `v1.2.3`: Versión actual del software.
    *   `Active Servers: 3`: Cantidad de servidores actualmente en funcionamiento o en algún proceso activo.
    *   `Total Servers: 5`: Cantidad total de servidores configurados (incluyendo apagados o archivados).
    *   *(Opcional/Extensible)* `Uptime: 45m`: Tiempo de actividad de la sesión o del sistema.
*   **Estilo:** La información se presenta en una sola línea separada por pipes (`|`). Los valores numéricos pueden usar colores de acento del tema.

##### 3. Panel Izquierdo: Menú Principal (Menu)
*   **Posición:** Columna izquierda, debajo del System Status.
*   **Contenedor:** Recuadro con bordes `rounded` y `ink-titled-box` con título "Menu" en posición `left` y estilo `rounded`.
*   **Contenido:** Zona de navegación interactiva.
*   **Opciones del Menú:**
    *   `[+] 1. Crear Nuevo Servidor`: Opción para configurar e instanciar un servidor desde cero.
    *   `>[▶] 2. Servidores Activos`: La opción seleccionada actualmente. El símbolo `>` y el fondo resaltado (color cian claro) indican el cursor del usuario. Al estar seleccionada, despliega su contenido en el panel derecho.
    *   `[📦] 3. Servidores Archivados`: Acceso a servidores guardados pero no en uso constante.
    *   `[⚙] 4. Configuración Global`: Ajustes generales de la herramienta.
*   **Comportamiento:** Navegación vertical con flechas `↑` / `↓`. El ítem seleccionado cambia el contenido del panel derecho. El símbolo `>` indica el foco activo.

##### 4. Panel Derecho: Vista Previa / Contenido Dinámico (Active Servers Preview)
*   **Posición:** Columna derecha, debajo del System Status, ocupa el espacio restante.
*   **Contenedor:** Recuadro con bordes `rounded` y `ink-titled-box`. El título cambia dinámicamente según la selección del menú (ej. "Active Servers Preview", "Create Server Wizard", "Archived Servers", "Global Settings").
*   **Contenido Actual (ejemplo: Servidores Activos):** Tabla con columnas:
    *   `NAME`: Identificador corto del servidor (ej. `main`, `PvP`, `dev`).
    *   `INSTANCE TYPE`: Tipo de máquina de la instancia cloud (ej. `e2-standard-2`, `n2-standard-4`).
    *   `STATUS`: Estado con colores e iconos:
        *   `🟢 RUNNING` (Verde): Servidor encendido y funcionando.
        *   `⚠️ INICIANDO` (Amarillo): Servidor en proceso de arranque.
        *   `❌ DETENIDO` (Rojo): Servidor apagado.
    *   `PLAYERS`: Ocupación actual / capacidad máxima (ej. `12/20`). `-/-` si no aplica.
    *   `ACCIONES`: Comando rápido disponible (`stop` en rojo, `start` en azul/cian).
*   **Transición a Server Dashboard:** Cuando el foco está en el panel derecho y el usuario navega a un servidor con `↑↓` y presiona `ENTER`, la interfaz entra en modo **Server Dashboard (Nivel 1)**. El panel izquierdo se reemplaza por el sub-menú de gestión del servidor seleccionado (ver sección "Server Dashboard" abajo), y el panel derecho muestra la configuración de la primera opción (`Server Management`) por defecto.
*   **Reutilización:** Este panel renderiza componentes diferentes basados en el estado de navegación. Debe soportar tablas, formularios, logs, y wizard steps.

##### 5. Barra Inferior de Atajos (Footer)
*   **Posición:** Parte más baja de la pantalla, siempre visible.
*   **Contenido:** Teclas de acceso rápido para interactuar sin ratón.
*   **Atajos (de izquierda a derecha):**
    *   `[ESC] Back`: Retroceder o cancelar una acción.
    *   `[↑↓] Navegar`: Control vertical. Permite subir/bajar por las opciones del Menú Principal o desplazarse por la lista del panel derecho.
    *   `[TAB] Cambiar Panel`: **Mejora clave de usabilidad.** El foco (resaltado cian claro) salta del panel izquierdo al panel derecho, indicando claramente con qué parte de la pantalla se está interactuando.
    *   `[ENTER] Seleccionar`: Confirmador universal de la acción enfocada.
    *   `[F1] Help`: Abrir menú de ayuda o documentación.
    *   `[Q] Salir`: Cerrar completamente el programa (Quit).
*   **Nota:** La interfaz mezcla inglés y español (ej. "Salir" vs "Help", "Acciones" vs "Players").

##### Comportamiento de Foco y Navegación
*   **Foco Inicial:** Al cargar el dashboard, el foco está en el **Panel Izquierdo (Menú Global)**.
*   **Navegación en Menú Global:** `↑` / `↓` mueven la selección. Cambiar la opción actualiza el título y contenido del Panel Derecho.
*   **Cambio de Panel (`TAB`):** **EXCLUSIVO** para alternar el foco entre el Panel Izquierdo y el Panel Derecho. `TAB` nunca se usa para navegar entre elementos internos de un panel.
    *   Si el foco está en el Panel Derecho, `↑` / `↓` navegan por los ítems de la tabla/contenido activo. `←` / `→` navegan horizontalmente cuando aplique (ej. acciones de fila, botones).
    *   `ENTER` ejecuta la acción del ítem enfocado.
*   **Entrar a Server Dashboard (`ENTER` en servidor activo):** Cuando el usuario está en "Active Servers Preview", navega con `↑↓` hasta un servidor, y presiona `ENTER`, la interfaz transiciona al **Server Dashboard (Nivel 1)**:
    *   El panel izquierdo cambia del Menú Global al **Sub-menú del Servidor** (las opciones descritas en la sección "Server Dashboard").
    *   El panel derecho muestra el contenido de la opción seleccionada por defecto (`Server Management`).
    *   El foco se posiciona en el panel izquierdo (sub-menú del servidor).
*   **Volver al Menú Global (`ESC` en Server Dashboard):** Desde cualquier punto del Server Dashboard, `ESC` regresa al usuario al Menú Global con "Servidores Activos" seleccionado y la tabla de servidores en el panel derecho.
*   **Reutilización del Layout:** Este layout de 5 secciones (Header, System Status, Left Panel, Right Panel, Footer) es el esqueleto reutilizable para todas las vistas de Nivel 0 y Nivel 1. Los títulos de `ink-titled-box` y el contenido de los paneles son los únicos elementos que cambian.

##### Sistema de Modales y Confirmaciones

La TUI implementa un sistema de modales superpuesto que bloquea la interacción con el resto de la interfaz hasta que el usuario responda. Existen tres categorías de modales:

**1. Confirmación de Acciones Destructivas/Peligrosas**
Se muestra antes de ejecutar operaciones irreversibles o de alto impacto. El usuario debe confirmar explícitamente.
*   **Ejemplos:** Archive Server, Restore Backup (sobrescribe datos), Delete Record (archivados), Delete Backup, Kick/Ban de jugadores, Cambiar Build Branch con servidor RUNNING.
*   **Formato:** Título en rojo, descripción de la consecuencia, botones `[Cancelar]` (default, seleccionado) / `[Confirmar]`.

**2. Cambios Sin Guardar (Buffer Global)**
> **Nota arquitectónica:** El sistema de "Dirty State por panel" fue eliminado tras investigación. Todos los cambios van al **buffer global de cambios pendientes**. No hay confirmación intermedia por panel.
>
> El usuario modifica campos en un panel, presiona `Queue Changes` (o `Ctrl+S` en editor inline), y los cambios se acumulan en el buffer global. Al salir del panel (ESC) no se pregunta nada. Solo al salir del Server Dashboard (ESC desde sub-menú) o al presionar `Ctrl+A` se interviene si hay cambios en el buffer.

**3. Cambios que Requieren Reinicio**
Algunas configuraciones solo aplican tras reiniciar el servidor (nombre, descripción, admin credenciales, cambio de build branch). El sistema trackea estos cambios pendientes.
*   **Indicador en panel:** `🔄 Restart Required` aparece en rojo junto a los campos que lo requieren, o como banner en la parte superior del panel derecho.
*   **Modal al salir del Server Dashboard:** Si el usuario presiona `ESC` para volver al Menú Global y existen cambios pendientes de reinicio, se muestra:
    *   *"Los cambios no se han aplicado. Se requiere reiniciar el servidor. ¿Deseas reiniciar ahora?"*
    *   **Botones:** `[Reiniciar más tarde]` (default) / `[Reiniciar ahora]`.
    *   Si elige "Reiniciar ahora", ejecuta el flujo de reinicio gracioso (RCON save + quit + restart) antes de salir al Menú Global.
    *   Si elige "Reiniciar más tarde", guarda los cambios en la configuración del servidor pero no reinicia. El indicador `🔄 Restart Required` persiste en la UI hasta que el servidor se reinicie.

**Comportamiento de Modales:**
*   El modal se renderiza centrado usando `position="absolute"` con `top/left/right/bottom={0}` sobre el viewport completo. No hay z-index en Ink — el orden de render determina la superposición.
*   El "dimming" se simula con `backgroundColor="gray"` (no existe transparencia real en terminal).
*   `useFocus({isActive: true})` atrapa el foco dentro del modal, bloqueando navegación del layout subyacente.
*   Solo **un modal a la vez**. No hay pila/stack nativa de modales.
*   `←` / `→`: Navegar entre botones del modal.
*   `ENTER`: Confirmar opción seleccionada.
*   `ESC`: Equivale a `[Cancelar]` en todos los modales (acción segura por defecto).

##### Sistema Global de Cambios Pendientes (Apply Changes)

El **Server Dashboard** implementa un sistema de **cambios acumulativos**. El usuario puede navegar por múltiples paneles (Basic Settings, Admins, Provider & Region, Build, Advanced Settings) y realizar modificaciones en cada uno sin que se apliquen inmediatamente. Todos los cambios se acumulan en un **buffer de cambios pendientes** hasta que el usuario decida aplicarlos globalmente.

**Flujo de trabajo:**
1. El usuario modifica campos en cualquier panel de configuración (ej. cambia `Public Name` en Basic Settings, cambia `Admin Password` en Admins).
2. Al presionar `ENTER` en el botón `Save Changes` de un panel (o `Ctrl+S` en el editor inline), los cambios de ese panel se añaden al **buffer global de cambios pendientes**. La UI muestra un toast: `✅ 3 changes queued`.
3. El usuario puede seguir navegando entre paneles y acumular más cambios.
4. Cuando está listo, usa el atajo global **`Ctrl+A`** (o navega al botón `[Apply Changes]` en el footer) para abrir el **Resumen de Cambios Pendientes**.
5. En el resumen, el usuario revisa todos los cambios acumulados y decide aplicarlos o descartarlos.

**Buffer de Cambios Pendientes:**
El sistema trackea los siguientes tipos de cambios:
*   **Env Var Changes:** Cambios en variables de entorno del `docker-compose.yml` (Basic Settings: `SERVERNAME`, `DISPLAYNAME`, `PASSWORD`, `PUBLIC`; Admins: `ADMINUSERNAME`, `ADMINPASSWORD`).
*   **INI/LUA File Changes:** Ediciones en archivos de configuración (Description en INI, archivos en Advanced Settings).
*   **Build Changes:** Cambio de rama SteamCMD (requiere rebuild de imagen Docker).
*   **Infrastructure Changes:** Cambio de región o tipo de instancia (requiere recreación de VM via Pulumi).

**Indicadores Visuales:**
*   **Banner global:** Si hay cambios pendientes, un banner amarillo `⚠️ 4 changes pending — Press Ctrl+A to apply` aparece en la parte superior del panel derecho (debajo del título).
*   **Panel-level indicators:** Cada panel que tiene cambios pendientes muestra un punto `•` junto a su nombre en el sub-menú izquierdo (ej. `⚙ Basic Settings •`).
*   **Footer:** El footer muestra `[Ctrl+A] Apply (3)` cuando hay cambios pendientes.

**Atajo Global:**
*   `Ctrl+A`: Abre el modal **Resumen de Cambios Pendientes** desde cualquier panel del Server Dashboard.

**Modal: Resumen de Cambios Pendientes**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Apply Pending Changes                                                      │
│  ─────────────────────                                                      │
│  Review the following changes before applying them:                         │
│                                                                             │
│  📝 Basic Settings                                                          │
│    • Public Name: "My Old Server" → "My New Server"                         │
│    • Public Listing: No → Yes                                               │
│                                                                             │
│  👤 Admins                                                                  │
│    • Admin Password: [changed]                                              │
│                                                                             │
│  ☁ Provider & Region                                                        │
│    • Region: us-central1-a → europe-west1-b                                 │
│    • Instance: n2d-standard-4 → c2-standard-4                               │
│                                                                             │
│  ⚠️  This will require: VM recreation + Docker rebuild + container restart  │
│                                                                             │
│  >[✅ Apply All]    [❌ Discard All]    [🔍 Back to Edit]                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Agrupación:** Los cambios se agrupan por panel para facilitar la lectura.
*   **Impacto:** Se muestra un resumen del impacto total (ej. "VM recreation + container restart").
*   **Acciones:**
    *   `✅ Apply All`: Ejecuta todos los cambios en el orden correcto (ver abajo).
    *   `❌ Discard All`: Descarta todos los cambios pendientes y limpia el buffer.
    *   `🔍 Back to Edit`: Cierra el modal y permite seguir editando.

**Orden de Aplicación (Pipeline):**
Cuando el usuario confirma `Apply All`, el sistema ejecuta los cambios en este orden:
1.  **Infrastructure Changes (si aplica):** Si hay cambio de región o tipo de instancia:
    *   Graceful shutdown (RCON save + quit) si RUNNING.
    *   `pulumi destroy` + `pulumi up` con nueva región/tipo.
    *   Esperar VM RUNNING.
2.  **Build Changes (si aplica):** Si hay cambio de rama:
    *   `docker compose down`.
    *   Modificar imagen Docker en compose.
    *   `docker compose pull`.
3.  **Env Var Changes (si aplica):** Si hay cambios en Basic Settings o Admins:
    *   Actualizar `docker-compose.yml` con nuevas env vars.
    *   `docker compose up -d` (aplica env vars al reiniciar contenedor).
4.  **INI/LUA File Changes (si aplica):** Si hay ediciones en archivos:
    *   Transferir archivos modificados vía SFTP.
    *   Si el servidor está RUNNING y los archivos requieren reinicio (todos los `.ini`/`.lua`), mostrar: *"Archivos de configuración actualizados. Se requiere reinicio del contenedor para que los cambios surtan efecto. ¿Reiniciar ahora?"* — `[Reiniciar más tarde]` / `[Reiniciar ahora]`.

**Modal Post-Aplicación:**
Tras completar el pipeline, se muestra un resumen de éxito/error:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Changes Applied Successfully                                               │
│  ────────────────────────────                                               │
│  ✅ Region changed to europe-west1-b                                        │
│  ✅ Instance upgraded to c2-standard-4                                      │
│  ✅ Public Name updated                                                     │
│  ✅ Admin Password updated                                                  │
│                                                                             │
│  Server is restarting... Please wait.                                       │
│                                                                             │
│  [OK]                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Dirty State Eliminado:**
*   El sistema de **Dirty State por panel fue eliminado**. El flujo es ahora: modificar → `Queue Changes` → buffer global. No hay interrupciones al navegar entre paneles.
*   Si el usuario modifica campos en un panel pero **no** presiona `Queue Changes` y luego navega a otro panel o presiona `ESC`, **los cambios se descartan silenciosamente** (no hay modal intermedio).
*   Al presionar `ESC` desde el sub-menú para salir del Server Dashboard al Menú Global: Si hay cambios en el buffer global, se muestra: *"Tienes cambios pendientes sin aplicar. ¿Aplicar ahora, descartar, o seguir editando?"* — `[Aplicar (Ctrl+A)]` / `[Descartar]` / `[Seguir editando]`.

#### 2.2 Server Dashboard (Nivel 1)

Al seleccionar un servidor desde "Active Servers Preview" (presionando `ENTER` sobre un servidor con foco en el panel derecho), la interfaz entra en el **Server Dashboard**. Este es un contexto de navegación anidado donde el panel izquierdo se transforma en el sub-menú de gestión del servidor seleccionado, y el panel derecho muestra la configuración/contenido de la opción activa del sub-menú.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         [ZOMBOID-CLI ASCII ART]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  System Status  ┌───────────────────────────────────────────────────────┐   │
│                 │ v1.2.3 | Active Servers: 3 | Total Servers: 5 | Uptime: 45m │
│                 └───────────────────────────────────────────────────────┘   │
├─────────────────┬───────────────────────────────────────────────────────────┤
│  main           │  Server Management                                        │
│  ─────────────  │  ─────────────────                                        │
│  >[🖥] Server   │  Status:   🟢 RUNNING                                     │
│      Management │  IP:       34.120.45.67                                   │
│  [☁] Provider   │  Branch:   stable                                         │
│      & Region   │  Players:  12/20                                          │
│  [🔧] Build     │                                                           │
│  [👥] Players   │  >[🚀] Deploy    [⏹] Stop    [🔄] Update    │[📦] Archive│
│  [📊] Stats     │                                                           │
│  [⚙] Basic      │                                                           │
│      Settings   │                                                           │
│  [🔒] Advanced  │                                                           │
│  [👤] Admins    │                                                           │
│  [⏰] Scheduler │                                                           │
│  [💾] Backups   │                                                           │
│  [←] Back to    │                                                           │
│      Servers    │                                                           │
├─────────────────┴───────────────────────────────────────────────────────────┤
│ [ESC] Back  [↑↓] Navegar  [TAB] Cambiar Panel  [ENTER] Seleccionar [F1] Help [Q] Salir │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### Panel Izquierdo: Sub-menú del Servidor

El título del `ink-titled-box` muestra el **nombre del servidor** (ej. `main`). Las opciones del sub-menú son:

1.  **`🖥 Server Management`** (seleccionada por defecto al entrar)
    *   Gestión del ciclo de vida: Estado actual, IPs, acciones rápidas.
    *   Acciones disponibles: Deploy, Start, Stop, Update, Archive Server.
2.  **`☁ Provider & Region`**
    *   Proveedor cloud (GCP/AWS/Azure), región con ping en tiempo real, tipo de instancia.
    *   Acciones: Cambiar región, cambiar tipo de instancia.
3.  **`🔧 Build`**
    *   Selección de rama SteamCMD: `stable`, `unstable`, `outdatedunstable`.
    *   Acción: Change Branch & Rebuild (cambia imagen Docker).
4.  **`👥 Player Management`**
    *   Lista de jugadores online vía RCON.
    *   Acciones: Kick, Ban, Broadcast (`servermsg`).
5.  **`📊 Server Stats`**
    *   Métricas de contenedor (CPU%, RAM%, Network I/O) vía `docker stats` por SSH.
    *   Logs snapshot (`docker logs --tail 100`) y streaming (`docker logs -f`, salir con `q`).
6.  **`⚙ Basic Settings`**
    *   Server Name (ID), Public Name, Description, Password, Public Listing.
7.  **`🔒 Advanced Settings (BYOC)`**
    *   Editor inline y reemplazo de archivos `.ini`/`.lua` en el servidor remoto.
    *   *(Nota: Mods se gestionan preferentemente vía env vars `WORKSHOP_IDS`/`MOD_IDS`, o editando el `.ini` inline).*
8.  **`👤 Admins`**
    *   Admin Username, Admin Password.
9.  **`⏰ Scheduler`**
    *   Tareas Cron configuradas en la VM vía crontab remoto (SSH).
    *   Tipos: Auto-Restart, Auto-Backup, Broadcast RCON.
10. **`💾 Backups`**
    *   Historial de backups y Restore (descarga de tarballs locales).
11. **`← Back to Servers`**
    *   Opción al final del menú para regresar al Menú Global (equivalente a `ESC`).

**Navegación del Sub-menú:**
*   `↑` / `↓`: Mover selección entre las opciones del sub-menú.
*   `ENTER`: Cambiar la opción activa (actualiza el contenido del panel derecho).
*   `TAB`: Cambiar foco al panel derecho para interactuar con los controles de la vista activa.
*   `ESC`: Regresar al Menú Global (lista de servidores activos).

##### Panel Derecho: Contenido Dinámico del Server Dashboard

El título del `ink-titled-box` cambia según la opción seleccionada del sub-menú (ej. "Server Management", "Player Management", "Server Stats"). El contenido específico de cada vista se define en las sub-secciones siguientes.

**Comportamiento General del Panel Derecho en Server Dashboard:**
*   Cuando el foco está en el panel izquierdo, el panel derecho se renderiza en modo "preview" (no interactivo).
*   `TAB` cambia el foco entre panel izquierdo y panel derecho exclusivamente.
*   Cuando el foco está en el panel derecho, los controles de esa vista (botones, tablas, formularios) son interactivos. `↑` / `↓` navegan verticalmente, `←` / `→` navegan horizontalmente cuando aplique.

##### Panel Derecho: Server Management

Vista por defecto al entrar al Server Dashboard. Muestra información resumida del servidor y acciones rápidas.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Server Management                                                          │
│  ─────────────────                                                          │
│  Status:   🟢 RUNNING                                                       │
│  IP:       34.120.45.67                                                     │
│  Branch:   stable                                                           │
│  Players:  12/20                                                            │
│                                                                             │
│  >[🚀] Deploy    [⏹] Stop    [🔄] Update    [📦] Archive                    │
│                                                                             │
│  [✅ Apply All Changes (3)]  ← muestra solo si hay cambios pendientes       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Información mostrada:**
*   `Status`: Estado actual con icono y color (`🟢 RUNNING`, `⚠️ INICIANDO`, `❌ DETENIDO`).
*   `IP`: Dirección IPv4 pública estática.
*   `Branch`: Rama SteamCMD activa (`stable` / `unstable` / `outdatedunstable`).
*   `Players`: Jugadores conectados / capacidad máxima.

**Acciones rápidas (fila de botones):**
*   `🚀 Deploy`: Inicia el deploy del servidor (si está en estado `stopped` o `failed`).
*   `⏹ Stop`: Detiene el servidor graciosamente vía RCON + `docker compose down`.
*   `🔄 Update`: Ejecuta el flujo de actualización graciosa (broadcast, save, quit, pull, up).
*   `📦 Archive`: Inicia el flujo de archivado (backup + destroy). **Modal destructivo obligatorio**: *"Archivar el servidor destruirá permanentemente la infraestructura cloud (VM, IP, firewall). Se creará un backup local obligatorio. ¿Continuar?"* — Botones: `[Cancelar]` (default) / `[Archivar]`.

**Botón Global `[✅ Apply All Changes (N)]`:**
*   Aparece en la parte inferior del panel **solo cuando el buffer global de cambios pendientes tiene elementos**.
*   Muestra el conteo de cambios pendientes (ej. `(3)`).
*   `ENTER` en este botón equivale a presionar `Ctrl+A` desde cualquier panel: abre el **Resumen de Cambios Pendientes**.
*   Este botón ofrece descubribilidad visual del atajo global, especialmente para usuarios que no memorizan shortcuts.

**Navegación de acciones:**
*   Con foco en panel derecho: `↑` / `↓` para navegar entre la fila de acciones rápidas y el botón `Apply All Changes`. `←` / `→` para navegar horizontalmente dentro de la fila de acciones rápidas.
*   `ENTER` para ejecutar la acción enfocada.
*   La acción enfocada tiene resaltado cian claro.

---

##### Panel Derecho: Provider & Region

Gestión de la infraestructura cloud del servidor: proveedor, región geográfica y tipo de instancia. **Cualquier cambio en este panel requiere recrear la VM**, lo que implica downtime.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Provider & Region                                        ⚠️ 2 changes      │
│  ─────────────────                                                          │
│  Provider:     GCP                                                          │
│  Region:       us-central1-a  (Ping: 45ms)                                  │
│  Instance:     n2d-standard-4 (16GB RAM → 12GB JVM)                         │
│                                                                             │
│  ─── Infrastructure ───                                                     │
│                                                                             │
│  >[🌍] Change Region       Current: us-central1-a (45ms)                   │
│   [⚙] Change Instance Type Current: n2d-standard-4 (16GB RAM)              │
│                                                                             │
│  ℹ️  MaxPlayers=32 → Recommended: n2d-standard-4 (Balanced)                │
│  💰  Est. Cost: ~$0.17/hr (~$122/mo)                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sección Información Actual:**
*   `Provider`: Cloud provider actual (`GCP`, `AWS`, `Azure`). MVP: solo GCP editable, AWS/Azure muestran "Coming Soon" deshabilitado.
*   `Region`: Zona de despliegue actual con latencia medida (ej. `us-central1-a | 45ms`).
*   `Instance`: Tipo de máquina actual con cálculo de RAM → JVM (ej. `n2d-standard-4 | 16GB RAM → 12GB JVM`).
*   **Estimated Cost:** Precio estimado por hora basado en instance type + región. Se actualiza dinámicamente al cambiar cualquiera de estos parámetros.
*   **Recomendación:** Lee `MaxPlayers` del `${SERVERNAME}.ini` y sugiere tier óptimo.

**Acciones principales:**
*   `🌍 Change Region`: Abre el **sub-panel de selección de región**.
*   `⚙ Change Instance Type`: Abre el **sub-panel de selección de instancia** (tiers curados + catálogo filtrado).

Al seleccionar una nueva región o tipo de instancia, los cambios se añaden al **buffer global de cambios pendientes** (no se aplican inmediatamente). El usuario usa `Ctrl+A` para aplicar todos los cambios acumulados.

###### Sub-panel: Change Region

Al presionar `ENTER` en `Change Region`, el panel derecho muestra el selector de regiones:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Change Region                                    [ESC] Back  [TAB] Panel   │
│  ─────────────                                                              │
│  Select a new region. Regions are grouped by continent and sorted by ping. │
│                                                                             │
│  > americas                                                                 │
│    us-central1-a        │ Iowa        │ 45ms   │ [Select]                  │
│    us-east1-b           │ S. Carolina │ 52ms   │ [Select]                  │
│    us-west1-a           │ Oregon      │ 78ms   │ [Select]                  │
│    southamerica-east1-a │ São Paulo   │ 120ms  │ [Select]                  │
│    northamerica-northeast1-a │ Montréal │ 95ms │ [Select]                  │
│                                                                             │
│  europe                                                                     │
│    europe-west1-b       │ London      │ 110ms  │ [Select]                  │
│    europe-north1-a      │ Finland     │ 125ms  │ [Select]                  │
│    europe-west4-a       │ Netherlands │ 115ms  │ [Select]                  │
│                                                                             │
│  asia                                                                       │
│    asia-east1-a         │ Taiwan      │ 180ms  │ [Select]                  │
│    asia-southeast1-b    │ Singapore   │ 195ms  │ [Select]                  │
│                                                                             │
│  (Scroll ↓ for more regions — oceania, middle east, africa)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Agrupación por continente:** `americas`, `europe`, `asia`, `oceania`, `middle east`, `africa`.
*   **Columnas:** Nombre técnico de la zona, nombre de la ciudad/región descriptiva, ping en tiempo real, botón `[Select]`.
*   **Ordenamiento:** Dentro de cada continente, ordenadas de **menor a mayor ping**.
*   **Scroll:** Si la lista excede la altura disponible, scroll vertical. `↑` / `↓` navegan por la lista; al llegar al borde, el contenido se desplaza. Indicadores `(Scroll ↓)` / `(Scroll ↑)`.
*   **Ping:** Medición HTTP en tiempo real al cargar el sub-panel (mismo mecanismo que el Setup Wizard). Refresca cada 10 segundos. Muestra `measuring...` mientras se calcula.
*   **Selección:** `ENTER` en `[Select]` de una región la marca como seleccionada (`✓` aparece junto al nombre) y vuelve automáticamente al panel principal de Provider & Region. El cambio se añade al buffer global.
*   `ESC`: Vuelve al panel principal sin cambiar la región.

###### Sub-panel: Change Instance Type

Al presionar `ENTER` en `Change Instance Type`, el panel derecho muestra el selector de instancias:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Change Instance Type                             [ESC] Back  [TAB] Panel   │
│  ─────────────────────                                                      │
│  Curated Tiers (Recommended for Game Servers)                               │
│  ────────────────────────────────────────────────────────────────────────── │
│  >[⭐] n2d-standard-4  Balanced          4 vCPU │ 16GB RAM │ ~$0.17/hr       │
│   [💰] e2-standard-4   Budget            4 vCPU │ 16GB RAM │ ~$0.11/hr       │
│   [🚀] c2-standard-4   Performance       4 vCPU │ 16GB RAM │ ~$0.21/hr       │
│   [📈] n2d-standard-8  Growth            8 vCPU │ 32GB RAM │ ~$0.34/hr       │
│   [🔥] c2d-standard-8  Heavy/Modded      8 vCPU │ 32GB RAM │ ~$0.36/hr       │
│                                                                             │
│  ─── All Instance Types (Filtered for Game Servers) ───                     │
│                                                                             │
│  >[📁] Cost-Effective — E2 Series                                           │
│    [📁] Balanced — N2 Series (Intel)                                        │
│    [📁] Balanced — N2D Series (AMD)                                         │
│    [📁] Compute Optimized — C2 Series (Intel, best for game servers)        │
│    [📁] Compute Optimized — C2D Series (AMD)                                │
│                                                                             │
│  (Press ENTER to expand a category)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tiers Curados (featured at top):**
Estos son los 5 tiers recomendados basados en la investigación de GCP para Project Zomboid (priorizando CPU single-thread fuerte + RAM suficiente). Aparecen siempre al inicio del sub-panel. El icono `⭐` marca el recomendado por defecto según `MaxPlayers`.

> **Nota sobre precios:** Los costos mostrados son **estimaciones hardcodeadas** aproximadas para la región `us-central1`. No se consulta la Cloud Billing API en runtime. Los precios reales pueden variar por región y están sujetos a cambios por Google Cloud. Se muestra el prefijo `~` y un aviso `⚠️ Estimated prices.`

| Tier | Instance Type | vCPU | RAM | JVM | Jugadores | Est. Cost/hr |
|------|--------------|------|-----|-----|-----------|--------------|
| Budget | `e2-standard-4` | 4 | 16GB | 12GB | 1-8 | ~$0.11 |
| Balanced ⭐ | `n2d-standard-4` | 4 | 16GB | 12GB | 8-24 | ~$0.17 |
| Performance | `c2-standard-4` | 4 | 16GB | 12GB | 8-24 | ~$0.21 |
| Growth | `n2d-standard-8` | 8 | 32GB | 26GB | 24-48 | ~$0.34 |
| Heavy/Modded | `c2d-standard-8` | 8 | 32GB | 26GB | 48+ | ~$0.36 |

*Nota sobre 2 vCPU:* Las instancias de 2 vCPU (`e2-standard-2`, `n2-standard-2`, etc.) se excluyen del tier curado porque ofrecen margen insuficiente para Build 42/mods. Siguen disponibles en el catálogo filtrado bajo "Advanced — 2 vCPU (Testing Only)".

**Catálogo Filtrado (categorías expandibles):**
Al presionar `ENTER` en una categoría, se expande mostrando las instancias filtradas. `↑` / `↓` navegan entre instancias. `ENTER` en una instancia la selecciona (`✓`) y vuelve al panel principal.

**Categorías y instancias filtradas para servidores de juegos (GCP):**

**1. Cost-Effective — E2 Series** (CPU burstable, precio más bajo, menos predecible)
| Instance | vCPU | RAM | Notas |
|----------|------|-----|-------|
| `e2-standard-4` | 4 | 16GB | Budget tier curado. Bien para 2-8 jugadores vanilla. |
| `e2-standard-8` | 8 | 32GB | Medium community, cost-effective |
| `e2-highmem-4` | 4 | 32GB | Memory-heavy medium server |
| `e2-highmem-8` | 8 | 64GB | Memory-heavy large server |

**2. Balanced — N2 Series (Intel)** (rendimiento consistente, general-purpose premium)
| Instance | vCPU | RAM | Notas |
|----------|------|-----|-------|
| `n2-standard-4` | 4 | 16GB | Premium Intel balanced. Buena alternativa a N2D si prefieres Intel. |
| `n2-standard-8` | 8 | 32GB | Large community |
| `n2-standard-16` | 16 | 64GB | Very large server |
| `n2-highmem-4` | 4 | 32GB | High RAM community |
| `n2-highmem-8` | 8 | 64GB | High RAM large server |

**3. Balanced — N2D Series (AMD EPYC)** ⭐ **Best price/performance balanced** (gran relación precio/rendimiento, recomendado por defecto)
| Instance | vCPU | RAM | Notas |
|----------|------|-----|-------|
| `n2d-standard-4` | 4 | 16GB | **Recomendado por defecto**. Mejor balance costo/perf para PZ. |
| `n2d-standard-8` | 8 | 32GB | Growth tier curado. Ideal para mods y comunidades medianas. |
| `n2d-standard-16` | 16 | 64GB | Large server, muy escalable |
| `n2d-highmem-4` | 4 | 32GB | High RAM AMD balanced |
| `n2d-highmem-8` | 8 | 64GB | High RAM AMD large |

**4. Compute Optimized — C2 Series (Intel)** 🚀 **Best single-thread performance** (alta frecuencia de reloj, ideal para minimizar lag del hilo principal de PZ)
| Instance | vCPU | RAM | Notas |
|----------|------|-----|-------|
| `c2-standard-4` | 4 | 16GB | **Best single-thread for PZ**. Alto clock speed, mínimo lag en simulación. |
| `c2-standard-8` | 8 | 32GB | Best for massive communities |
| `c2-standard-16` | 16 | 64GB | Overkill for most PZ servers |
| `c2-standard-30` | 30 | 120GB | Extremo, solo para servidores masivos con cientos de mods |
| `c2-standard-60` | 60 | 240GB | Extremo, prácticamente nunca necesario para PZ |

**5. Compute Optimized — C2D Series (AMD)** (alternativa compute-optimized con mejor costo y opciones highmem)
| Instance | vCPU | RAM | Notas |
|----------|------|-----|-------|
| `c2d-standard-2` | 2 | 8GB | Testing only. CPU rápida pero RAM ajustada. |
| `c2d-standard-4` | 4 | 16GB | Buena alternativa a C2 si prefieres AMD y mejor precio. |
| `c2d-standard-8` | 8 | 32GB | Heavy/Modded tier curado. CPU rápida + RAM para mods pesados. |
| `c2d-standard-16` | 16 | 64GB | AMD compute massive |
| `c2d-highmem-2` | 2 | 16GB | Testing with extra RAM |
| `c2d-highmem-4` | 4 | 32GB | AMD compute + high RAM |
| `c2d-highmem-8` | 8 | 64GB | AMD compute + high RAM large |

**6. Legacy — N1 Series** (generación anterior, solo por compatibilidad/precio regional)
| Instance | vCPU | RAM | Notas |
|----------|------|-----|-------|
| `n1-standard-4` | 4 | 15GB | Legacy balanced. Usar solo si N2/N2D no disponible en zona. |
| `n1-standard-8` | 8 | 30GB | Legacy large |
| `n1-highmem-4` | 4 | 26GB | Legacy high RAM |

**7. Advanced — 2 vCPU (Testing Only)** ⚠️ (margen insuficiente para producción con Build 42)
| Instance | vCPU | RAM | Notas |
|----------|------|-----|-------|
| `e2-standard-2` | 2 | 8GB | Testing / 1-3 jugadores. Poco margen con mods. |
| `n2-standard-2` | 2 | 8GB | Testing / 1-3 jugadores. Mejor rendimiento que E2. |
| `n2d-standard-2` | 2 | 8GB | Testing / 1-3 jugadores. Buen balance para pruebas. |
| `e2-highmem-2` | 2 | 16GB | Testing with extra RAM. |
| `n2-highmem-2` | 2 | 16GB | Testing with extra RAM, consistente. |
| `n2d-highmem-2` | 2 | 16GB | Testing with extra RAM, AMD. |

**Filtrado aplicado:** Se excluyen instancias irrelevantes o perjudiciales para servidores de juegos persistentes:
*   **Shared-core / Burstable:** `e2-micro`, `e2-small`, `e2-medium`, `f1-micro`, `g1-small`, `t2d-standard-*`, `t2a-standard-*` — CPU compartida causa jitter inaceptable.
*   **High-CPU con poca RAM:** `c2d-highcpu-*`, `n2-highcpu-*`, `n2d-highcpu-*` — PZ necesita RAM moderada; perfiles highcpu quedan cortos en memoria.
*   **Memory-optimized:** `m1-ultramem-*`, `m1-megamem-*`, `m2-ultramem-*`, `m2-megamem-*`, `m2-hypermem-*` — sobreprovisión brutal, cientos de GB innecesarios.
*   **Accelerator/GPU:** `a2-*`, `g2-*` — PZ dedicated server no usa GPU.
*   **Storage-optimized / HPC:** `z3-*`, `h3-*`, `h4d-*` — perfil de uso incorrecto para game server.
*   **Instancias < 4 vCPU en producción:** Las de 2 vCPU se relegan a "Testing Only". Para servidores persistentes se requiere mínimo 4 vCPU para margen con Build 42 y mods.

**Navegación en el sub-panel:**
*   `↑` / `↓`: Navegar entre tiers curados, categorías, o instancias dentro de una categoría expandida.
*   `ENTER`: Expandir/colapsar categoría, o seleccionar instancia.
*   `TAB`: Cambiar foco entre panel izquierdo y panel derecho.
*   `ESC`: Vuelve al panel principal de Provider & Region.

**🔄 Restart Required / ⚠️ VM Recreation:**
*   **Cualquier cambio en este panel (región o tipo de instancia) requiere recrear la VM**. El banner muestra: `⚠️ VM Recreation Required`.
*   Los cambios se añaden al buffer global y solo se aplican tras `Ctrl+A` → confirmar modal destructivo.

**Navegación (panel principal):**
*   `↑` / `↓`: Navegar entre `Change Region` y `Change Instance Type`.
*   `ENTER`: Abrir sub-panel seleccionado.
*   `TAB`: Cambiar foco entre panel izquierdo y panel derecho.
*   `ESC`: Si hay cambios pendientes en el buffer (no aplicados), muestra modal: *"Tienes cambios en el buffer de cambios pendientes. ¿Descartar o seguir editando?"* — `[Descartar]` / `[Seguir editando]`.

---

##### Panel Derecho: Build

Gestión de la rama SteamCMD del servidor. `STEAMAPPBRANCH` es una variable de **build-time** del Dockerfile de la imagen Docker. Sin embargo, la imagen `danixu86/project-zomboid-dedicated-server` publica **tags pre-buildadas** para cada rama, por lo que cambiar de rama consiste en cambiar el `image:` en `docker-compose.yml` y hacer `docker compose pull && up`. **No se requiere rebuild local de la imagen.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Build                                                ⚠️ 1 change queued    │
│  ─────                                                                      │
│  Current Branch:  stable (Build 41)                                         │
│  Image:           danixu/project-zomboid-server-docker:public               │
│                                                                             │
│  Select Branch:                                                             │
│  ──────────────                                                             │
│  >[🟢] stable           (Build 41 - Recommended)                            │
│   [🟡] unstable         (Build 42 - Latest features, possible bugs)         │
│   [🔴] outdatedunstable (Legacy build - Deprecated)                         │
│                                                                             │
│  [➕] Queue Changes     [Ctrl+A] Apply All (3)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Información mostrada:**
*   `Current Branch`: Rama activa actualmente (`stable` / `unstable` / `outdatedunstable`).
*   `Image`: Tag de la imagen Docker actual (ej. `:public`, `:unstable`).

**Mapeo de ramas a tags de imagen Docker:**
| Rama PRD | Steam Branch | Docker Image Tag | Descripción |
|----------|-------------|------------------|-------------|
| `stable` | `public` | `:latest` | Build 41 estable. Rama por defecto. |
| `unstable` | `unstable` | `:latest-unstable` | Build 42 en desarrollo. |
| `outdatedunstable` | `legacy` | `:legacy` | Rama obsoleta. No recomendada. |

**Selección de rama:**
*   Lista vertical de las 3 ramas.
*   Navegación con `↑` / `↓`. La rama seleccionada muestra `>` y resaltado cian.
*   Al cambiar de rama, el botón `Queue Changes` se habilita.

**Acción:**
*   `➕ Queue Changes`: Añade el cambio de rama al **buffer global de cambios pendientes**. Muestra toast: `✅ Build change queued`.
*   `Ctrl+A` (global): Abre el Resumen de Cambios Pendientes.

**Impacto del cambio de rama:**
*   Cambiar la rama actualiza el tag de `image:` en `docker-compose.yml`, ejecuta `docker compose pull` para descargar la nueva imagen pre-buildada, y reinicia el contenedor.
*   **Advertencia:** Los datos del mundo son compatibles entre B41 y B42 solo en ciertos casos. La UI muestra: *"⚠️ Cambiar entre Build 41 y 42 puede requerir un mundo nuevo. Realiza un backup antes."*
*   Actualiza `game_branch` en SQLite tras aplicar.

**🔄 Restart Required:**
*   Cambiar la rama **siempre requiere reinicio** (pull de imagen diferente + reinicio del contenedor).

**Navegación:**
*   `↑` / `↓`: Navegar entre ramas.
*   `ENTER`: Seleccionar rama (cambia selección) o ejecutar `Queue Changes`.
*   `TAB`: Cambiar foco entre panel izquierdo y panel derecho.
*   `ESC`: Si hay una rama diferente seleccionada sin encolar, muestra modal: *"Cambiar la rama requiere reconstruir el contenedor. ¿Descartar selección?"* — `[Descartar]` / `[Seguir editando]`.

---

##### Panel Derecho: Player Management

Lista de jugadores conectados vía RCON y herramientas de moderación.

> **Nota técnica:** El comando RCON `players` de Project Zomboid devuelve **solo nombres de usuario** en texto plano (formato: `-username -(admin)adminname`). No proporciona Steam ID, ping ni play time. La UI solo muestra el nombre y si es admin.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Player Management                                                          │
│  ─────────────────                                                          │
│  Connected Players: 3/20                                                    │
│                                                                             │
│  USERNAME        │ STATUS   │ ACTIONS                                       │
│  ────────────────────────────────────────────────────────────────────────── │
│  > Survivor123   │ Player   │ [💬] [👢] [🚫]                                │
│  MikeZomb        │ Player   │ [💬] [👢] [🚫]                                │
│  AdminPlayer     │ 👤 Admin │ [💬] [👢] [🚫]                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Información mostrada:**
*   `Connected Players`: Total conectados / capacidad máxima.
*   Tabla con columnas: `USERNAME`, `STATUS` (`Player` o `👤 Admin`).

**Acciones por jugador (fila):**
*   `💬 Message`: Envia mensaje privado vía RCON `servermsg` (abre input inline para escribir mensaje, `ENTER` para enviar, `ESC` para cancelar).
*   `👢 Kick`: Expulsa al jugador vía RCON `kickuser`. **Modal**: *"¿Expulsar a [username] del servidor?"* — `[Cancelar]` / `[Expulsar]`.
*   `🚫 Ban`: Banea al jugador vía RCON `banuser`. **Modal destructivo**: *"¿Banear permanentemente a [username]? Esta acción no se puede deshacer."* — `[Cancelar]` (default) / `[Banear]`.

**Navegación:**
*   `↑` / `↓`: Navegar entre jugadores.
*   `←` / `→`: Navegar entre acciones de la fila enfocada.
*   `ENTER`: Ejecutar acción enfocada.
*   `r`: Refrescar lista de jugadores (re-ejecuta RCON `players`).
*   `TAB`: Cambiar foco al panel izquierdo.
*   `ESC`: Volver al sub-menú.

**Estado vacío:**
*   Si no hay jugadores conectados: *"No players online. The server is empty."*

---

##### Panel Derecho: Server Stats

Métricas en tiempo real del contenedor Docker y logs del servidor.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Server Stats                                                               │
│  ────────────                                                               │
│  Container:  🟢 running                                                     │
│  CPU:        ████████░░  45%                                                │
│  Memory:     ██████████  78% (6.2G / 8G)                                    │
│  Network:    ↓ 1.2 GB  ↑ 890 MB                                             │
│  Disk I/O:   Read 45MB/s  Write 12MB/s                                      │
│                                                                             │
│  ─── Latest Logs (last 100 lines) ───                                       │
│  [2024-01-15 14:32:01] Server started on port 16261                         │
│  [2024-01-15 14:32:05] RCON port opened on 27015                            │
│  [2024-01-15 14:35:22] User Survivor123 connected                           │
│  ...                                                                        │
│                                                                             │
│  >[📜] View Full Logs    [🔄] Refresh Stats                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sección Métricas (actualizado cada 5 segundos):**
*   `Container`: Estado del contenedor (`running`, `exited`, `restarting`).
*   `CPU`: Porcentaje de uso con barra visual ASCII.
*   `Memory`: Porcentaje y valores absolutos (usado / total) con barra visual.
*   `Network`: Download / Upload acumulado desde el inicio del contenedor.
*   `Disk I/O`: Velocidades de lectura/escritura.
*   Fuente: `docker stats --no-stream --format '{{json .}}'` vía SSH.

**Sección Logs (snapshot):**
*   Muestra las últimas 100 líneas de `docker logs --tail 100`.
*   Scroll con `↑` / `↓` si hay más contenido.
*   Formato: `[TIMESTAMP] MESSAGE`.

**Acciones:**
*   `📜 View Full Logs`: Cambia a modo **Logs Streaming** (ver abajo).
*   `🔄 Refresh Stats`: Fuerza actualización inmediata de métricas.

**Navegación:**
*   `↑` / `↓`: Scroll de logs (si hay más contenido) o navegar entre botones.
*   `TAB`: Cambiar foco entre área de logs y botones de acción.
*   `ESC`: Volver al sub-menú.

###### Modo Logs Streaming

Al presionar `📜 View Full Logs`, el panel derecho entra en modo fullscreen de logs:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📜 Live Logs - main                                    [Q] Quit Streaming  │
│  ─────────────────                                                                      │
│  [2024-01-15 14:32:01] Server started on port 16261                                     │
│  [2024-01-15 14:32:05] RCON port opened on 27015                                        │
│  [2024-01-15 14:35:22] User Survivor123 connected                                       │
│  ...                                                                                    │
│  [2024-01-15 14:36:01] Zombie spawn cycle completed                                     │
│  [2024-01-15 14:36:15] User MikeZomb connected                                          │
│                                                                                         │
│  (Auto-scroll active. Press Q to exit)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   Stream en tiempo real vía SSH `docker logs -f`.
*   Auto-scroll activo: siempre muestra la última línea.
*   `↑` / `↓`: Desactiva auto-scroll y permite navegar por el historial. `G` vuelve al final.
*   `Q`: Salir del modo streaming y volver a la vista de Stats.
*   `ESC`: También sale del modo streaming.

---

##### Panel Derecho: Basic Settings

Configuración básica del servidor. Estos valores se inyectan como **variables de entorno** en el `docker-compose.yml` y son procesadas por la imagen Docker en cada arranque del contenedor (`entry.sh` usa `sed` para parchear el INI).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Basic Settings                                         ⚠️ 2 changes queued │
│  ─────────────                                                              │
│  >[🏷] Server Name (ID):   pzserver           🔄 Restart Required           │
│  [📝] Public Name:         My Zomboid Server                                │
│  [📄] Description:         A friendly PvE server for survivors              │
│  [🔒] Server Password:     [hidden]                                         │
│  [🌐] Public Listing:      [✅] Yes                                         │
│                                                                             │
│  [➕] Queue Changes     [Ctrl+A] Apply All (3)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Campos editables:**
*   `Server Name (ID)` / `SERVERNAME`: Identificador interno del servidor. **Sin espacios ni caracteres especiales** (solo alfanumérico y guiones bajos). Determina los nombres de los archivos de configuración generados (`${SERVERNAME}.ini`, `${SERVERNAME}_SandboxVars.lua`, `${SERVERNAME}_spawnregions.lua`). **Cambiar este valor crea un servidor nuevo con datos frescos**.
*   `Public Name` / `DISPLAYNAME`: Nombre visible públicamente en el server browser (`PublicName` en INI). Máx 64 chars.
*   `Description` / `PublicDescription`: Descripción corta. Máx 256 chars. **Nota:** La imagen Docker no soporta `DESCRIPTION` como env var; este campo edita directamente el archivo `${SERVERNAME}.ini` vía SFTP (línea `PublicDescription=`).
*   `Server Password` / `PASSWORD`: Contraseña para unirse. Muestra `[hidden]`.
*   `Public Listing` / `PUBLIC`: Toggle `Yes`/`No` para visibilidad en el browser del juego.

**Comportamiento de edición:**
*   Navegar entre campos/botón con `↑` / `↓`.
*   `ENTER` en un campo: Entrar en modo edición (el campo se resalta y permite tipear).
*   En modo edición: Tipear normalmente, `BACKSPACE` para borrar, `ENTER` para confirmar, `ESC` para cancelar cambios del campo actual.
*   `TAB`: Cambiar foco entre panel izquierdo y panel derecho.

**Acciones:**
*   `➕ Queue Changes`: Añade todos los cambios realizados en este panel al **buffer global de cambios pendientes**. Muestra toast: `✅ 2 changes queued for Basic Settings`.
*   `Ctrl+A` (global): Abre el modal **Resumen de Cambios Pendientes** (ver sección "Sistema Global de Cambios Pendientes").

**🔄 Restart Required:**
*   **TODOS los campos de este panel requieren reinicio del contenedor** para aplicarse, porque la imagen Docker solo procesa env vars y parchea INI en el `entry.sh` al arrancar.
*   Después de `Queue Changes`, el banner `🔄 Restart Required` aparece en rojo junto a los campos modificados.

**Validaciones:**
*   `Server Name`: Requerido, mínimo 3 chars, máximo 32 chars, **solo `[a-zA-Z0-9_]`**, sin espacios.
*   `Public Name`: Requerido, máximo 64 caracteres.
*   `Description`: Opcional, máximo 256 caracteres.
*   `Server Password`: Opcional, mínimo 4 caracteres si se provee.

**Dirty State y Modales:**
*   Si el usuario modifica campos y presiona `ESC` o cambia de opción en el sub-menú **sin** presionar `Queue Changes`, se muestra: *"Tienes cambios sin guardar. ¿Añadir al buffer de cambios pendientes o descartar?"* — `[Añadir al buffer]` / `[Descartar]`.
*   Los cambios no se aplican hasta que el usuario presione `Ctrl+A` y confirme en el resumen global.

**Persistencia (tras Apply):**
*   `Server Name`, `Public Name`, `Server Password`, `Public Listing`: Se actualizan en el `docker-compose.yml` generado y se aplican con `docker compose up -d` durante el pipeline global.
*   `Description`: Se edita directamente en `${SERVERNAME}.ini` vía SFTP (línea `PublicDescription=`).

---

##### Panel Derecho: Advanced Settings (BYOC - Bring Your Own Config)

Gestión avanzada de archivos de configuración `.ini` y `.lua`. La imagen Docker `Danixu/project-zomboid-server-docker` genera archivos con el prefijo `${SERVERNAME}` en `/home/steam/Zomboid/Server/` (volumen mapeado desde `/opt/zomboid/data` en la VM). Este panel permite **editar inline** o **reemplazar** estos archivos.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Advanced Settings (BYOC)                    Server: pzserver               │
│  ─────────────────────────                                                  │
│  Config Files:                                                              │
│  ─────────────                                                              │
│  >[📄] pzserver.ini            (last modified: 2024-01-15 10:30)            │
│   [📄] pzserver_SandboxVars.lua (last modified: 2024-01-10 18:45)           │
│   [📄] pzserver_spawnregions.lua(not uploaded yet)                          │
│                                                                             │
│  [➕] Add Custom File                                                       │
│                                                                             │
│  ℹ️  Mods: Set WORKSHOP_IDS and MOD_IDS in docker-compose env vars.        │
│     Or edit WorkshopItems/Mods directly in the .ini editor below.           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Archivos predefinidos:**
El prefijo `pzserver` se deriva del valor de `SERVERNAME` configurado en Basic Settings. Si el usuario cambia `SERVERNAME`, los nombres de archivo esperados cambian automáticamente.

| Archivo | Ruta en contenedor | Descripción |
|---------|-------------------|-------------|
| `${SERVERNAME}.ini` | `/home/steam/Zomboid/Server/${SERVERNAME}.ini` | Configuración principal del servidor (puertos, nombre público, RCON, whitelist, etc.) |
| `${SERVERNAME}_SandboxVars.lua` | `/home/steam/Zomboid/Server/${SERVERNAME}_SandboxVars.lua` | Variables del mundo (dificultad, loot, zombis, vehículos) |
| `${SERVERNAME}_spawnregions.lua` | `/home/steam/Zomboid/Server/${SERVERNAME}_spawnregions.lua` | Regiones de spawn disponibles para los jugadores |

**Acciones por archivo:**
*   `ENTER` en un archivo: Abre el **menú de acciones** para ese archivo:
    *   `[✏️] Edit Inline`: Abre un **editor de texto inline** en la TUI para modificar el archivo directamente.
    *   `[🔄] Replace File`: Abre el **File Picker multiplataforma** nativo para seleccionar un archivo local que reemplazará el existente.
    *   `[📥] Download`: Descarga el archivo actual desde el servidor a la máquina local vía SFTP.

###### Editor Inline

Al seleccionar `Edit Inline`, el panel derecho se transforma en un editor de texto:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✏️ Editing: pzserver.ini                          [Ctrl+S] Save  [ESC] Exit│
│  ────────────────────────────────────────────────────────────────────────── │
│  1  │ PVP=true                                                               │
│  2  │ PauseEmpty=true                                                        │
│  3  │ PublicName=My PZ Server                                                │
│  4  │ MaxPlayers=32                                                          │
│  5  │ >RCONPassword=secret123                                                │
│  ...                                                                        │
│                                                                             │
│  Line 5, Col 14                                      🔄 Restart Required    │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Navegación:** Flechas para mover cursor. `HOME`/`END` para inicio/fin de línea. `PGUP`/`PGDN` para scroll.
*   **Edición:** Tipear normalmente. `BACKSPACE`/`DELETE` para borrar. `ENTER` para nueva línea.
*   **Guardar:** `Ctrl+S` guarda el archivo vía SFTP al servidor remoto.
*   **Salir:** `ESC` pregunta *"¿Salir sin guardar?"* si hay cambios pendientes.
*   **Búsqueda:** `Ctrl+F` abre búsqueda dentro del archivo.

**🔄 Restart Required:**
*   **Cualquier cambio en archivos `.ini` o `.lua` requiere reinicio del contenedor** para que el servidor de Project Zomboid los relea.
*   Banner rojo `🔄 Restart Required` aparece tras guardar cualquier archivo si el servidor está `RUNNING`.

###### Reemplazar Archivo (Replace File)

*   Abre el File Picker nativo para seleccionar un archivo local.
*   **Validación de nombre:** El archivo seleccionado debe renombrarse al nombre esperado por la imagen Docker (`${SERVERNAME}.ini`, `${SERVERNAME}_SandboxVars.lua`, o `${SERVERNAME}_spawnregions.lua`).
*   Si el usuario selecciona un archivo con nombre diferente, la TUI pregunta: *"Renombrar a [nombre_esperado] al subir?"* — `[Cancelar]` / `[Renombrar y subir]`.
*   Transferencia vía SFTP al volumen en la VM (`/opt/zomboid/data/Server/`).
*   Progreso visual: `[████████░░] 80% Uploading...`

**Nota sobre Mods y Workshop:**
*   **Opción A (Recomendada MVP):** Configurar `WORKSHOP_IDS` y `MOD_IDS` como variables de entorno en el `docker-compose.yml` (gestionado desde Basic Settings o editando el compose directamente).
*   **Opción B (BYOC):** Editar inline las líneas `WorkshopItems=` y `Mods=` en el archivo `${SERVERNAME}.ini`. La imagen Docker puede auto-gestionar estas entradas si `SELF_MANAGED_MODS=false` (default), pero modificarlas manualmente en el INI también funcaja tras reinicio.
*   B42 requiere formato especial para `MOD_IDS`: prefijo `\\` antes de cada ID (ej: `\\mod1;\\mod2`).

**Navegación (lista de archivos):**
*   `↑` / `↓`: Navegar entre archivos y botón `Add Custom File`.
*   `ENTER`: Abrir menú de acciones del archivo.
*   `TAB`: Cambiar foco al panel izquierdo.
*   `ESC`: Volver al sub-menú.

---

##### Panel Derecho: Admins

Gestión de credenciales de administrador del servidor. Estos valores se inyectan como **variables de entorno** (`ADMINUSERNAME`, `ADMINPASSWORD`) en el `docker-compose.yml` y son procesadas por la imagen Docker en cada arranque.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Admins                                           ⚠️ 1 change queued        │
│  ─────                                                                      │
│  >[👤] Admin Username:     admin               🔄 Restart Required          │
│  [🔑] Admin Password:      [hidden]                                         │
│                                                                             │
│  [➕] Queue Changes     [Ctrl+A] Apply All (3)                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Campos editables:**
*   `Admin Username` / `ADMINUSERNAME`: Nombre de usuario con privilegios de administrador. La imagen Docker usa este valor para parchear el INI en cada arranque.
*   `Admin Password` / `ADMINPASSWORD`: Contraseña del admin. Muestra `[hidden]`. Al editar, input enmascarado.
    *   **Nota de seguridad:** En el primer arranque del contenedor, esta contraseña se pasa como argumento de línea de comandos y puede aparecer en logs. Tras el primer start exitoso, la contraseña queda guardada en el INI y puede eliminarse del `docker-compose.yml`.

**Comportamiento:**
*   Igual patrón de edición que Basic Settings: `ENTER` para editar, tipear, `ENTER` para confirmar, `ESC` para cancelar cambios del campo actual.
*   `TAB`: Cambiar foco entre panel izquierdo y panel derecho.

**Acciones:**
*   `➕ Queue Changes`: Añade los cambios de este panel al buffer global.
*   `Ctrl+A` (global): Abre el Resumen de Cambios Pendientes.

**Validaciones:**
*   `Admin Username`: Requerido, mínimo 3 caracteres, solo alfanumérico y guiones bajos.
*   `Admin Password`: Requerido, mínimo 6 caracteres.

**🔄 Restart Required:**
*   **Ambos campos requieren reinicio del contenedor** para aplicarse.
*   Banner rojo `🔄 Restart Required` aparece tras `Queue Changes` si el servidor está `RUNNING`.

**Dirty State:**
*   Si el usuario modifica campos y presiona `ESC` sin `Queue Changes`: *"Tienes cambios sin guardar. ¿Añadir al buffer o descartar?"* — `[Añadir al buffer]` / `[Descartar]`.

**Persistencia (tras Apply):**
*   Se actualizan en el `docker-compose.yml` generado y se aplican durante el pipeline global.
*   La imagen Docker parchea el archivo `${SERVERNAME}.ini` automáticamente al arrancar.

---

##### Panel Derecho: Scheduler

Configuración de tareas programadas (Cron) en la VM remota vía SSH.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Scheduler                                                                  │
│  ─────────                                                                  │
│  Scheduled Tasks:                                                           │
│  ───────────────                                                            │
│  >[✅] Auto-Restart    │ Every day at 04:00    │ Enabled                   │
│   [❌] Auto-Backup     │ Not configured        │ Disabled                  │
│   [✅] Broadcast Msg   │ Every hour            │ Enabled                   │
│                                                                             │
│  [➕] Add New Task                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Tipos de tareas:**
1.  **Auto-Restart**: `docker compose restart` en horario programado.
2.  **Auto-Backup**: Comprime volumen y lo deja disponible para descarga.
3.  **Broadcast RCON**: Envía mensaje `servermsg` programado.

**Vista de lista:**
*   Cada tarea muestra: tipo, expresión cron legible (ej. "Every day at 04:00"), estado (`Enabled`/`Disabled`).
*   `✅` / `❌` indica si está activa.

**Acciones por tarea:**
*   `ENTER` en una tarea: Entrar a **vista de edición** de esa tarea.

**Vista de Edición de Tarea:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Edit Task: Auto-Restart                                                    │
│  ───────────────────────                                                    │
│  Type:        Auto-Restart                                                  │
│  Schedule:    0 4 * * *                                                     │
│  (Every day at 04:00 AM)                                                    │
│  Enabled:     [✅] Yes    [ ] No                                            │
│                                                                             │
│  >[💾] Save Task    [🗑] Delete Task                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   `Schedule`: Expresión cron editable. Al tipear, muestra preview legible debajo (ej. "Every day at 04:00 AM").
*   `Enabled`: Toggle Yes/No con `←` / `→`.
*   Para **Broadcast**: Campo adicional `Message` para el texto del `servermsg`.

**Navegación:**
*   Lista: `↑` / `↓` entre tareas, `ENTER` para editar, `➕` para crear nueva.
*   Edición: `↑` / `↓` entre campos, `ENTER` para confirmar campo, `←` / `→` para toggles (Enabled).
*   `TAB`: Cambiar foco entre panel izquierdo y panel derecho.
*   `ESC`: Si hay cambios sin guardar en edición, muestra modal *"Tienes cambios sin guardar. ¿Salir sin guardar?"*. Si está en lista, vuelve al sub-menú.

**Persistencia:**
*   Las tareas se instalan en el crontab de la VM vía SSH inmediatamente al guardar.
*   Se guardan en la tabla `scheduled_tasks` de SQLite.
*   Las tareas de Scheduler no requieren reinicio del servidor.

---

##### Panel Derecho: Backups

Historial de backups del servidor y operaciones de restore.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Backups                                                                    │
│  ──────                                                                     │
│  Backup Location:  ~/.zomboid-cli/backups/main/                             │
│                                                                             │
│  Backup History:                                                            │
│  ───────────────                                                            │
│  DATE                │ SIZE    │ TYPE        │ STATUS    │ ACTIONS         │
│  ────────────────────────────────────────────────────────────────────────── │
│  > 2024-01-15 14:32  │ 1.2 GB  │ Manual      │ ✅ Valid  │ [🔄] [🗑]       │
│   2024-01-14 04:00  │ 1.1 GB  │ Scheduled   │ ✅ Valid  │ [🔄] [🗑]       │
│   2024-01-10 18:45  │ 1.0 GB  │ Pre-update  │ ✅ Valid  │ [🔄] [🗑]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Información mostrada:**
*   `Backup Location`: Ruta local donde se almacenan los backups de este servidor.
*   Tabla de historial con columnas: `DATE`, `SIZE`, `TYPE` (`Manual`, `Scheduled`, `Pre-update`, `Pre-archive`), `STATUS` (`Valid`, `Corrupted`, `Missing`).

**Acciones por backup:**
*   `🔄 Restore`: Restaura este backup al servidor. **Modal destructivo**: *"Restaurar este backup reemplazará los datos actuales del servidor. Los jugadores conectados serán desconectados. ¿Continuar?"* — `[Cancelar]` (default) / `[Restaurar]`.
    *   Si servidor está `RUNNING`: Modal adicional: *"El servidor debe apagarse para restaurar. ¿Apagar y restaurar ahora?"* — `[Cancelar]` / `[Apagar y restaurar]`.
    *   Proceso: RCON save → RCON quit → stop container → extraer backup → start container.
*   `🗑 Delete`: Elimina el archivo backup local. **Modal**: *"¿Eliminar permanentemente el backup de [date] ([size])? Esta acción no se puede deshacer."* — `[Cancelar]` (default) / `[Eliminar]`.

**Acciones globales:**
*   `[💾] Create Backup Now`: Fuerza un backup manual inmediato.
*   Muestra progreso en tiempo real: `[████████░░] Compressing... 80%`

**Navegación:**
*   `↑` / `↓`: Navegar entre backups.
*   `←` / `→`: Navegar entre acciones de la fila.
*   `ENTER`: Ejecutar acción.
*   `TAB`: Cambiar foco entre tabla y botón `Create Backup Now`.
*   `ESC`: Volver al sub-menú.

**Estado vacío:**
*   Si no hay backups: *"No backups found. Create your first backup with 'Create Backup Now'."*

##### Panel Derecho: Configuración Global (Global Settings)
Cuando el usuario selecciona **"Configuración Global"** en el menú izquierdo, el panel derecho muestra una lista de opciones configurables. Cada opción es un ítem interactivo que, al recibir foco y presionar `ENTER`, expande o activa su modo de edición.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Global Settings                                                            │
│  ───────────────                                                            │
│  >[🌐] Language: Español (ES)                                               │
│  [🎨] Theme: Default Dark                                                   │
│  [💾] Backup Path: ~/.zomboid-cli/backups                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Opciones de Configuración:**

1.  **Language / Idioma (`🌐`)**
    *   **Descripción:** Selección del idioma de la interfaz.
    *   **MVP:** Soporta `English (EN)` y `Español (ES)`.
    *   **Comportamiento:** Al hacer `ENTER` sobre esta opción, se despliega una sub-lista o dropdown con los idiomas disponibles. Navegar con `↑↓` y `ENTER` para confirmar. El cambio se aplica inmediatamente a toda la interfaz.
    *   **Persistencia:** Guardado en la tabla `settings` de SQLite (`key: 'locale'`).
    *   **Extensibilidad:** La estructura debe soportar añadir más idiomas en el futuro sin modificar la UI (solo añadiendo archivos de locale).

2.  **Theme / Tema (`🎨`)**
    *   **Descripción:** Selección del tema de colores de la TUI.
    *   **MVP:** Un único tema disponible: `Default Dark`.
    *   **Comportamiento:** Al hacer `ENTER`, se despliega una lista de temas disponibles. Cada tema muestra un preview visual (nombre + paleta de colores reducida). Navegar con `↑↓` y `ENTER` para seleccionar. El cambio se aplica inmediatamente.
    *   **Persistencia:** Guardado en la tabla `settings` de SQLite (`key: 'theme'`).
    *   **Extensibilidad:** La arquitectura de temas debe permitir definir nuevos temas como objetos de configuración (colores primario, secundario, fondo, éxito, warning, error, foco, texto). Cada tema es un archivo JSON en `src/themes/`. El selector lee todos los archivos de esa carpeta dinámicamente.

3.  **Backup Path / Ruta de Backups (`💾`)**
    *   **Descripción:** Ruta local donde se almacenarán los backups de los servidores.
    *   **MVP:** Muestra la ruta actual (default: `~/.zomboid-cli/backups`).
    *   **Comportamiento:** Al hacer `ENTER`, la TUI invoca el **File Picker multiplataforma** nativo (ver sección 3) para que el usuario seleccione una carpeta. La ruta seleccionada se muestra actualizada en el panel. Si el usuario cancela el diálogo, se mantiene la ruta anterior.
    *   **Validación:** La ruta debe ser válida y tener permisos de escritura. Si no es válida, mostrar error en rojo debajo del ítem.
    *   **Persistencia:** Guardado en la tabla `settings` de SQLite (`key: 'backup_path'`).
    *   **Nota:** En la UI se muestra la ruta resuelta (sin `~`), pero se almacena tal cual la ingresa el usuario.

**Navegación dentro del Panel de Configuración:**
*   `↑` / `↓`: Navegar entre las 3 opciones.
*   `ENTER`: Entrar en modo de edición de la opción seleccionada (desplegar sub-lista o abrir file picker).
*   `TAB`: Cambiar foco entre panel izquierdo y panel derecho.
*   `ESC`: Salir del modo de edición (si está en un sub-menú) o cambiar foco al panel izquierdo.
*   Los cambios se aplican y guardan inmediatamente al confirmar, sin necesidad de un botón "Save".

##### Panel Derecho: Servidores Archivados (Archived Servers)
Cuando el usuario selecciona **"Servidores Archivados"** en el menú izquierdo, el panel derecho muestra una tabla con todos los servidores cuyo `status = 'archived'` en SQLite.

###### Vista de Lista (Tabla Resumen)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Archived Servers                                                           │
│  ───────────────                                                            │
│  NAME   │ PROVIDER │ ARCHIVED ON      │ BACKUP SIZE │ STATUS    │ ACTIONS   │
│  ───────────────────────────────────────────────────────────────────────────│
│  main   │ GCP      │ 2024-01-15 14:32 │ 1.2 GB      │ 📦 SAVED  │ restore   │
│  PvP    │ GCP      │ 2024-02-01 09:15 │ 890 MB      │ 📦 SAVED  │ restore   │
│  dev    │ GCP      │ 2024-03-10 22:01 │ 2.1 GB      │ ⚠️ MISSING│ delete    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Columnas de la tabla:**

| Columna | Descripción |
|---------|-------------|
| `NAME` | Identificador del servidor archivado (ej. `main`, `PvP`, `dev`). |
| `PROVIDER` | Cloud provider (`GCP`, `AWS`, `Azure`). |
| `ARCHIVED ON` | Fecha de archivado (`updated_at` cuando pasó a `status='archived'`). Formato localizado según `locale`. |
| `BACKUP SIZE` | Tamaño del archivo backup en disco, persistido en la DB al momento del archivado. |
| `STATUS` | Estado del backup local: `📦 SAVED` (verde, el archivo existe en `backup_path`) o `⚠️ MISSING` (amarillo/rojo, el archivo fue movido/eliminado externamente). |
| `ACTIONS` | Acciones disponibles para ese servidor: `restore` (cian/azul) o `delete` (rojo). |

###### Vista de Detalle (al presionar ENTER en un servidor)

Cuando el usuario navega a un servidor con `↑↓` y presiona `ENTER`, el panel derecho cambia a una vista de detalle que ocupa todo el panel:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📦 Server: main                                    [↑↓] Navigate  [ESC] Back│
│  ─────────────────                                                                  │
│  Provider:        GCP                                                               │
│  Project ID:      my-project-123456                                                 │
│  Instance Type:   e2-standard-2                                                     │
│  Zone:            us-central1-a                                                     │
│  Static IP:       34.120.45.67 (released)                                           │
│  Game Branch:     stable                                                            │
│  Created:         2023-11-01 10:00                                                  │
│  Archived:        2024-01-15 14:32                                                  │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  Backup Path:     ~/.zomboid-cli/backups/main/main-20240115-143200.tar.gz           │
│  Backup Size:     1.2 GB                                                            │
│  Backup Status:   ✅ Valid                                                          │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  >[🔄] Restore Server    [🗑] Delete Record                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Campos mostrados en detalle:**
*   `Provider`, `Project ID`, `Instance Type`, `Zone`
*   `Static IP`: Muestra la IP que tenía, con nota `(released)` porque la infraestructura fue destruida.
*   `Game Branch`: Rama SteamCMD que usaba.
*   Timestamps: `Created` y `Archived`.
*   **Sección de Backup**: Path completo, tamaño persistido en DB, y estado de validación en tiempo real (si el archivo existe y es legible).

**Acciones en vista de detalle:**
*   `🔄 Restore Server`: Iniciará el flujo de restauración (definido en sección posterior).
*   `🗑 Delete Record`: Elimina el registro de SQLite Y el archivo backup local. **Requiere confirmación explícita** con modal: *"¿Eliminar permanentemente el registro y el backup de [name]? Esta acción no se puede deshacer."*

###### Acciones Disponibles

**Restore Server (Restaurar)**
*   Inicia un wizard simplificado de restauración (flujo detallado en sección posterior, tras definir dependencias de paneles).
*   Mientras se ejecuta, el panel derecho muestra un log en tiempo real del progreso.

**Delete Record (Eliminar Registro)**
1.  Modal de confirmación: *"¿Eliminar permanentemente el registro de '[name]' y su backup local ([size])? Esta acción NO se puede deshacer."*
2.  Opciones: `[Cancelar]` (default, seleccionado) / `[Eliminar]`.
3.  Si confirma:
    *   Elimina el archivo de `backup_path`.
    *   Elimina el registro de la tabla `servers`.
    *   Vuelve a la lista de archivados.

###### Navegación y Comportamiento

| Tecla | Acción |
|-------|--------|
| `↑` / `↓` | Navegar entre servidores en la tabla de lista. |
| `TAB` | Cambiar foco entre panel izquierdo (menú) y panel derecho (tabla). |
| `ENTER` (en lista) | Entrar a la **vista de detalle** del servidor seleccionado. |
| `ENTER` (en detalle) | Ejecutar la acción enfocada (`restore` o `delete`). |
| `ESC` (en detalle) | Volver a la **lista de archivados**. |
| `ESC` (en lista) | Volver al menú principal (foco al panel izquierdo). |

###### Estado Vacío

Si no hay servidores archivados:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Archived Servers                                                           │
│  ───────────────                                                            │
│                                                                             │
│         📦 No archived servers found.                                       │
│                                                                             │
│         Servers will appear here after you archive them from                │
│         "Active Servers". Archiving creates a local backup and              │
│         destroys the cloud infrastructure.                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.3 Setup Wizard: Crear Nuevo Servidor (Flujo)

El Setup Wizard es un flujo de creación de servidor que **reutiliza el layout principal 35/65** del dashboard. El usuario selecciona `"1. Crear Nuevo Servidor"` desde el Menú Global y la interfaz transiciona al wizard, manteniendo la misma estructura visual (Header, System Status, paneles, Footer) para coherencia.

**Diferencias visuales respecto al Dashboard:**
*   El título del `ink-titled-box` izquierdo cambia de `"Menu"` a `"Setup Wizard"`.
*   El título del `ink-titled-box` derecho cambia según el paso activo.
*   El footer muestra atajos contextualizados para wizard (`[ENTER] Continue`, `[ESC] Cancel`).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         [ZOMBOID-CLI ASCII ART]                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  System Status  ┌───────────────────────────────────────────────────────┐   │
│                 │ v1.2.3 | Step 3 of 6 | Creating: pz-server-01        │   │
│                 └───────────────────────────────────────────────────────┘   │
├─────────────────┬───────────────────────────────────────────────────────────┤
│  Setup Wizard   │  Server Name                                              │
│  ────────────   │  ───────────                                              │
│  ✓ 1. Provider  │                                                           │
│  ✓ 2. Project   │  Enter a unique name for your server.                     │
│  > 3. Name      │  This will be the server ID and world save name.          │
│    4. Region    │                                                           │
│    5. Instance  │  Server Name (ID):                                        │
│    6. Deploy    │  >[pz-server-01]                                          │
│                 │                                                           │
│                 │  ⚠️  Name cannot contain spaces or special characters.    │
│                 │                                                           │
│                 │  [🚀 Continue]  [← Back]                                  │
├─────────────────┴───────────────────────────────────────────────────────────┤
│ [ESC] Cancel  [↑↓] Navigate  [TAB] Switch Panel  [ENTER] Continue           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Estructura del Panel Izquierdo (Wizard Steps):**
*   Lista numerada de 6 pasos. Cada paso completado muestra `✓` en verde.
*   El paso actual muestra `>` con fondo resaltado cian.
*   Pasos futuros muestran `○` en gris (no navegables hasta completar los anteriores).
*   `↑` / `↓` navegan entre pasos **completados** y el paso actual. No se puede saltar a pasos futuros.
*   `ENTER` en un paso completado permite **revisar/editar** ese paso (navegación bidireccional).

**Estructura del Panel Derecho (Wizard Content):**
*   Renderiza el contenido específico del paso activo.
*   Cuando el foco está en el panel izquierdo, el panel derecho se muestra en modo "preview" (no interactivo).
*   `TAB` cambia el foco al panel derecho para interactuar con los controles del paso.

**Navegación General del Wizard:**
*   `TAB`: Cambiar foco entre panel izquierdo (steps) y panel derecho (contenido).
*   `↑` / `↓`: En panel izquierdo, navegar entre pasos completados + actual. En panel derecho, navegar verticalmente entre controles.
*   `ENTER`: En panel izquierdo, entrar al paso seleccionado. En panel derecho, confirmar/continuar.
*   `ESC`: **Cancelar wizard**. Muestra modal: *"¿Cancelar la creación del servidor? Los cambios se perderán."* — `[No, seguir editando]` (default) / `[Sí, cancelar]`.
*   `←` / `→`: En panel derecho, navegar horizontalmente entre botones cuando aplique.

---

##### Paso 1: Select Provider

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Select Provider                                                            │
│  ──────────────                                                             │
│  Choose your cloud provider. Only GCP is available in the MVP.              │
│                                                                             │
│  >[☁] GCP                    Active, fully supported                        │
│   [☁] AWS (Coming Soon)      Disabled — will be available in a future update│
│   [☁] Azure (Coming Soon)    Disabled — will be available in a future update│
│                                                                             │
│  >[🚀 Continue]  [← Back]                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **GCP**: Seleccionable (default, única opción activa en MVP).
*   **AWS / Azure**: Visualmente deshabilitadas (gris, sin foco), con label "Coming Soon".
*   Navegación: `↑` / `↓` entre proveedores. `ENTER` selecciona GCP y avanza automáticamente al Paso 2.
*   `[🚀 Continue]` avanza al Paso 2. `[← Back]` vuelve al Menú Global (equivale a `ESC`).

---

##### Paso 2: Authenticate & Select Project

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Authenticate & Project                                                     │
│  ──────────────────────                                                     │
│                                                                             │
│  Step 2a: GCP Authentication                                                │
│  ─────────────────────────                                                  │
│  >[🔑 Check Auth]  Check if gcloud CLI is authenticated                     │
│                                                                             │
│  Step 2b: Select Project                                                    │
│  ─────────────────────                                                      │
│  Available Projects:                                                        │
│  >[▶] my-gcp-project-123456    (ID: my-gcp-project-123456)                 │
│   [▶] zomboid-servers-prod   (ID: zomboid-servers-prod)                    │
│   [▶] personal-dev-2024      (ID: personal-dev-2024)                       │
│                                                                             │
│  >[🚀 Continue]  [← Back]  [🔑 Re-check Auth]                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Step 2a: Authentication Check**
*   Al entrar al paso, la CLI verifica:
    1.  Si `gcloud` CLI está instalado (`gcloud --version`).
    2.  Si `gcloud` está autenticado (`gcloud auth list --filter=status:ACTIVE`).
    3.  Si Application Default Credentials (ADC) están configurados (`gcloud auth application-default print-access-token`).
*   Si NO está instalado `gcloud`:
    *   Muestra: *"🔴 gcloud CLI no encontrado. Es necesario para autenticarse con Google Cloud."*
    *   Instrucciones de instalación por SO + enlace a https://cloud.google.com/sdk/docs/install
    *   Bloquea el resto del paso.
*   Si NO está autenticado:
    *   Muestra: *"🔴 No autenticado. Presiona [Enter] para iniciar login."*
    *   Al presionar `[🔑 Check Auth]`, ejecuta `gcloud auth login --brief` (abre browser).
    *   Luego ejecuta `gcloud auth application-default login` (genera credenciales para Pulumi).
    *   Bloquea el resto del paso hasta completar ambos pasos.
*   Si está autenticado:
    *   Muestra: *"🟢 Autenticado como: user@example.com | ADC: ✅"*
    *   Activa la sección de selección de proyecto.

**Step 2b: Project Selection**
*   Lista de proyectos GCP disponibles obtenidos vía `gcloud projects list --format="value(projectId,name)"`.
*   `↑` / `↓` para navegar. `ENTER` selecciona.
*   Proyecto seleccionado queda marcado con `✓`.

**System Check (automático, no interactivo):**
*   Tras seleccionar proyecto, la CLI habilita silenciosamente las APIs requeridas: `compute.googleapis.com`.
*   Muestra spinner: *"Enabling required APIs..."* → *"✅ APIs ready"*.
*   Si falla la habilitación de APIs, muestra error descriptivo y opción de reintentar.

> **Nota arquitectónica:** Pulumi y otras herramientas (Terraform) usan el mecanismo de Application Default Credentials (ADC) de Google Cloud. Una vez configurado con `gcloud auth application-default login`, Pulumi automáticamente detecta las credenciales sin configuración adicional. No se usan Service Account keys (anti-pattern de seguridad).

**Navegación:**
*   `↑` / `↓`: Navegar entre `Check Auth`, lista de proyectos, y botones de acción.
*   `ENTER`: Ejecutar acción enfocada.
*   `[🚀 Continue]`: Avanza al Paso 3 (deshabilitado hasta tener proyecto seleccionado).
*   `[← Back]`: Vuelve al Paso 1.

---

##### Paso 3: Server Name

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Server Name                                                                │
│  ──────────                                                                 │
│                                                                             │
│  Enter a unique name for your server.                                       │
│  This will be the server ID and world save name.                            │
│                                                                             │
│  Server Name (ID):                                                          │
│  >[pz-server-01]                                                            │
│                                                                             │
│  ℹ️  Rules: No spaces, no special chars, max 32 chars.                      │
│      Example: "my-pz-server", "pvp-west-01"                                 │
│                                                                             │
│  >[🚀 Continue]  [← Back]                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Input:** Campo de texto editable. `ENTER` activa edición (cursor parpadeante). Escribir con teclado. `ENTER` para confirmar input. `ESC` para cancelar edición.
*   **Validación en tiempo real:**
    *   Si contiene espacios: `❌ Spaces not allowed`
    *   Si contiene caracteres especiales (solo `[a-zA-Z0-9_-]` permitidos): `❌ Only letters, numbers, hyphens and underscores`
    *   Si > 32 caracteres: `❌ Max 32 characters`
    *   Si ya existe un servidor con ese nombre en SQLite: `❌ Name already in use`
    *   Válido: `✅ Name available`
*   `[🚀 Continue]`: Avanza al Paso 4 (deshabilitado hasta nombre válido).
*   `[← Back]`: Vuelve al Paso 2.

---

##### Paso 4: Select Region

El panel derecho muestra el **mismo sub-panel de selección de región** usado en Provider & Region (sección 2.2), pero adaptado al contexto de wizard:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Select Region                                    [ESC] Back  [TAB] Panel   │
│  ─────────────                                                              │
│  Select the closest region for optimal latency. Regions sorted by ping.     │
│                                                                             │
│  > americas                                                                 │
│    us-central1-a        │ Iowa        │ 45ms   │ [Select]                  │
│    us-east1-b           │ S. Carolina │ 52ms   │ [Select]                  │
│    us-west1-a           │ Oregon      │ 78ms   │ [Select]                  │
│                                                                             │
│  europe                                                                     │
│    europe-west1-b       │ London      │ 110ms  │ [Select]                  │
│    europe-north1-a      │ Finland     │ 125ms  │ [Select]                  │
│                                                                             │
│  (Scroll ↓ for more regions — asia, oceania, middle east, africa)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Reutilización:** Este es exactamente el mismo componente/sub-panel que `Change Region` en Provider & Region. Mismo comportamiento de ping, agrupación por continente, scroll, y selección.
*   **Diferencia:** Aquí `ENTER` en `[Select]` marca la región como seleccionada (`✓`) y **avanza automáticamente al Paso 5** (no vuelve a un panel principal).
*   `ESC`: Vuelve al Paso 3 (Server Name).

---

##### Paso 5: Select Instance

El panel derecho muestra el **mismo sub-panel de selección de instancia** usado en Provider & Region (sección 2.2):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Select Instance                                  [ESC] Back  [TAB] Panel   │
│  ───────────────                                                            │
│  Curated Tiers (Recommended for Game Servers)                               │
│  ────────────────────────────────────────────────────────────────────────── │
│  >[⭐] n2d-standard-4  Balanced          4 vCPU │ 16GB RAM │ ~$0.17/hr       │
│   [💰] e2-standard-4   Budget            4 vCPU │ 16GB RAM │ ~$0.11/hr       │
│   [🚀] c2-standard-4   Performance       4 vCPU │ 16GB RAM │ ~$0.21/hr       │
│   [📈] n2d-standard-8  Growth            8 vCPU │ 32GB RAM │ ~$0.34/hr       │
│   [🔥] c2d-standard-8  Heavy/Modded      8 vCPU │ 32GB RAM │ ~$0.36/hr       │
│                                                                             │
│  ─── All Instance Types (Filtered for Game Servers) ───                     │
│                                                                             │
│  >[📁] Cost-Effective — E2 Series                                           │
│    [📁] Balanced — N2 Series (Intel)                                        │
│    [📁] Balanced — N2D Series (AMD)                                         │
│                                                                             │
│  (Press ENTER to expand a category)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Reutilización:** Exactamente el mismo componente que `Change Instance Type` en Provider & Region. Mismos tiers curados, categorías expandibles, navegación.
*   **Diferencia:** `ENTER` en una instancia la marca como seleccionada (`✓`) y **avanza automáticamente al Paso 6** (Review & Deploy).
*   **Aviso UX:** Texto en la parte superior: *"You can resize the server later without losing data."*
*   `ESC`: Vuelve al Paso 4 (Select Region).

---

##### Paso 6: Review & Deploy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Review & Deploy                                                            │
│  ──────────────                                                             │
│  Review your server configuration before deploying.                         │
│                                                                             │
│  Server Name:        pz-server-01                                           │
│  Provider:           GCP                                                    │
│  Project ID:         my-gcp-project-123456                                  │
│  Region:             us-central1-a (Iowa, 45ms)                             │
│  Instance:           n2d-standard-4 (4 vCPU, 16GB RAM)                      │
│  Est. Cost:          ~$0.17/hr (~$122/mo)                                   │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  ⚠️  This will create cloud infrastructure (VM, static IP, firewall).       │
│     Estimated deploy time: 3-5 minutes.                                     │
│                                                                             │
│  >[🚀 Deploy Server]  [← Back]                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Resumen:** Muestra todos los parámetros seleccionados en pasos anteriores. Cada parámetro es de solo lectura.
*   `[🚀 Deploy Server]`: Inicia el deploy. Muestra modal de confirmación:
    *   *"Deploying will create a VM and start billing. Continue?"* — `[Cancel]` (default) / `[Deploy]`.
*   `[← Back]`: Vuelve al Paso 5.
*   `ESC`: Vuelve al Paso 5.

**Deploy Progress (dentro del mismo panel derecho, reemplaza el review):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Deploying: pz-server-01                                         [ESC] Back │
│  ─────────────────────────                                                  │
│  [▓▓▓▓▓▓▓▓░░░░░░░░░░] 45%                                                  │
│                                                                             │
│  [12:34:05] Initializing Pulumi...                                       │
│  [12:34:06] Creating VM (n2d-standard-4) in us-central1-a...                │
│  [12:35:30] VM ready. Installing Docker via cloud-init...                   │
│  [12:36:15] Docker ready. Generating docker-compose.yml...                  │
│  [12:36:20] Starting container...                                           │
│  [12:37:05] Container started. Running health checks...                     │
│                                                                             │
│  IP: 34.120.45.67                                                           │
│  Status: ⚠️  Initializing                                                   │
│                                                                             │
│  >[Go to Server Dashboard]  [Back to Menu]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Progreso:** Barra de progreso + log en tiempo real de las fases del deploy.
*   **Fases técnicas:**
    1.  Generar stack Pulumi con configuración seleccionada.
    2.  `pulumi up` (crea VM, IP estática, firewall rules).
    3.  Cloud-init: instala Docker, crea directorios.
    4.  Subir `docker-compose.yml` vía SFTP.
    5.  `docker compose up -d`.
    6.  Health check: polling RCON hasta obtener respuesta (timeout: 5 minutos).
*   **Al completar:** Muestra IP pública y estado. Botones:
    *   `[Go to Server Dashboard]`: Entra directamente al Server Dashboard del servidor recién creado.
    *   `[Back to Menu]`: Vuelve al Menú Global con "Servidores Activos" seleccionado.
*   **Si falla:** Se registra `status: 'failed'` en SQLite con mensaje de error. Se muestra error descriptivo + opciones: `[Retry Deploy]`, `[Destroy & Clean Up]`, `[Back to Menu]`.
    *   **Cancelación durante deploy:** `ESC` muestra modal: *"Cancelar el deploy puede dejar recursos huérfanos en GCP. ¿Estás seguro?"* — `[No, seguir]` / `[Sí, cancelar y limpiar]`. Si confirma, ejecuta `pulumi destroy` para limpiar recursos parciales.

#### 2.4 Archive Flow
Archivar un servidor es una operación destructiva con backup obligatorio:
1.  Se genera un backup local del volumen completo (obligatorio, no cancelable). Se calcula el tamaño del archivo resultante.
  2.  Se ejecuta `pulumi destroy` para eliminar toda la infraestructura en GCP (VM, IP estática, firewall rules).
3.  El registro del servidor se mantiene en SQLite con `status: 'archived'`, incluyendo la ruta del backup, metadatos, y `backup_size` (tamaño en bytes del tarball).
4.  El servidor aparece en "Servidores Archivados" como registro de solo lectura.

#### 2.5 Restore Flow (Wizard)

Restaurar un servidor archivado recrea la infraestructura cloud a partir de un backup local y los metadatos persistidos en SQLite. Es un wizard de múltiples pasos que se ejecuta en el **panel derecho** de la vista de detalle del servidor archivado.

**Trigger:** El usuario presiona `ENTER` en `[🔄] Restore Server` desde la vista de detalle de un servidor archivado (ver sección "Archived Servers").

**Pasos del Wizard:**

**Paso 1: Confirmación de Restauración**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Restore Server: main                                                       │
│  ─────────────────────                                                      │
│  You are about to restore the archived server 'main' from backup.           │
│                                                                             │
│  Backup:    ~/.zomboid-cli/backups/main/main-20240115-143200.tar.gz         │
│  Size:      1.2 GB                                                          │
│  Created:   2024-01-15 14:32                                                │
│                                                                             │
│  ⚠️  This will create a new cloud VM and overwrite any existing server      │
│     with the same name in the same project.                                 │
│                                                                             │
│  >[Continue]  [Cancel]                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```
*   Muestra metadatos del backup (ruta, tamaño, fecha).
*   Advertencia si ya existe un servidor activo con el mismo `name` en la DB.
*   `[Continue]` avanza al Paso 2. `[Cancel]` (default, `ESC`) vuelve a la vista de detalle.

**Paso 2: Configuración de Restauración**
El usuario puede modificar los parámetros de infraestructura antes de restaurar. Todos los campos se precargan con los valores originales del servidor archivado.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Restore Configuration                                                      │
│  ─────────────────────                                                      │
│                                                                             │
│  Server Name (ID):   main                                                   │
│  ⚠️  Changing this creates a NEW server world. Original preserved.          │
│                                                                             │
│  Provider:           GCP                                                    │
│  Project ID:         my-project-123456                                      │
│                                                                             │
│  Region & Zone:      us-central1-a   [🌍 Change Region]                     │
│  Instance Type:      n2d-standard-4  [⚙ Change Instance]                    │
│  Game Branch:        stable          [🔧 Change Branch]                     │
│                                                                             │
│  Static IP:          🔄 New IP (original released)                          │
│                                                                             │
│  >[🚀 Restore Server]  [Cancel]                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

*   **Server Name (ID):** Precargado con `name` original. Editable. Si se cambia, se muestra advertencia: *"Changing SERVERNAME creates a new world. The original world data will be preserved in the backup but won't load automatically."*
*   **Provider & Project ID:** Heredados del servidor archivado. No editables en MVP (solo GCP).
*   **Region & Zone:** Precargado con `instance_zone` original. `[🌍 Change Region]` abre el **mismo sub-panel de selección de región** usado en Provider & Region (sección 2.2). Ping en tiempo real, ordenado por latencia.
*   **Instance Type:** Precargado con `instance_type` original. `[⚙ Change Instance]` abre el **mismo sub-panel de selección de instancia** usado en Provider & Region (tiers curados + catálogo filtrado).
*   **Game Branch:** Precargado con `game_branch` original. `[🔧 Change Branch]` abre selector de rama: `stable` / `unstable` / `outdatedunstable`.
*   **Static IP:** Muestra `🔄 New IP` porque la IP estática original fue liberada durante el archivado. La restauración aprovisiona una nueva IP estática.

**Navegación en Paso 2:**
*   `↑` / `↓`: Navegar entre campos editables y botones.
*   `ENTER` en campo editable: Activa edición (text input) o abre sub-panel (región/instancia/rama).
*   `ENTER` en `[🚀 Restore Server]`: Avanza a confirmación final.
*   `ESC`: Vuelve a Paso 1 (o directamente a vista de detalle si no hay cambios).

**Paso 3: Confirmación Final (Modal Destructivo)**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  Confirm Restoration                                                    │
│  ─────────────────────                                                      │
│  Review the restoration plan:                                               │
│                                                                             │
│  Server Name:        main                                                   │
│  Provider:           GCP — my-project-123456                                │
│  Region:             us-central1-a (new VM)                                 │
│  Instance:           n2d-standard-4 → 16GB RAM / 12GB JVM                   │
│  Branch:             stable (public)                                        │
│  Backup:             1.2 GB tarball                                         │
│  New Static IP:      Yes (released on archive)                              │
│  Est. Cost:          ~$0.17/hr (~$122/mo)                                   │
│                                                                             │
│  ⚠️  Estimated time: 5-10 minutes depending on backup size.                 │
│                                                                             │
│  >[Cancel]  [🚀 Restore]                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```
*   Resumen completo de la operación.
*   Modal destructivo con `[Cancel]` como default.
*   `[🚀 Restore]` inicia el proceso.

**Paso 4: Progreso en Tiempo Real**
Una vez confirmado, el panel derecho muestra un **log en tiempo real** del proceso de restauración (similar a un terminal output). El usuario puede ver el progreso pero **no puede cancelar** una vez iniciado (la operación es atómica una vez que empieza el deploy).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Restoring Server: main                                          [ESC] Back │
│  ─────────────────────                                                      │
│  [░░░░░░░░░░░░░░░░░░] 0%                                                    │
│                                                                             │
│  [12:34:05] Initializing Pulumi...                                       │
│  [12:34:06] Creating VM (n2d-standard-4) in us-central1-a...                │
│  [12:34:45] VM ready. Bootstrapping via cloud-init...                       │
│  [12:35:10] Docker installed. Uploading docker-compose.yml...               │
│  [12:35:12] Uploading backup tarball (1.2 GB)...                            │
│  [12:36:20] Extracting backup to /opt/zomboid/data...                       │
│  [12:36:45] Backup restored. Starting container...                          │
│  [12:36:50] Container started. Waiting for RCON...                          │
│  [12:37:05] ✅ Server restored and running!                                 │
│                                                                             │
│  New IP: 34.120.99.45                                                       │
│  Status: 🟢 RUNNING                                                         │
│                                                                             │
│  >[Go to Server Dashboard]  [Back to Archived]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Fases del proceso técnico:**
1.  **Pulumi Up:** Crea nueva VM, IP estática, firewall rules con los parámetros seleccionados.
2.  **Cloud-init:** Instala Docker, crea directorios, escribe `docker-compose.yml` con configuración restaurada.
3.  **Backup Upload:** SFTP del tarball local a la VM (`/tmp/restore.tar.gz`).
4.  **Backup Extraction:** Extrae el tarball sobre el volumen de Docker (`/opt/zomboid/data`).
5.  **Container Start:** `docker compose up -d`.
6.  **Health Check:** Polling RCON hasta obtener respuesta. Timeout: 5 minutos.
7.  **Actualización de DB:** El registro en SQLite cambia de `status: 'archived'` a `status: 'running'`, actualizando `instance_zone`, `instance_type`, `game_branch`, `static_ip`, y `updated_at`.

**Post-Restauración:**
*   Al completarse, el servidor aparece automáticamente en "Servidores Activos".
*   El usuario puede presionar `[Go to Server Dashboard]` para entrar directamente al dashboard del servidor restaurado.
*   Si el proceso falla en cualquier fase, se registra `status: 'failed'` con el error, y el usuario tiene la opción de reintentar o destruir la infraestructura parcial creada.

**Restricciones y Consideraciones:**
*   **SERVERNAME:** Si el usuario cambia el `Server Name` durante la restauración, el backup se extrae normalmente pero la imagen Docker usará el nuevo `SERVERNAME` para generar archivos INI. El mundo anterior queda en el volumen pero no se carga automáticamente (comportamiento estándar de la imagen Docker documentado en sección 3).
*   **IP Estática:** Siempre se aprovisiona una nueva IP. La IP anterior fue liberada en el archivado y no se puede recuperar.
*   **Mods/Workshop IDs:** Se restauran desde el backup (están en el volumen), pero si el usuario cambió de branch (ej. stable → unstable), puede haber incompatibilidades de mods que se manejen como error de health-check.

---

### 3. Technical Specifications & Stack

> **Full dependency inventory and gap analysis:** See `ADR-003-Dependency-Inventory-and-Gap-Analysis.md` for the complete audit of installed packages, missing packages, and manual components.

#### 3.1 Core Runtime
*   **Runtime:** Bun (`bun:sqlite` built-in for local database).
*   **Entry Point:** React Ink (TUI fullscreen). No Commander subcommands — the app boots directly into the interactive menu.

#### 3.2 UI Layer (React Ink Ecosystem)
*   **Renderer:** `ink` ^7.0.1
*   **State Management:** Zustand (`zustand` ^5.0.12) with `useInkStore` wrapper for Ink compatibility (see ADR-002).
*   **Layout:** `ink-titled-box`, `@byteland/ink-scroll-bar`, Flexbox native (`<Box>`)
*   **Navigation:** `ink-scroll-list`, `ink-scroll-view`, `ink-quicksearch-input`
*   **Inputs:** `ink-text-input`, `ink-confirm-input`
*   **Visual:** `ink-big-text`, `ink-gradient`, `ink-spinner`, `@pppp606/ink-chart`
*   **Tables:** `ink-table` ^3.1.0 (servers, players, backups, archived)
*   **Progress:** `@inkjs/ui` ^2.0.0 (ProgressBar for deploys/uploads)
*   **Wizard:** `ink-stepper`
*   **Task Tracking:** `ink-task-list`
*   **Editor:** `ink-syntax-highlight` (INI/LUA syntax highlighting)
*   **Process Spawning:** `ink-spawn`

#### 3.3 Backend & Infrastructure
*   **i18n:** `i18next` + `react-i18next` (ES/EN bilingual support)
*   **SSH / SFTP / Port Forwarding:** `ssh2` + `ssh2-sftp-client`
*   **RCON Protocol:** Source RCON standard (Valve protocol) over TCP port 27015. Implemented via `rcon-client` npm package. The command `players` returns plain text (not JSON) with format `-username -(admin)adminname`.
*   **YAML Processing:** `yaml` ^2.8.3 (`docker-compose.yml` generation)
*   **Cron:** `cron-parser` + `cronstrue` (scheduler validation + readable descriptions)
*   **Validation:** `zod` ^4.3.6 (wizard form validation)
*   **UUIDs:** Native `crypto.randomUUID()` (no package)
*   **Dates:** Native `Intl.DateTimeFormat` (no package)
*   **HTTP Ping:** Native `fetch` + `performance.now()` (no package)

#### 3.4 Infrastructure as Code (IaC)
*   **Engine:** Pulumi (TypeScript SDK + Automation API)
*   **Providers:** `@pulumi/pulumi` ^3.232.0, `@pulumi/gcp` ^9.21.0
*   **State:** Local (`*.pulumi/`) or Pulumi Cloud (free up to 500 resources)
*   **Decision rationale:** See `ADR-001-IaC-Strategy.md` (CDKTF rejected due to archived AWS provider)

#### 3.5 Container & VM
*   **VM OS:** Ubuntu 22.04 LTS
*   **Container Engine:** Docker + Docker Compose (installed via cloud-init)
*   **Container Image:** `Danixu/project-zomboid-server-docker`
*   **Security:** Ed25519 SSH keys (auto-generated per server), RCON over SSH tunnel (port forwarding, never exposed to internet)

#### 3.6 File Picker (TUI Inline)
*   **Strategy:** Custom file picker built inside Ink using `fs.readdirSync` + arrow navigation. No native OS dialogs (they break the TUI).
*   **Navigation:** `↑↓` to navigate entries, `ENTER` to enter directory or select file, `ESC` to cancel.
*   **Cross-platform:** Uses `node:path` and `node:os` for Windows/Unix path normalization.
*   **Rendering:** Displayed as an overlay sub-screen within the TUI, not a separate window.

---

### 4. Flujos Clave y Mecánicas de Bajo Nivel

*   **Gestión de Claves y Acceso SSH:** Al crear el servidor, la CLI genera un par de claves Ed25519. La clave pública se inyecta en la VM vía Pulumi (metadata ssh-keys de GCP). La clave privada se guarda de forma segura en la base de datos local SQLite. TODO el tráfico de administración viaja por este canal.

*   **Bootstrapping de la VM (cloud-init):** La CLI inyecta un script `cloud-init` que:
    1.  Instala Docker Engine y Docker Compose Plugin.
    2.  Crea los directorios de Zomboid (`/opt/zomboid/data`, `/opt/zomboid/config`).
    3.  Escribe el `docker-compose.yml` generado.
    4.  Ejecuta `docker compose up -d` para arrancar el contenedor.
    La seguridad de red se delega exclusivamente al firewall de GCP (no se configura iptables/ufw en la VM).

*   **Docker Compose Template:** La CLI genera dinámicamente un `docker-compose.yml` con las variables de entorno requeridas por la imagen `Danixu/project-zomboid-server-docker`. Este archivo es la fuente de verdad para la configuración del contenedor en la VM.

    **Variables de entorno soportadas por la imagen (runtime, procesadas por entry.sh):**
    | Variable | Descripción | Ejemplo |
    |----------|-------------|---------|
    | `SERVERNAME` | Identificador interno. **Sin espacios**. Determina prefijo de archivos (`${SERVERNAME}.ini`). | `pzserver` |
    | `ADMINUSERNAME` | Usuario administrador. | `admin` |
    | `ADMINPASSWORD` | Contraseña admin. **Obligatoria en primer arranque**. | (autogenerada) |
    | `PASSWORD` | Contraseña del servidor. | (opcional) |
    | `RCONPASSWORD` | Contraseña RCON. | (autogenerada) |
    | `DISPLAYNAME` | Nombre público (`PublicName` en INI). | `My PZ Server` |
    | `PUBLIC` | Visibilidad en browser (`true`/`false`). | `true` |
    | `MEMORY` | Memoria JVM (calculada desde tipo de instancia). Ej: VM 16GB → `12g`. | `12g` |
    | `MIN_MEMORY` | Memoria inicial JVM. | `12g` |
    | `MAX_MEMORY` | Memoria máxima JVM. | `12g` |
    | `PORT` | Puerto UDP principal. | `16261` |
    | `STEAMPORT1` | Steam port 1 (UDP). | `8766` |
    | `STEAMPORT2` | Steam port 2 (UDP). | `8767` |
    | `STEAMVAC` | SteamVAC (`true`/`false`). | `true` |
    | `NOSTEAM` | Clientes non-Steam (`true`/`false`). | `false` |
    | `FORCEUPDATE` | Forzar update Steam en cada start. | `false` |
    | `MODFOLDERS` | Orden de carga de mods. | `workshop,steam,mods` |
    | `WORKSHOP_IDS` | IDs Workshop separados por `;`. | `514427485;513111049` |
    | `MOD_IDS` | IDs mods separados por `;`. B42 requiere `\\` prefijo. | `\\mod1;\\mod2` |
    | `SERVERPRESET` | Preset mundo (`Apocalypse`, `Survival`, etc.). | `Apocalypse` |
    | `DEBUG` | Modo debug. | `false` |
    | `LANG` | Locale del contenedor. | `en_EN.UTF-8` |

    **Variable de build-time (en imagen pre-buildada, no en .env):**
    | Variable | Descripción | Valores |
    |----------|-------------|---------|
    | `IMAGE_TAG` | Tag de imagen Docker en `docker-compose.yml` | `:latest`, `:latest-unstable`, `:legacy` |

    **Notas críticas de la imagen Docker:**
    *   `ADMINPASSWORD` es **obligatoria en el primer arranque**. Si falta, el servidor falla y se cuelga.
    *   `SERVERNAME` **no puede tener espacios** — causa fallos de autenticación admin.
    *   Cambiar `SERVERNAME` crea un **nuevo servidor** con datos frescos. El anterior se preserva pero no se carga automáticamente.
    *   Las contraseñas (`ADMINPASSWORD`, `RCONPASSWORD`) se registran en plaintext en los logs de primer arranque. Tras el primer start exitoso, pueden eliminarse del `docker-compose.yml` (ya están en el INI).
    *   `STEAMAPPBRANCH` es **build-time** del Dockerfile. La imagen publica tags pre-buildadas (`:latest`, `:latest-unstable`, `:legacy`), por lo que cambiar de rama consiste en cambiar el tag de `image:` en `docker-compose.yml` y hacer `docker compose pull && up -d`. **No rebuild local.**
    *   **No existe variable `DESCRIPTION`** en la imagen. La descripción (`PublicDescription=`) se edita directamente en el archivo `${SERVERNAME}.ini` vía SFTP.
    *   **No existe variable `RCONPORT`** como env var en la imagen. El puerto RCON se configura en el INI. Usamos 27015 por convención.

*   **Asignación de IP Estática:** Pulumi aprovisiona un recurso de IP Pública Estática (`gcp.compute.Address`) y lo asocia a la VM de forma permanente para que sobreviva reinicios.

*   **Protección RCON vía SSH Tunneling:** El firewall de Pulumi **NUNCA** expone el puerto RCON a Internet. La CLI abre un túnel SSH (`ssh2` port forwarding) para comunicarse con el puerto RCON interno del contenedor.

*   **Comandos RCON disponibles (MVP):**
    *   `servermsg "<text>"` — Broadcast a todos los jugadores.
    *   `players` — Lista de jugadores conectados.
    *   `kickuser "<username>"` — Expulsar jugador.
    *   `banuser "<username>"` — Banear jugador.
    *   `save` — Forzar guardado del mundo.
    *   `quit` — Apagar el servidor graciosamente.

*   **Reserva Dinámica de RAM:** La CLI lee el tipo de instancia GCP seleccionada y calcula la memoria disponible. Inyecta `MEMORY` (y opcionalmente `MIN_MEMORY`/`MAX_MEMORY`) en el `docker-compose.yml` (ej. `6g` para una VM de 8GB) para evitar OOM Killer.

*   **Inyección de Archivos (SFTP):** Configuración de Mods (BYOC) sobrescribe el archivo de destino en el volumen de Docker vía SFTP.

*   **Flujo de Backups Locales:** El servidor debe estar **STOPPED** para garantizar consistencia. Proceso: RCON `save` + `quit` → `docker compose down` → SSH para comprimir `/opt/pz/data` en `/tmp/backup.tar.gz` → SFTP download a `~/.zomboid-cli/backups/[server-name]/[timestamp].tar.gz` → eliminar tarball en VM. El tamaño del archivo se registra en SQLite (`backups.size`).

*   **Flujo de Actualización Graciosa (Update Flow):**
    1.  `servermsg` — Broadcast de aviso a jugadores.
    2.  Wait configurable (ej. 60 segundos).
    3.  RCON `save` — Forzar guardado del mundo.
    4.  RCON `quit` — Apagar servidor graciosamente.
    5.  `docker compose pull && docker compose up -d` — SteamCMD auto-update al arrancar el contenedor.

*   **Redes y Puertos:** Puertos UDP `16261-16262` abiertos en el firewall GCP. Puerto RCON solo accesible vía SSH tunnel (nunca expuesto).

*   **Scheduler (Crontab Remoto):** La CLI instala entradas en el crontab de la VM vía SSH. Las tareas programables son:
    *   Auto-Restart: `docker compose -f /opt/zomboid/docker-compose.yml restart`
    *   Auto-Backup: Script que comprime el volumen y lo mantiene disponible para descarga.
    *   Broadcast: Mensajes RCON programados (requiere un script helper en la VM que use el cliente RCON local).

*   **Server Stats:**
    *   Métricas: `docker stats --no-stream --format '{{json .}}'` vía SSH. Devuelve JSON parseble (CPU%, MEM%, NET I/O, BLOCK I/O).
    *   Logs (Snapshot): `docker logs --tail 100` vía SSH.
    *   Logs (Streaming): `docker logs -f` gestionado como stream SSH. El usuario sale con `q`.

*   **Build Versions:** Tres ramas disponibles, mapeadas a tags de imagen Docker pre-buildadas:
    *   `stable` → `public` → image tag `:latest` (Build 41 estable, default)
    *   `unstable` → `unstable` → image tag `:latest-unstable` (Build 42 en desarrollo)
    *   `outdatedunstable` → `legacy` → image tag `:legacy` (rama obsoleta)
    *   **Importante:** `STEAMAPPBRANCH` es build-time en el Dockerfile de la imagen upstream. Como usamos la imagen pre-buildada de Docker Hub, cambiar de rama consiste en cambiar el `image:` en `docker-compose.yml` (ej: `danixu86/project-zomboid-dedicated-server:latest-unstable`) y ejecutar `docker compose pull && docker compose up -d`. No rebuild local.

*   **GCP Pricing Engine:** Los precios se muestran como **estimaciones hardcodeadas** por tipo de instancia, actualizadas manualmente en releases. No se consulta API en runtime para evitar latencia y dependencias de API keys.
    *   **Formato:** Precios almacenados en `src/lib/gcp-pricing.ts` como lookup table por `machineType`.
    *   **Ejemplos de referencia** (us-central1, aproximados): `e2-standard-4` ~$0.11/hr, `n2d-standard-4` ~$0.17/hr, `c2-standard-4` ~$0.21/hr.
    *   **UI:** Los precios se muestran con prefijo `~` y un aviso: `⚠️ Estimated prices. Subject to change.`

---

### 5. Error Handling & Recovery Strategy

La CLI implementa una estrategia de recuperación por fases. **Principios inquebrantables:**
1.  **Nunca destruir silenciosamente** — toda destrucción requiere confirmación explícita del usuario.
2.  **Estado persistente** — un deploy fallido se registra como `status: 'failed'` con el error en SQLite.
3.  **Operaciones atómicas** — un fallo en backup no corrompe un update en progreso.
4.  **SSH como escape hatch** — siempre ofrecer "Conectar por SSH para diagnóstico manual" como última opción.

| Fase | Tipo de Fallo | Detección | Opciones de Recuperación |
|------|---------------|-----------|--------------------------|
| Pulumi Up | Error de Pulumi | Exit code ≠ 0 | Reintentar / Destruir parcial / Abortar (`status: 'failed'`) |
| VM Boot | No alcanza estado RUNNING | Polling GCP API, timeout 3 min | Diagnóstico + Reintentar / Destruir |
| Cloud-init | Docker o contenedor no arrancan | SSH health check, backoff exponencial, timeout 5 min | Mostrar logs cloud-init + Re-ejecutar / SSH manual / Destruir |
| Container | Crash post-deploy | `docker compose ps` → exited/unhealthy | Mostrar `docker compose logs` + Restart / Reconfigurar |
| Operaciones (SSH/RCON) | Timeout o error de conexión | Timeout o exit code ≠ 0 | Error descriptivo + Reintentar. Nunca destruir. |

---

### 6. Arquitectura del Sistema (Clean Architecture)

#### 6.1 Estructura de Carpetas (Feature-Based Modular)

> **Nota arquitectónica:** La versión original de este PRD proponía Clean Architecture + Hexagonal (4 capas estrictas). Tras investigar proyectos CLI reales (GitHub CLI, Vercel CLI, Gemini CLI, OpenCode), se determinó que ese nivel de indirection es excesivo para un proyecto con 1 developer y un dominio relativamente simple. La nueva estructura adopta **Feature-Based Modular** — el mismo patrón usado por los CLIs populares, adaptado a una TUI React.
>
> **Principios de esta estructura:**
> 1. **Co-locación por feature:** Todo lo relacionado a una pantalla vive en `screens/<feature>/`.
> 2. **Componentes puros:** Reutilizables, sin lógica de negocio, en `components/`.
> 3. **Stores granulares:** Un store Zustand por dominio (servidores, settings, pending changes), no un monolito.
> 4. **Services = lógica de negocio:** Orquestan adaptadores (`infrastructure/`) para cumplir casos de uso.
> 5. **No abstracciones sin implementación alternativa:** No se crean interfaces (`ISshGateway`) si solo existe una implementación (`ssh2`).

```text
zomboid-cli/
├── src/
│   ├── cli/
│   │   ├── index.tsx                   # Entry point: monta React Ink App
│   │   ├── app.tsx                     # Root component (provee contexto global)
│   │   └── router.tsx                  # Navegación entre screens (estado global simple)
│   │
│   ├── screens/                        # UNA CARPETA POR PANTALLA PRINCIPAL
│   │   ├── main-menu/
│   │   │   ├── main-menu-screen.tsx    # Layout + lógica de la pantalla
│   │   │   ├── server-list.tsx         # Tabla de servidores activos
│   │   │   └── use-main-menu.ts        # Hook de estado local (foco, selección)
│   │   │
│   │   ├── server-dashboard/
│   │   │   ├── server-dashboard-screen.tsx
│   │   │   ├── submenus/
│   │   │   │   ├── server-management.tsx
│   │   │   │   ├── provider-region.tsx
│   │   │   │   ├── build.tsx
│   │   │   │   ├── players.tsx
│   │   │   │   ├── stats.tsx
│   │   │   │   ├── basic-settings.tsx
│   │   │   │   ├── advanced-settings.tsx
│   │   │   │   ├── admins.tsx
│   │   │   │   ├── scheduler.tsx
│   │   │   │   └── backups.tsx
│   │   │   └── use-server-dashboard.ts  # Estado local del dashboard (submenú activo, foco)
│   │   │
│   │   ├── create-server-wizard/
│   │   │   ├── wizard-screen.tsx
│   │   │   ├── steps/
│   │   │   │   ├── select-provider.tsx
│   │   │   │   ├── auth-project.tsx
│   │   │   │   ├── server-name.tsx
│   │   │   │   ├── select-region.tsx
│   │   │   │   ├── select-instance.tsx
│   │   │   │   └── review-deploy.tsx
│   │   │   └── use-wizard.ts           # Estado del wizard (paso actual, datos acumulados)
│   │   │
│   │   ├── archived-servers/
│   │   │   ├── archived-list.tsx
│   │   │   ├── archived-detail.tsx
│   │   │   └── restore-wizard/
│   │   │       ├── restore-screen.tsx
│   │   │       └── steps/
│   │   │
│   │   └── global-settings/
│   │       └── settings-screen.tsx
│   │
    │   ├── components/                     # COMPONENTES PUROS (sin lógica de negocio)
    │   │   ├── header.tsx                  # ASCII art + gradient
    │   │   ├── footer.tsx                  # Barra de atajos
    │   │   ├── system-status.tsx           # Versión, conteo de servidores
    │   │   ├── titled-panel.tsx            # Wrapper de ink-titled-box reusable
    │   │   ├── data-table.tsx              # Tabla genérica con navegación
    │   │   ├── modal.tsx                   # Modal centrado con position="absolute"
    │   │   ├── file-picker.tsx             # File picker TUI inline (fs.readdirSync + Ink)
    │   │   ├── inline-editor.tsx           # Editor de texto inline (INI/LUA)
    │   │   ├── progress-bar.tsx            # Barra de progreso ASCII
    │   │   └── toast.tsx                   # Notificaciones flotantes
│   │
│   ├── hooks/                          # CUSTOM HOCKS DE UI
│   │   ├── use-input-handler.ts        # Wrapper tipado de useInput
│   │   ├── use-focus-manager.ts        # Gestión de foco entre paneles
│   │   ├── use-terminal-size.ts        # Reacción a resize de terminal
│   │   └── use-ink-store.ts            # Wrapper Zustand con workaround para Ink
│   │
│   ├── stores/                         # ZUSTAND STORES (granulares)
│   │   ├── servers-store.ts            # Lista de servidores, CRUD
│   │   ├── pending-changes-store.ts    # Buffer global de cambios pendientes (Ctrl+A)
│   │   ├── settings-store.ts           # Locale, tema, backup path
│   │   └── app-store.ts                # Estado efímero de UI (navegación, loading)
│   │
│   ├── services/                       # LÓGICA DE NEGOCIO (orquesta infrastructure)
│   │   ├── deploy-service.ts           # Pulumi up/destroy + health checks
│   │   ├── ssh-service.ts              # Comandos SSH, SFTP, port forwarding
│   │   ├── rcon-service.ts             # Cliente TCP RCON vía tunnel SSH
│   │   ├── backup-service.ts           # Crear/restaurar backups (compress + SFTP)
│   │   ├── scheduler-service.ts        # Crontab remoto (instalar/eliminar tareas)
│   │   ├── server-lifecycle-service.ts # Start, stop, update graceful (RCON + docker)
│   │   ├── pricing-service.ts          # GCP pricing cache + cálculo de costos
│   │   └── archive-service.ts          # Backup + destroy + marcar archived
│   │
│   ├── infrastructure/                 # ADAPTADORES TÉCNICOS (wrappers de librerías)
│   │   ├── database.ts                 # Wrapper de bun:sqlite (queries, migraciones)
│   │   ├── pulumi/
│   │   │   ├── executor.ts             # Automation API wrapper (stack.up/down)
│   │   │   ├── gcp-stack.ts            # Programa Pulumi para GCP
│   │   │   └── templates/
│   │   │       ├── cloud-init.sh       # Script de bootstrap de VM
│   │   │       └── docker-compose.yml  # Template de compose (con variables)
│   │   ├── gcp/
│   │   │   ├── auth.ts                 # Verificación de gcloud auth
│   │   │   ├── projects.ts             # Listar proyectos GCP
│   │   │   └── pricing-api.ts          # Cloud Billing API (precios on-demand)
│   │   ├── ssh/
│   │   │   ├── client.ts               # Wrapper de ssh2 (exec, shell)
│   │   │   └── sftp.ts                 # Operaciones SFTP (upload/download)
│   │   └── networking/
│   │       └── latency.ts              # HTTP ping a endpoints de región
│   │
│   ├── lib/                            # UTILIDADES PURAS (sin side effects)
│   │   ├── validators.ts               # Validar server name, cron, etc.
│   │   ├── formatters.ts               # Bytes, fechas, display de costos
│   │   ├── paths.ts                    # XDG paths, resolver ~
│   │   └── calculate-jvm-memory.ts     # VM RAM → JVM heap (ej. 16GB → 12g)
│   │
│   ├── types/                          # TYPESCRIPT TYPES COMPARTIDOS
│   │   └── index.ts                    # ServerRecord, DeploymentResult, etc.
│   │
│   └── locales/                        # I18N
│       ├── en.json
│       └── es.json
│
└── package.json
```

#### 6.2 Esquema de Datos Core (SQLite)

**Tabla: `servers`**
| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `name` | TEXT | NOT NULL | Nombre lógico del servidor |
| `provider` | TEXT | NOT NULL | Proveedor cloud (ej. `'gcp'`) |
| `project_id` | TEXT | NOT NULL | ID del proyecto en el proveedor |
| `instance_type` | TEXT | NOT NULL | Tipo de máquina (ej. `'n2d-standard-4'`) |
| `instance_zone` | TEXT | NOT NULL | Zona de despliegue (ej. `'us-central1-a'`) |
| `static_ip` | TEXT | | IPv4 pública estática |
| `ssh_key_id` | TEXT | NOT NULL | FK → `ssh_keys.id` |
| `rcon_password` | TEXT | NOT NULL | Password RCON autogenerado |
| `game_branch` | TEXT | NOT NULL DEFAULT `'stable'` | Rama SteamCMD (`stable` / `unstable` / `outdatedunstable`) |
| `status` | TEXT | NOT NULL | `'provisioning'` / `'running'` / `'stopped'` / `'failed'` / `'archived'` |
| `error_message` | TEXT | | Detalle del último error (si `status='failed'`) |
| `backup_path` | TEXT | | Ruta local del backup (si `status='archived'`) |
| `backup_size` | INTEGER | | Tamaño en bytes del backup (si `status='archived'`) |
| `created_at` | TEXT | NOT NULL | ISO 8601 |
| `updated_at` | TEXT | NOT NULL | ISO 8601 |

**Tabla: `ssh_keys`**
| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `server_id` | TEXT | NOT NULL, UNIQUE, FK → `servers.id` ON DELETE CASCADE | Servidor asociado |
| `public_key` | TEXT | NOT NULL | Clave pública Ed25519 (formato OpenSSH) |
| `private_key_encrypted` | TEXT | NOT NULL | Clave privada PEM, cifrada en reposo (AES-256-GCM via Bun crypto) |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

> **Nota de seguridad:** La clave privada se cifra con una clave maestra derivada de un passphrase configurable por el usuario (default: random generado en primer arranque). Esto evita que la clave privada vaya en plaintext en SQLite.

**Tabla: `pending_changes`**
| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `server_id` | TEXT | NOT NULL, FK → `servers.id` ON DELETE CASCADE | Servidor asociado |
| `panel` | TEXT | NOT NULL | Panel origen (`basic-settings`, `admins`, `provider-region`, `build`, `advanced-settings`) |
| `field` | TEXT | NOT NULL | Campo modificado |
| `old_value` | TEXT | | Valor anterior |
| `new_value` | TEXT | | Nuevo valor |
| `requires_restart` | INTEGER | NOT NULL DEFAULT 0 | 1 = requiere reinicio del contenedor |
| `requires_vm_recreate` | INTEGER | NOT NULL DEFAULT 0 | 1 = requiere recrear VM |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

**Tabla: `backups`**
| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `server_id` | TEXT | NOT NULL, FK → `servers.id` ON DELETE CASCADE | Servidor asociado |
| `path` | TEXT | NOT NULL | Ruta local del archivo `.tar.gz` |
| `size` | INTEGER | NOT NULL | Tamaño en bytes |
| `type` | TEXT | NOT NULL | `manual` / `scheduled` / `pre-update` / `pre-archive` |
| `status` | TEXT | NOT NULL | `valid` / `corrupted` / `missing` |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

**Tabla: `scheduled_tasks`**
| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `server_id` | TEXT | NOT NULL, FK → `servers.id` | Servidor asociado |
| `type` | TEXT | NOT NULL | `'auto_restart'` / `'auto_backup'` / `'broadcast'` |
| `cron_expression` | TEXT | NOT NULL | Formato cron estándar (ej. `'0 4 * * *'`) |
| `payload` | TEXT | | Datos adicionales (ej. mensaje de broadcast) |
| `enabled` | INTEGER | NOT NULL DEFAULT `1` | 1 = activo, 0 = pausado |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

**Tabla: `settings`**
| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `key` | TEXT | PRIMARY KEY | Clave de configuración |
| `value` | TEXT | NOT NULL | Valor de configuración |

Claves esperadas en `settings`:
*   `locale` — Idioma de la CLI (`'es'` / `'en'`). Default: `'en'`.
*   `backup_path` — Ruta local de backups. Default: `'~/.zomboid-cli/backups'`.
*   `theme` — Tema de colores de la TUI.

---

#### 6.3 State Management y Re-rendering en Ink

##### 6.3.1 El Problema: Zustand + Ink (Issue #539)

**Síntoma:** Componentes que leen de Zustand no se re-renderizan cuando el store cambia. En browser funciona; en terminal no.

**Causa raíz:** Ink renderiza mediante `yoga-layout` (no DOM). El sistema de suscripciones de Zustand depende del ciclo de reconciliación de React en el DOM, que no se activa correctamente en el entorno de Ink cuando solo cambia un store externo.

**Workaround manual (no recomendado para escalar):**
```tsx
const App = () => {
  const { fruit, setFruit } = useAppStore();
  const [_, forceRender] = useState(0); // 🔧 Hack

  return (
    <SelectInput
      onSelect={(item) => {
        setFruit(item.value);
        forceRender(n => n + 1); // Fuerza re-render
      }}
    />
  );
};
```

**Referencia:** [vadimdemedes/ink#539](https://github.com/vadimdemedes/ink/issues/539)

##### 6.3.2 Solución adoptada: Hook wrapper `useInkStore`

En lugar de polucionar cada componente con `useState` dummy, se encapsula el workaround en un hook reusable:

```tsx
// src/hooks/use-ink-store.ts
import { useState, useEffect } from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand';

export function useInkStore<T, S>(
  store: StoreApi<T>,
  selector: (state: T) => S
): S {
  const [tick, setTick] = useState(0);
  const value = useStore(store, selector);

  useEffect(() => {
    const unsub = store.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, [store]);

  void tick; // tick fuerza re-render cuando el store cambia
  return value;
}
```

**Regla de oro:** Todo componente que lea Zustand usa `useInkStore()` en lugar de `useStore()`.

##### 6.3.3 Estrategia de estado por capa

No todo el estado debe vivir en Zustand. Se adopta un **mix híbrido** basado en el alcance del estado:

| Alcance del estado | Herramienta | Ejemplos | Razón |
|-------------------|-------------|----------|-------|
| **Global persistente** | Zustand (`useInkStore`) | Lista de servidores, settings, pending changes | Necesitado por múltiples screens. Persistido en SQLite. |
| **Global de UI** | React Context (simple) | Screen actual, historial de navegación | Cambia frecuentemente. Context evita prop drilling sin workaround. |
| **Local de feature** | `useState` + custom hooks | Foco en menú, item seleccionado, scroll | Solo relevante para la screen activa. No justifica store global. |
| **Local de formulario** | `useState` | Inputs de Basic Settings, dirty state | Aislado al formulario. Más simple con useState. |

##### 6.3.4 Stores Zustand granulares

En lugar de un store monolítico, se separa en dominios independientes:

```typescript
// stores/servers-store.ts
interface ServersState {
  servers: ServerRecord[];
  selectedId: string | null;
  addServer: (server: ServerRecord) => void;
  updateServer: (id: string, patch: Partial<ServerRecord>) => void;
  // ...
}

// stores/pending-changes-store.ts
interface PendingChangesState {
  changes: PendingChange[];
  addChange: (change: PendingChange) => void;
  clearChanges: () => void;
  // ...
}

// stores/settings-store.ts
interface SettingsState {
  locale: 'es' | 'en';
  theme: string;
  backupPath: string;
  setLocale: (locale: 'es' | 'en') => void;
  // ...
}
```

**Beneficios de granularidad:**
1. Un cambio en `settings-store` no re-renderiza componentes que solo leen `servers-store`.
2. Cada store es testeable de forma aislada.
3. Fácil de persistir selectivamente (ej. solo `settings-store` al disco).

##### 6.3.5 Navegación con React Router v7 + MemoryRouter

El router de screens usa **React Router v7 con `MemoryRouter`** — el patrón oficial recomendado por Ink (recipe añadido en PR #874, Feb 2026). No se usa un router custom con Context/Zustand.

**Por qué MemoryRouter:**
- Es la receta oficial de Ink para navegación multi-screen.
- Proporciona `useNavigate`, `useLocation`, `useParams` nativos.
- `navigate(-1)` implementa goBack real con historial.
- No requiere workaround de Zustand para re-renders.

```tsx
// src/cli/router.tsx
import { MemoryRouter, Routes, Route } from 'react-router';

export const AppRouter = () => (
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/*" element={<App />} />
    </Routes>
  </MemoryRouter>
);
```

**Navegación en screens:**
```tsx
import { useNavigate, useLocation } from 'react-router';

function Dashboard() {
  const navigate = useNavigate();
  
  useInput((input, key) => {
    if (key.escape) navigate(-1); // goBack real
    if (key.return) navigate('/wizard');
  });
}
```

**Regla:** El estado de navegación NUNCA va en Zustand. Los cambios de screen son demasiado frecuentes y el workaround de `useInkStore` añadiría overhead innecesario.

##### 6.3.6 ¿Por qué no Redux ni Context global?

| Opción | Por qué se descarta |
|--------|---------------------|
| **Redux** | Boilerplate excesivo para un proyecto con 1 developer. No se necesitan middleware ni devtools en una TUI. |
| **Context global para todo** | Cualquier cambio re-renderiza todos los consumidores. En una TUI con 10+ paneles, eso es inaceptable. |
| **Valtio** | Mismo problema que Zustand (suscripciones proxy no se integran con Ink). |
| **Zustand sin workaround** | Los componentes simplemente no se actualizan. No es opción viable. |
