# Roadmap OpenSpec: Zomboid-CLI Multi-Cloud Orchestrator

> **Roadmap v0.5** | Última actualización: 2026-04-29  
> Basado en `openspec/PRD.md` v1.0.  
> Cada change es verificable de forma aislada o con sus dependencias ya completadas.

---

## Changelog del Roadmap

| Versión | Fecha | Cambio |
| :--- | :--- | :--- |
| v0.5 | 2026-04-29 | ch-03 completado y archivado; specs theme-core, theme-loader, theme-selector-preview sincronizados como main specs |
| v0.4 | 2026-04-28 | ch-01 y ch-02 completados y archivados; specs global-settings-screen, i18n-core, theme-core sincronizados |
| v0.3 | 2026-04-27 | Alineación con código real: columna Spec, estados corregidos (parcial/in progress), notas técnicas de mocks, dependencias de SSH como bloqueante, criterios ajustados |
| v0.2 | 2026-04-27 | Corrección de dependencias (ch-14 → Fase 3), separación Fase 4/5, criterios binarios, columna Estado |
| v0.1 | 2026-04-26 | Estructura inicial con 23 changes en 4 fases |

---

## Completados

| ID | Nombre | Spec | Archivado |
| :--- | :--- | :--- | :--- |
| `ch-00` | TUI Layout Shell (router, layout 35/65, header, status bar, footer) | [`specs/tui-layout-shell`](specs/tui-layout-shell/spec.md) | `2026-04-26` |
| `ch-01` | Pantalla Configuración Global (idioma, tema, backup path) | [`specs/global-settings-screen`](specs/global-settings-screen/spec.md) | `2026-04-28` |
| `ch-02` | Pantalla Servidores Archivados (lista, detalle, acciones stub) | [`specs/archived-servers-screen`](specs/archived-servers-screen/spec.md) | `2026-04-28` |
| `ch-03` | Sistema de temas (paletas JSON en `src/themes/`, selector con preview) | [`specs/theme-core`](specs/theme-core/spec.md), [`specs/theme-loader`](specs/theme-loader/spec.md), [`specs/theme-selector-preview`](specs/theme-selector-preview/spec.md) | `2026-04-29` |

---

## Fase 1: Fundamentos de UI y Navegación
> Objetivo: Pantallas globales funcionales sin dependencias de infraestructura remota.  
> **MVP: Sí**

