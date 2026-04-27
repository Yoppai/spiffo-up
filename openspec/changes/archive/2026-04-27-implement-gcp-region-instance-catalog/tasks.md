## 1. Catálogo GCP compartido

- [x] 1.1 Crear módulo compartido de catálogo GCP en `src/lib` con tipos para continente, región, zona, tier curado, categoría filtrada e instance type.
- [x] 1.2 Migrar datos de regiones/zonas desde `src/screens/create-server-wizard/catalog.ts` al catálogo compartido, agregando continente, ubicación descriptiva y endpoint HTTP medible.
- [x] 1.3 Definir curated tiers del PRD con `e2-standard-4`, `n2d-standard-4`, `c2-standard-4`, `n2d-standard-8` y `c2d-standard-8`, incluyendo vCPU, RAM, JVM, rango de jugadores y costos estimados.
- [x] 1.4 Definir filtered instance catalog por categorías E2, N2, N2D, C2, C2D, Legacy N1 y Advanced 2 vCPU Testing Only.
- [x] 1.5 Exportar helpers para listar todas las instancias válidas y buscar metadata por `instanceType`.

## 2. Latencia, costos y recomendación

- [x] 2.1 Implementar helper de formato/estado de latencia con soporte para `measuring`, `ok`, `failed` y fallback determinista.
- [x] 2.2 Implementar medición HTTP con timeout corto e interfaz inyectable/testeable, sin bloquear render ni navegación.
- [x] 2.3 Implementar ordenamiento de zonas por ping dentro de cada continente usando mediciones disponibles.
- [x] 2.4 Implementar `estimateGcpInstanceCost()` con costos hardcodeados por hora y mes marcados como estimados, aislando la fuente de datos para futura Cloud Billing Catalog API.
- [x] 2.5 Implementar `recommendInstanceForMaxPlayers()` con rangos `1-8`, `9-24`, `25-48` y `49+`, usando `n2d-standard-4` como fallback.

## 3. Integración Create Server Wizard

- [x] 3.1 Convertir `src/screens/create-server-wizard/catalog.ts` en façade o actualizar imports para consumir el catálogo compartido.
- [x] 3.2 Actualizar el paso `Region` para mostrar continente, ubicación y latencia medida/fallback desde el catálogo compartido.
- [x] 3.3 Actualizar cursores/selección de región y zona en `src/stores/app-store.ts` para usar la estructura compartida sin romper navegación existente.
- [x] 3.4 Actualizar el paso `Instance` para mostrar curated tiers nuevos, costo estimado y marca de recomendación.
- [x] 3.5 Actualizar validación de `create-server-wizard-service.ts` para aceptar cualquier instance type del catálogo filtrado, no solo curated tiers.

## 4. Integración Server Dashboard Provider & Region

- [x] 4.1 Reemplazar arrays locales `regions` e `instances` de `dashboard-panels.tsx` por helpers del catálogo compartido.
- [x] 4.2 Actualizar render de Provider & Region para mostrar latencia, costo estimado y recomendación por `server.playersMax` con fallback.
- [x] 4.3 Actualizar navegación `←→` y queue de cambios para elegir opciones válidas del catálogo compartido y preservar `requiresVmRecreate`.
- [x] 4.4 Mostrar AWS/Azure como `Coming Soon` sin cambiar comportamiento MVP.

## 5. Tests y verificación

- [x] 5.1 Agregar tests unitarios para catálogo: agrupación por continente, instancias excluidas, costos y recomendación por `MaxPlayers`.
- [x] 5.1a Agregar test que confirme que pricing actual usa datos locales y no requiere autenticación/API.
- [x] 5.2 Actualizar tests del Create Server Wizard para región/latencia, tiers nuevos y validación de instancia filtrada.
- [x] 5.3 Actualizar tests del Server Dashboard para costo, recomendación y pending changes de región/instancia.
- [x] 5.4 Ejecutar `bun test` y corregir fallos.
- [x] 5.5 Ejecutar build verificado `bun build ./index.tsx --outdir ./dist --target node`.
