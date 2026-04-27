## Context

El código actual ya tiene dos superficies que necesitan selección cloud: Create Server Wizard y Server Dashboard Provider & Region. Ambas consumen datos locales desde `src/screens/create-server-wizard/catalog.ts`, pero el catálogo es mínimo: cuatro regiones flat, latencia placeholder, cinco tiers simples y validación limitada a esos tiers.

El PRD pide una experiencia más útil para GCP antes de integrar cloud real: regiones/zonas agrupadas por continente, medición HTTP de latencia, tiers curados, catálogo filtrado, costos aproximados y recomendación por `MaxPlayers`. El cambio debe seguir siendo local/thin UI: no Pulumi, no Compute Engine API, no Billing API.

## Goals / Non-Goals

**Goals:**

- Centralizar datos y helpers GCP en un catálogo compartido por wizard y dashboard.
- Representar regiones/zonas con continente, ciudad/ubicación y endpoint HTTP medible.
- Permitir latencia medida con fallback determinista para tests/offline.
- Separar curated tiers de filtered catalog sin duplicar lógica de validación.
- Calcular costos hardcodeados aproximados por hora/mes y mostrar aviso de estimación, con una interfaz separada para migrar después a Cloud Billing Catalog API.
- Recomendar instance type desde `MaxPlayers` usando reglas simples y testeables.
- Mantener pending changes de infraestructura cuando cambian región o instance type.

**Non-Goals:**

- No consultar Cloud Billing Catalog API ni precios reales en esta feature.
- No implementar OAuth ni autenticación contra APIs de Google; una feature posterior reutilizará el OAuth de `gcloud CLI` para Cloud Billing Catalog API.
- No persistir latencia entre sesiones.
- No implementar deploy ni recreación de VM.
- No añadir AWS/Azure funcional.

## Decisions

### 1. Catálogo compartido bajo `src/lib`

Crear un módulo tipo `src/lib/gcp-catalog.ts` o carpeta `src/lib/gcp-catalog/` con datos y funciones puras:

- `gcpRegionGroups` / `getGcpZonesByContinent()`
- `curatedInstanceTiers`
- `filteredInstanceCategories`
- `allGameServerInstanceTypes`
- `estimateGcpInstanceCost(instanceType)`
- `recommendInstanceForMaxPlayers(maxPlayers)`

**Rationale:** evita que wizard y dashboard diverjan. `src/screens/create-server-wizard/catalog.ts` puede quedar como façade de compatibilidad para reducir refactor.

**Alternativa considerada:** mantener datos dentro del wizard y copiar al dashboard. Se descarta porque ya existe duplicación con arrays locales en `dashboard-panels.tsx`.

### 2. Latencia como boundary inyectable/fallback-friendly

La medición HTTP debe vivir separada de la data estática, por ejemplo `measureHttpLatency(url, options)`, con timeout corto y resultado tipado (`measuring`, `ok`, `failed`). La UI puede iniciar con valores fallback/placeholder y renderizar `measuring...` o `failed` sin bloquear navegación.

**Rationale:** Bun test e Ink no deben depender de red real. La lógica de ordenamiento puede aceptar un mapa `zoneId -> pingMs` para ser determinista.

**Alternativa considerada:** medir latencia directamente dentro de componentes React. Se descarta por acoplar UI a side effects y dificultar tests.

### 3. Validación contra catálogo completo

`validateWizardDraft()` SHALL aceptar cualquier `instanceType` presente en curated tiers o filtered catalog. Curated tiers son destacados, no el universo completo.

**Rationale:** el PRD permite seleccionar instancias desde categorías expandibles; validarlas solo contra tiers bloquearía selecciones válidas.

### 3.5. Pricing hardcoded detrás de un boundary reemplazable

Para esta feature, los precios serán datos locales hardcodeados y versionados junto al catálogo. La UI consumirá helpers como `estimateGcpInstanceCost(instanceType)` y no leerá tablas directamente.

**Rationale:** permite cumplir el MVP offline y evita complejidad de auth, SKU mapping, moneda y regiones. En una feature posterior, ese helper podrá delegar en Cloud Billing Catalog API usando el OAuth ya disponible desde `gcloud CLI`.

**Alternativa considerada:** integrar Cloud Billing Catalog API ahora. Se descarta porque ampliaría scope con autenticación, cache, errores de API y mapeo de SKUs; el PRD actual pide costos hardcodeados.

### 4. Recomendación simple por rangos de `MaxPlayers`

Usar reglas explícitas:

- `1-8` → `e2-standard-4`
- `9-24` → `n2d-standard-4`
- `25-48` → `n2d-standard-8`
- `49+` → `c2d-standard-8`

`c2-standard-4` permanece como opción `Performance`, pero no default automático salvo que luego exista preferencia de performance.

**Rationale:** coincide con el PRD y mantiene una recomendación predecible. Si `MaxPlayers` no existe, usar `n2d-standard-4`.

### 5. UI incremental, sin navegación compleja nueva si no cabe

La implementación puede empezar con render agrupado y selección lineal existente (`↑↓`, `←→`, `ENTER`) antes de un árbol expandible completo, siempre que la spec de catálogo/validación quede lista.

**Rationale:** el TUI actual es thin UI; meter un sub-router complejo en esta tarea aumenta riesgo. Las categorías pueden renderizarse como headers + filas seleccionables.

## Risks / Trade-offs

- **Red real lenta o bloqueada** → usar timeout corto, fallback y tests con medición inyectada.
- **Catálogo/precios hardcodeados quedan viejos** → marcar precios con `~`, centralizar datos y mantener boundary compatible con futura Cloud Billing Catalog API.
- **Más filas que altura terminal** → mantener render compacto y aprovechar patrones existentes; scroll avanzado puede quedar para cambio posterior si excede alcance.
- **`MaxPlayers` no está persistido todavía** → usar `server.playersMax` si existe y fallback `20`; documentar futura lectura de `${SERVERNAME}.ini`.
- **Refactor toca wizard + dashboard + service** → crear helpers puros primero y cubrir con tests unitarios antes de ajustar UI.