| ID del Cambio | Nombre de la Tarea | Estado | Dependencias | Spec | Referencia al PRD |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ch-03` | Sistema de temas (paletas JSON en `src/themes/`, selector con preview) | ✅ Archived | `ch-01` | ✅ [`theme-core`](specs/theme-core/spec.md), [`theme-loader`](specs/theme-loader/spec.md), [`theme-selector-preview`](specs/theme-selector-preview/spec.md) | §2.2.4 "Theme / Tema" |
| `ch-04` | Internacionalización completa (extracción de todos los strings hardcodeados a `locales/`) | 🚧 In Progress | `ch-01` | ❌ Pendiente | §3.3 "i18n" y toda la UI |

**Notas técnicas Fase 1:**
- `ch-01`: ✅ Completado. Screen `src/screens/global-settings/` implementada con LanguageSelector, ThemeSelector, BackupPathInput.
- `ch-02`: ✅ Completado. Screen `src/screens/archived-servers/` implementada con lista, detalle y empty state.
- `ch-03`: ✅ Archivado 2026-04-29. `src/themes/` tiene `default-dark.json`, `ocean.json`, `forest.json`. Selector dinámico con preview inmediato y carga externa en runtime.
- `ch-04`: `src/locales/en.json` y `es.json` existen, pero **no hay uso de `react-i18next`** en componentes principales.

---

## Fase 2: Dashboard Core y Ciclo de Vida
> Objetivo: Gestión real del servidor via SSH/RCON. Los panels del Server Dashboard dejan de ser stubs.  
> **MVP: Sí** | **Bloqueante: ch-05 (SSH real) es prerequisito técnico para todo el resto de la fase**

| ID del Cambio | Nombre de la Tarea | Estado | Dependencias | Spec | Referencia al PRD |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ch-05` | Generación y gestión de claves SSH (Ed25519, cifrado AES-256-GCM en SQLite) | ⏳ Pending | — | ❌ Pendiente | §4 "Gestión de Claves y Acceso SSH", §6.2 Tabla `ssh_keys` |
| `ch-06` | Server Management real: Stop, Start, Update graceful (RCON + docker compose) | 🚧 In Progress | `ch-05` | ❌ Pendiente | §2.2.1 "Panel Derecho: Server Management", §4 "Flujo de Actualización Graciosa" |
| `ch-07` | Build Panel real: cambio de branch con `docker compose pull` via SSH | 🚧 In Progress | `ch-05` | ❌ Pendiente | §2.2.1 "Panel Derecho: Build" |
| `ch-08` | Player Management real: lista, kick, ban, broadcast via RCON sobre SSH tunnel | 🚧 In Progress | `ch-05` | ❌ Pendiente | §2.2.1 "Panel Derecho: Player Management", §3.3 "RCON Protocol" |
| `ch-09` | Server Stats real: `docker stats` + `docker logs` (snapshot y streaming) | 🚧 In Progress | `ch-05` | ❌ Pendiente | §2.2.1 "Panel Derecho: Server Stats" |
| `ch-10` | Backups real: compress remoto + SFTP download + historial en SQLite | 🚧 In Progress | `ch-05` | ❌ Pendiente | §2.2.1 "Panel Derecho: Backups", §4 "Flujo de Backups Locales" |
| `ch-11` | Scheduler real: crontab remoto via SSH (auto-restart, auto-backup, broadcast) | 🚧 In Progress | `ch-05`, `ch-10` | ❌ Pendiente | §2.2.1 "Panel Derecho: Scheduler", §4 "Scheduler" |

**Notas técnicas Fase 2:**
- `ch-05`: **No existe** generación de claves SSH ni tabla `ssh_keys`. El único crypto en código es `pending-change-crypto.ts` (para secretos del buffer de cambios).
- `ch-06~11`: Todos los panels tienen **estructura UI implementada** en `dashboard-panels.tsx`, pero usan `dashboardMockAdapter` para datos y acciones. Sin `ch-05`, permanecen como stubs.
- `ch-06`: `ServerLifecycleService.deploy()` (Pulumi) existe, pero **Stop/Start/Update** usan `dashboardMockAdapter.lifecycle()` = stub.
- `ch-08`: Lista de jugadores es **mock local** (`listPlayers()` retorna datos estáticos). No hay RCON real.
- `ch-09**: Stats son **snapshot mock** (`getStatsSnapshot()`). Logs streaming muestra "static mock snapshot only".
- `ch-10`: `BackupRecord` type existe en SQLite, pero panel usa **backups mock** (`listBackups()`).
- `ch-11`: Panel existe con **tasks mock** (`listScheduledTasks()`). No hay crontab remoto.

---

## Fase 3: Configuración Avanzada e Infraestructura
> Objetivo: Edición remota de archivos, gestión de proveedor y deploy completo.  
> **MVP: Sí (hasta ch-16)**

| ID del Cambio | Nombre de la Tarea | Estado | Dependencias | Spec | Referencia al PRD |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ch-12` | File Picker inline TUI (cross-platform, `fs.readdirSync`, sin diálogos nativos) | ⏳ Pending | — | ❌ Pendiente | §3.6 "File Picker (TUI Inline)" |
| `ch-13` | Editor inline de archivos (`.ini`/`.lua`) con navegación, búsqueda y guardado SFTP | ⏳ Pending | `ch-05`, `ch-12` | ❌ Pendiente | §2.2.1 "Panel Derecho: Advanced Settings (BYOC)" |
| `ch-14` | Advanced Settings Panel real: listar, editar, reemplazar y descargar archivos | 🚧 In Progress | `ch-05`, `ch-12`, `ch-13` | ❌ Pendiente | §2.2.1 "Panel Derecho: Advanced Settings (BYOC)" |
| `ch-15` | Provider & Region real: auth gcloud, listar proyectos, ping HTTP a regiones | 🚧 In Progress | — | ✅ [`gcp-cloud-catalog`](specs/gcp-cloud-catalog/spec.md) | §2.2.1 "Panel Derecho: Provider & Region", §2.3 Paso 2 |
| `ch-16` | Deploy Pipeline completo: Pulumi up → cloud-init → docker compose → health check RCON | 🚧 In Progress | `ch-05`, `ch-15` | ✅ [`gcp-pulumi-deploy`](specs/gcp-pulumi-deploy/spec.md) | §2.3 "Setup Wizard", §4 "Bootstrapping de la VM", §2.5 "Restore Flow" |
| `ch-17` | Archive Flow: backup obligatorio + `pulumi destroy` + `status='archived'` | ⏳ Pending | `ch-10`, `ch-16` | ❌ Pendiente | §2.4 "Archive Flow" |
| `ch-18` | Restore Flow: wizard de restauración desde backup a nueva VM | ⏳ Pending | `ch-10`, `ch-16`, `ch-17` | ❌ Pendiente | §2.5 "Restore Flow (Wizard)" |

