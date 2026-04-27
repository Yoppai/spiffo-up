## Why

La selección actual de región e instancia usa datos mock demasiado pequeños: regiones flat con latencia placeholder, tiers desactualizados y una recomendación hardcodeada. Para que el MVP de GCP sea útil antes del despliegue real, el usuario necesita elegir zona e instance type con señales locales claras: continente, latencia HTTP, costo estimado y recomendación basada en `MaxPlayers`.

## What Changes

- Reemplazar el catálogo GCP mínimo por regiones/zonas curadas agrupadas por continente.
- Medir latencia HTTP para ordenar zonas por ping, con estado `measuring...` y fallback determinista para tests/offline.
- Actualizar los tiers curados para Project Zomboid: `Budget`, `Balanced`, `Performance`, `Growth` y `Heavy/Modded` según el PRD.
- Añadir catálogo filtrado de instance types GCP organizado por familias aptas para servidores de juego.
- Mostrar costos hardcodeados aproximados por hora y mes, marcados como estimados, dejando preparada la separación para una futura integración con Cloud Billing Catalog API.
- Recomendar tier/instance type a partir de `MaxPlayers` del servidor cuando esté disponible, con fallback razonable para drafts.
- Reutilizar el mismo modelo de catálogo en Create Server Wizard y Server Dashboard Provider & Region.
- Mantener cambios de región/instancia como pending changes de infraestructura con `requiresVmRecreate`; no ejecutar cloud APIs ni despliegue real.

## Non-goals

- No consultar Cloud Billing API ni Compute Engine APIs en runtime para esta feature.
- No implementar OAuth ni autenticación contra APIs de Google; una feature posterior usará el OAuth existente de `gcloud CLI` para autenticar Cloud Billing Catalog API.
- No implementar Pulumi deploy, VM recreation, SSH, SFTP, Docker ni RCON.
- No habilitar AWS/Azure; siguen como `Coming Soon` en el MVP.
- No crear un benchmark avanzado de rendimiento de regiones; solo HTTP ping pragmático.
- No persistir histórico de latencias entre sesiones.

## Capabilities

### New Capabilities

- `gcp-cloud-catalog`: Catálogo local de regiones/zonas GCP, medición de latencia HTTP, tiers curados, catálogo filtrado de instancias, costos estimados y recomendación por `MaxPlayers`.

### Modified Capabilities

- `create-server-setup-wizard`: El wizard SHALL usar el catálogo GCP compartido para selección de región/instancia, incluyendo latencia medida/placeholder, costos estimados y selección de instancias fuera de tiers curados cuando estén en el catálogo filtrado.
- `server-dashboard-panels`: El panel Provider & Region SHALL mostrar y seleccionar regiones/instancias desde el catálogo GCP compartido, recomendar por `MaxPlayers` y encolar cambios de infraestructura.

## Impact

- `src/screens/create-server-wizard/catalog.ts` será reemplazado o convertido en fachada del catálogo compartido.
- `src/screens/create-server-wizard/create-server-wizard-screen.tsx` mostrará regiones agrupadas y tiers/catálogo filtrado.
- `src/screens/server-dashboard/dashboard-panels.tsx` dejará de usar arrays locales `regions`/`instances`.
- `src/stores/app-store.ts` y `src/services/create-server-wizard-service.ts` validarán contra el catálogo completo.
- Nuevos helpers probables en `src/lib/` para catálogo, latencia, costos y recomendaciones.
- La estrategia de precios debe aislar datos hardcodeados detrás de helpers para reemplazo futuro por Cloud Billing Catalog API autenticada vía `gcloud CLI` OAuth.
- Tests de wizard, dashboard y validación deberán cubrir agrupación, recomendación, costos y aceptación de instancias filtradas.
