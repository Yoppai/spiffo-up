## Context

El proyecto ya tiene una base para pending changes: `PendingChange`, `usePendingChangesStore`, tabla SQLite `pending_changes`, `LocalInventoryService` e hidratación al arrancar. La TUI actual solo muestra un conteo en el footer y no tiene `Ctrl+A`, modal, indicadores por panel ni flujo apply/discard.

El PRD define el patrón central: editar en formularios locales, encolar con `Queue Changes`, acumular en buffer global y aplicar todo mediante `Apply All`. La regla de producto para este cambio es que no hay dirty-state por panel; los edits no encolados no bloquean navegación ni disparan modales intermedios.

La implementación debe respetar el estado actual del MVP: UI y persistencia local sí; side effects remotos reales no. Por eso el pipeline se diseña como planner/executor local que calcula impacto, orden y resultado, pero no llama Pulumi, SSH, SFTP, Docker ni RCON.

## Goals / Non-Goals

**Goals:**

- Hacer visible y accionable el buffer global desde el Server Dashboard.
- Enrutar `Ctrl+A` globalmente hacia un modal único de `Apply Pending Changes`.
- Agrupar cambios por panel y calcular un resumen de impacto total.
- Soportar `Apply All`, `Discard All` y `Back to Edit` con actualización coherente de store y SQLite.
- Conservar navegación `TAB` solo como cambio de foco entre paneles.
- Probar stores, servicios puros y flujo de teclado/render con `bun test`.

**Non-Goals:**

- Ejecutar operaciones remotas reales de infraestructura, build, Docker, SSH, SFTP o RCON.
- Implementar los formularios completos que producen todos los tipos de cambio.
- Crear dirty-state por panel o modales de unsaved local edits.
- Crear un modal stack; seguirá existiendo un modal activo como máximo.

## Decisions

### 1. Modal state en app store, cambios en pending changes store

El estado de visibilidad del modal y selección de acción vive en `useAppStore`, porque afecta navegación global y bloqueo de input. Los datos del buffer, agrupaciones y conteos viven en `usePendingChangesStore`, porque son dominio de pending changes.

Alternativa considerada: guardar todo en `pending-changes-store`. Se descarta porque mezcla navegación/modal focus con datos de dominio y complica `ESC`, `Ctrl+A` y cierre del dashboard.

### 2. Pipeline local planificado, sin side effects remotos

`Apply All` usará un servicio local que ordena cambios por impacto (`infrastructure` → `build` → `env` → `ini/lua`), genera pasos/resultados y limpia el buffer si el plan termina exitosamente. En esta etapa los pasos son simulados/no-op remoto.

Alternativa considerada: ejecutar ya Pulumi/SSH/SFTP/Docker. Se descarta porque las capacidades actuales todavía prohíben side effects remotos y faltan adaptadores completos.

### 3. Tipos explícitos de cambio e impacto derivados

Se añadirá un tipo/campo de categoría para distinguir `env`, `ini-lua`, `build` e `infrastructure`. El impact summary se deriva de la colección completa, no de strings del label.

Alternativa considerada: inferir tipo desde `panel` o `field`. Se descarta por fragilidad: `Basic Settings` mezcla env vars e INI (`Description`) y un panel no siempre equivale a un solo impacto.

### 4. Indicadores leídos desde el buffer persistido

Banner, dots del sub-menú, footer y botón `Apply All Changes` se renderizan desde el buffer global hidratado. Si el usuario reinicia la app, los indicadores reaparecen porque SQLite sigue siendo fuente persistente local.

Alternativa considerada: indicadores UI-only en estado local. Se descarta porque rompería la persistencia ya definida para pending changes.

### 5. Regla no-dirty por panel como contrato UX

El cambio no agrega modales al salir de paneles con edits locales no encolados. Solo `Ctrl+A`, `Apply All Changes`, `ESC` desde Server Dashboard o `Back to Servers` interactúan con el buffer global.

Alternativa considerada: seguir las secciones antiguas del PRD que mencionan modales de unsaved state en Basic Settings/Admins. Se descarta por conflicto con la nota arquitectónica global y la regla explícita del cambio.

### 6. Secrets cifrados con passphrase de sesión

Los pending changes sensibles, como admin passwords, se persistirán cifrados en SQLite usando `AES-256-GCM`. La clave de cifrado se derivará desde una passphrase ingresada por el usuario con `scrypt` y se mantendrá solo en memoria durante la sesión. La UI y el store de presentación mostrarán `[changed]` y no hidratarán plaintext de secrets.

Alternativas consideradas:
- `bcrypt`: se descarta porque es hashing de una sola vía; permite verificar una contraseña, pero no recuperar el valor para `Apply All`.
- OS keychain: se deja para mejora futura porque agrega dependencias nativas y complejidad de packaging cross-platform.
- Guardar una key junto a la DB: se descarta porque si alguien copia DB + key, el cifrado pierde valor práctico.

Esta opción prioriza simplicidad y portabilidad: funciona con `node:crypto` en Bun, no requiere dependencia nativa y protege la DB en reposo. El trade-off es que el usuario debe desbloquear la sesión con la passphrase antes de aplicar cambios sensibles; si la olvida, esos secrets no se pueden recuperar y debe descartarlos o reingresarlos.

## Risks / Trade-offs

- Pipeline simulado puede parecer más completo de lo que es → Mitigación: mostrar resultados como aplicación local/planificada y mantener no-goal explícito de side effects remotos.
- `PendingChange` actual no tiene categoría explícita → Mitigación: migrar de forma backwards-compatible tratando cambios antiguos como `env` o `unknown` solo para resumen visual.
- Modal global puede capturar inputs que antes navegaban → Mitigación: centralizar input routing: si modal abierto, solo modal maneja `←`, `→`, `ENTER`, `ESC`.
- PRD contiene textos contradictorios sobre dirty state → Mitigación: specs de este cambio fijan normativamente que no hay dirty-state por panel.
- Passphrase olvidada hace irrecuperables los secrets cifrados → Mitigación: permitir `Discard All` o reingresar el secret desde el panel correspondiente.
- Plaintext de secrets puede filtrarse si entra al store/UI/test snapshots → Mitigación: descifrar solo en el boundary de apply y mantener valores sensibles enmascarados en Zustand/componentes.

## Migration Plan

1. Extender tipos y store de pending changes de forma compatible con datos existentes.
2. Agregar helpers de cifrado con `scrypt` + `AES-256-GCM` para pending changes sensibles.
3. Agregar servicio local de planning/apply/discard sin side effects remotos.
4. Conectar UI: footer, banner, dots, botón y modal.
5. Conectar teclado global, bloqueo de input cuando el modal está abierto y prompt/desbloqueo de passphrase para secrets sensibles.
6. Agregar tests y ejecutar `bun test`.

Rollback: revertir el cambio deja el schema SQLite existente intacto. Los registros viejos de `pending_changes` siguen siendo legibles por la versión anterior porque los campos nuevos deben ser opcionales o tener defaults.

## Open Questions

- Ninguna abierta para este cambio. No se persistirá historial de `Apply All`; los pending secrets se persistirán cifrados y la UI solo mostrará valores enmascarados.