**Notas técnicas Fase 3:**
- `ch-12` + `ch-13`: **No existen** componentes. Son prerequisitos para que `ch-14` deje de ser mock.
- `ch-14`: Panel existe con **archivos mock** (`listAdvancedFiles()`). No hay SFTP real.
- `ch-15`: Catálogo GCP (`gcp-catalog.ts`) implementado con regiones, zonas, tiers, pricing estimado. Wizard tiene steps pero **auth gcloud real no está implementado**.
- `ch-16**: `GcpPulumiAutomationDeployer` + `ServerLifecycleService.deploy()` existen. Pero: **health checker es `NoopServerHealthChecker`** (siempre retorna `true`, no verifica RCON real). No hay SSH real para subir `docker-compose.yml`. Specs relacionados: [`pulumi-assisted-install`](specs/pulumi-assisted-install/spec.md), [`create-server-setup-wizard`](specs/create-server-setup-wizard/spec.md).
- `ch-17`: Acción "Archive" en UI muestra "Stub, no remote side effects". No hay `pulumi destroy` + backup obligatorio.
- `ch-18`: **No existe** screen/wizard de restore.

---

## Fase 4: Polish y Sistemas Transversales
> Objetivo: Experiencia de usuario final, validaciones y manejo de errores robusto.  
> **MVP: No**

| ID del Cambio | Nombre de la Tarea | Estado | Dependencias | Spec | Referencia al PRD |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ch-19` | Validaciones de formularios con Zod (wizard, basic settings, admins) | ⏳ Pending | — | ❌ Pendiente | §2.2.1 "Validaciones" en Basic Settings y Admins |
| `ch-20` | Sistema de modales y confirmaciones (destructivas, cambios sin guardar, reinicio) | 🚧 In Progress | — | ❌ Pendiente | §2.1 "Sistema de Modales y Confirmaciones" |
| `ch-21` | Toast notifications y banners de estado (pending changes, restart required) | 🚧 In Progress | — | ✅ [`pending-changes-buffer`](specs/pending-changes-buffer/spec.md) | §2.1 "Sistema Global de Cambios Pendientes" |

**Notas técnicas Fase 4:**
- `ch-19`: **Zod no está instalado** en el proyecto (`package.json`). Validaciones actuales son manuales (`validationErrors: Record<string, string>` en estado del wizard). PRD lista `zod ^4.3.6` en §3.2 pero no está en dependencias.
- `ch-20`: `ApplyPendingChangesModal` existe (para buffer global). Pero **no hay** sistema genérico de modales para confirmaciones destructivas (archive, kick/ban, cancel wizard, reinicio requerido).
- `ch-21`: `PendingChangesBanner` existe y muestra conteo. Pero **no hay** toast notifications genéricos ni banner de "restart required".

---

## Fase 5: Multi-Cloud y Resiliencia Avanzada
> Objetivo: Stubs de proveedores adicionales y estrategias de recovery ante fallos.  
> **MVP: No**

| ID del Cambio | Nombre de la Tarea | Estado | Dependencias | Spec | Referencia al PRD |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ch-22` | Manejo de errores y recovery strategy (retry, destroy parcial, SSH manual) | 🚧 In Progress | `ch-16` | ❌ Pendiente | §5 "Error Handling & Recovery Strategy" |
| `ch-23` | Soporte para AWS y Azure como "Coming Soon" en UI (sin lógica real) | 🚧 In Progress | `ch-15` | ❌ Pendiente | §2.3 Paso 1 "Select Provider" |

**Notas técnicas Fase 5:**
- `ch-22`: Errores de deploy se capturan y guardan en `status='error'` con `lastError`. Pero **no hay** flujo de recovery con opciones `[Retry]` / `[Destroy]` / `[Debug SSH]`.
- `ch-23`: `ProviderRegionPanel` muestra "Coming Soon" para AWS/Azure. Wizard Paso 1 necesita verificación de que están deshabilitados.

---

## Grafo de Dependencias

```
Fase 1
  ch-01 → ch-03, ch-04
  ch-02

Fase 2
  ch-05 ─┬─→ ch-06
         ├─→ ch-07
         ├─→ ch-08
         ├─→ ch-09
         ├─→ ch-10 ──→ ch-11
         └─→ ch-13 ──→ ch-14

Fase 3
  ch-12 ──→ ch-13
  ch-15 ──→ ch-16 ──→ ch-17 ──→ ch-18
                    (ch-10 req)

Fase 4
  ch-19, ch-20, ch-21 (independientes)

Fase 5
  ch-22 (requiere ch-16)
  ch-23 (requiere ch-15)
```

**Dependencia crítica no visualizada:**
```
ch-05 (SSH real) es prerequisito técnico para:
  ch-06, ch-07, ch-08, ch-09, ch-10, ch-11, ch-13, ch-14, ch-16, ch-17, ch-18, ch-22
Sin ch-05, todas estas features usan dashboardMockAdapter (stubs).
```

---

## Estado de Specs

| Spec | Change Relacionado | Estado |
| :--- | :--- | :--- |
| [`tui-layout-shell`](specs/tui-layout-shell/spec.md) | ch-00 | ✅ Escrito |
| [`create-server-setup-wizard`](specs/create-server-setup-wizard/spec.md) | ch-16 (wizard) | ✅ Escrito |
| [`gcp-cloud-catalog`](specs/gcp-cloud-catalog/spec.md) | ch-15 | ✅ Escrito |
| [`gcp-pulumi-deploy`](specs/gcp-pulumi-deploy/spec.md) | ch-16 | ✅ Escrito |
| [`local-server-inventory`](specs/local-server-inventory/spec.md) | Infra base | ✅ Escrito |
| [`pending-changes-buffer`](specs/pending-changes-buffer/spec.md) | ch-21 | ✅ Escrito |
| [`project-structure`](specs/project-structure/spec.md) | Infra base | ✅ Escrito |
| [`pulumi-assisted-install`](specs/pulumi-assisted-install/spec.md) | ch-16 | ✅ Escrito |
| [`server-dashboard-panels`](specs/server-dashboard-panels/spec.md) | ch-06~11, 14 | ✅ Escrito |
| [`server-lifecycle`](specs/server-lifecycle/spec.md) | ch-06, ch-16 | ✅ Escrito |
| [`archived-servers-screen`](specs/archived-servers-screen/spec.md) | ch-02 | ✅ Escrito |
| [`global-settings-screen`](specs/global-settings-screen/spec.md) | ch-01 | ✅ Escrito |
| [`i18n-core`](specs/i18n-core/spec.md) | ch-01, ch-04 | ✅ Escrito |
| [`theme-core`](specs/theme-core/spec.md) | ch-01, ch-03 | ✅ Escrito |
| [`theme-loader`](specs/theme-loader/spec.md) | ch-03 | ✅ Escrito |
| [`theme-selector-preview`](specs/theme-selector-preview/spec.md) | ch-03 | ✅ Escrito |
| ch-04, ch-05, ch-07, ch-08, ch-09, ch-10, ch-11, ch-12, ch-13, ch-17, ch-18, ch-19, ch-20, ch-22, ch-23 | — | ❌ Pendientes |

---

## Criterios de Aceptación por Fase

### Fase 1
- [x] `ch-01`: **DADO** Global Settings abierto, **CUANDO** se cambia idioma, **ENTONCES** toda la UI se renderiza en el nuevo idioma sin reiniciar la TUI.  
  **Archivado:** 2026-04-28. Screen en `src/screens/global-settings/`.
- [x] `ch-02`: **DADO** servidores con `status='archived'` en SQLite, **CUANDO** se abre Servidores Archivados, **ENTONCES** aparecen en lista con metadatos correctos (nombre, fecha, tamaño).  
  **Archivado:** 2026-04-28
- [x] `ch-03`: **DADO** archivos en `src/themes/*.json`, **CUANDO** se abre selector de tema, **ENTONCES** lista dinámicamente todas las paletas y aplica preview inmediato.  
  **Archivado:** 2026-04-29. `src/themes/` con 3 paletas (default-dark, ocean, forest), selector dinámico, preview inmediato, carga externa en runtime, background color en LayoutShell, theme colors propagados a todos los screens.
- [ ] `ch-04`: `bun test` pasa con 100% de strings extraídos; `grep -r "hardcode" src/screens/ src/components/` retorna 0 resultados.  
  **Nota:** Locales existen pero no se usan en componentes. Requiere integrar `react-i18next`.

### Fase 2
- [ ] `ch-05`: Tabla `ssh_keys` existe en SQLite; deploy de servidor crea par Ed25519; `ssh -i <key> user@host` conecta sin password.  
  **Bloqueante:** Sin esto, ch-06~11 permanecen como stubs.
- [ ] `ch-06`: **DADO** server en `status='running'`, **CUANDO** se presiona Stop, **ENTONCES** status cambia a `stopped` y contenedor se detiene via `docker compose down` vía SSH.  
  **Nota:** Pulumi deploy existe; Stop/Start/Update son stubs.
- [ ] `ch-07`: **DADO** cambio de branch confirmado, **CUANDO** se aplica, **ENTONCES** ejecuta `docker compose pull` y reinicia contenedor con nueva imagen vía SSH.  
  **Nota:** UI de selección de branch existe; acción remota es stub.
- [ ] `ch-08`: Lista de jugadores muestra nombres reales desde RCON sobre SSH tunnel; Kick/Ban abren modal de confirmación antes de ejecutar.  
  **Nota:** Lista es mock local. Requiere RCON real.
- [ ] `ch-09`: Métricas CPU/Memoria coinciden con `docker stats` del host vía SSH; logs streaming se cierra con `q` sin crash.  
  **Nota:** Stats son mock. Logs streaming muestra snapshot estático.
- [ ] `ch-10`: Backup `.tar.gz` se crea en disco local vía SFTP, se registra en tabla `backups` con timestamp y tamaño.  
  **Nota:** `BackupRecord` type existe. Panel usa backups mock.
- [ ] `ch-11`: **DADO** tarea creada en Scheduler, **CUANDO** se guarda, **ENTONCES** aparece en `crontab -l` de la VM remota con formato válido vía SSH.  
  **Nota:** Panel existe con tasks mock.

### Fase 3
- [ ] `ch-12`: File picker navega directorios locales, selecciona archivos, no abre diálogos nativos del OS.  
  **Nota:** Componente no existe.
- [ ] `ch-13`: **DADO** archivo `.ini` abierto, **CUANDO** se edita y guarda con `Ctrl+S`, **ENTONCES** `cat` vía SSH muestra el cambio en la VM remota.  
  **Nota:** Componente no existe.
- [ ] `ch-14`: Panel Advanced Settings lista archivos reales del volumen del servidor vía SFTP; permite editar, reemplazar y descargar.  
  **Nota:** Panel existe con archivos mock.
- [ ] `ch-15`: Wizard paso 2 lista proyectos GCP reales del usuario autenticado vía `gcloud`; ping a regiones se mide y ordena por latencia.  
  **Nota:** Catálogo local implementado. Auth gcloud real pendiente.
- [ ] `ch-16`: **DADO** wizard completado, **CUANDO** se confirma deploy, **ENTONCES** Pulumi crea VM, Docker arranca, health check RCON pasa, status = `running`, IP pública asignada.  
  **Nota:** Deploy Pulumi existe. Health checker actual es `NoopServerHealthChecker` (siempre true). **Debe reemplazarse por health check RCON real antes de MVP.**
- [ ] `ch-17`: **DADO** server activo, **CUANDO** se archiva, **ENTONCES** se ejecuta backup obligatorio, `pulumi destroy` limpia infraestructura GCP, status = `archived`.  
  **Nota:** Acción en UI es stub.
- [ ] `ch-18`: **DADO** backup de server archivado, **CUANDO** se inicia restore wizard, **ENTONCES** crea nueva VM, copia backup, arranca servidor, status = `running`.  
  **Nota:** Wizard de restore no existe.

### Fase 4
- [ ] `ch-19`: **DADO** input inválido en formulario, **CUANDO** se intenta `Queue Changes`, **ENTONCES** se bloquea y muestra error en rojo junto al campo.  
  **Nota:** Requiere instalar `zod` (no está en `package.json`). Validaciones actuales son manuales.
- [ ] `ch-20`: **DADO** acción destructiva (destroy, archive, delete), **CUANDO** se selecciona, **ENTONCES** aparece modal con `[Cancelar]` como default focus y `[Confirmar]` requiere doble confirmación.  
  **Nota:** `ApplyPendingChangesModal` existe. Faltan modales genéricos para acciones destructivas.
- [ ] `ch-21`: **DADO** cambios pendientes en buffer global, **CUANDO** se navega entre pantallas, **ENTONCES** banner amarillo muestra conteo exacto de changes no aplicados.  
  **Nota:** `PendingChangesBanner` implementado. Faltan toast notifications genéricos.

### Fase 5
- [ ] `ch-22`: **DADO** deploy con `status='failed'`, **CUANDO** se abre server, **ENTONCES** muestra 3 opciones: `[Retry]` re-ejecuta ch-16, `[Destroy]` limpia recursos parciales, `[Debug SSH]` abre shell remoto.  
  **Nota:** Errores se guardan en DB. Faltan opciones de recovery en UI.
- [ ] `ch-23`: **DADO** selector de proveedor, **CUANDO** se muestra, **ENTONCES** AWS y Azure aparecen deshabilitados con label "Coming Soon" y tooltip de fecha estimada.  
  **Nota:** Texto "Coming Soon" existe en `ProviderRegionPanel`. Verificar en wizard Paso 1.

---

## Inventario de Gaps Críticos

| # | Gap | Impacto | Change Relacionado |
| :--- | :--- | :--- | :--- |
| 1 | **SSH real no existe** | Todo Fase 2 es stub sin side effects remotos | ch-05 |
| 2 | **Health checker es Noop** | Deploy puede marcar `running` sin servidor funcional | ch-16 |
| 3 | **Zod no instalado** | Validaciones frágiles, manuales | ch-19 |
| 4 | **i18n no integrada** | Strings hardcodeados mezclados ES/EN | ch-04 |
| 5 | **Specs faltantes** | 15 de 24 changes no tienen spec escrito | — |

