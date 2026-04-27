## ADDED Requirements

### Requirement: Catálogo de regiones y zonas GCP agrupado por continente
El sistema SHALL exponer un catálogo local de zonas GCP agrupadas por continente, con identificador técnico de zona, región padre, ubicación descriptiva y endpoint HTTP usado para medición de latencia.

#### Scenario: Zonas agrupadas por continente
- **WHEN** la UI solicita el catálogo de regiones GCP
- **THEN** el sistema devuelve grupos como `americas`, `europe`, `asia`, `oceania`, `middle east` y `africa` cuando tengan zonas configuradas

#### Scenario: Zona incluye datos descriptivos
- **WHEN** una zona GCP se muestra al usuario
- **THEN** el sistema incluye nombre técnico, ubicación descriptiva y continente sin consultar APIs remotas de GCP

### Requirement: Medición HTTP de latencia para zonas GCP
El sistema SHALL medir latencia HTTP para zonas GCP con timeout corto y SHALL soportar fallback determinista cuando la medición falle o no esté disponible.

#### Scenario: Latencia medida correctamente
- **WHEN** la medición HTTP de una zona responde dentro del timeout
- **THEN** el sistema registra el ping en milisegundos y puede ordenar la zona dentro de su continente por menor latencia

#### Scenario: Latencia en progreso o fallida
- **WHEN** una zona todavía no tiene medición o la medición falla
- **THEN** el sistema muestra `measuring...` o un fallback/estado fallido sin bloquear navegación ni selección

#### Scenario: Tests sin red real
- **WHEN** los tests ejecutan lógica de ordenamiento o render de latencia
- **THEN** el sistema permite inyectar resultados deterministas sin depender de HTTP real

### Requirement: Tiers curados para Project Zomboid
El sistema SHALL exponer tiers curados para servidores Project Zomboid con instance type, vCPU, RAM, memoria JVM sugerida, rango de jugadores, etiqueta, icono y costo estimado.

#### Scenario: Tiers curados visibles
- **WHEN** la UI solicita los tiers recomendados
- **THEN** el sistema incluye `Budget`, `Balanced`, `Performance`, `Growth` y `Heavy/Modded` con los instance types definidos por el PRD

#### Scenario: Costos estimados marcados
- **WHEN** un tier o instancia muestra precio
- **THEN** el sistema muestra costo aproximado por hora y/o mes con prefijo `~` o aviso de precio estimado

#### Scenario: Costos no consultan Billing Catalog API
- **WHEN** el sistema calcula costo estimado en esta feature
- **THEN** usa datos locales hardcodeados y no autentica ni llama Cloud Billing Catalog API

#### Scenario: Boundary de costos reemplazable
- **WHEN** una feature futura integre Cloud Billing Catalog API
- **THEN** la UI puede seguir consumiendo el helper de costo sin depender directamente de la fuente hardcodeada

### Requirement: Catálogo filtrado de instance types GCP para game servers
El sistema SHALL exponer un catálogo filtrado de instance types GCP organizado por familias aptas para servidores de juego y SHALL excluir familias irrelevantes o perjudiciales.

#### Scenario: Categorías filtradas disponibles
- **WHEN** la UI solicita el catálogo completo filtrado
- **THEN** el sistema devuelve categorías como E2, N2, N2D, C2, C2D, Legacy N1 y Advanced 2 vCPU Testing Only

#### Scenario: Instancias perjudiciales excluidas
- **WHEN** se construye el catálogo filtrado
- **THEN** el sistema excluye shared-core, high-cpu con poca RAM, memory-optimized, GPU, storage-optimized y HPC salvo que estén explícitamente listadas para testing

### Requirement: Recomendación por MaxPlayers
El sistema SHALL recomendar un tier/instance type a partir de `MaxPlayers` usando reglas locales deterministas.

#### Scenario: Recomendación para servidor pequeño
- **WHEN** `MaxPlayers` está entre 1 y 8
- **THEN** el sistema recomienda `e2-standard-4` como `Budget`

#### Scenario: Recomendación para servidor balanceado
- **WHEN** `MaxPlayers` está entre 9 y 24 o no hay valor disponible
- **THEN** el sistema recomienda `n2d-standard-4` como `Balanced`

#### Scenario: Recomendación para servidor en crecimiento
- **WHEN** `MaxPlayers` está entre 25 y 48
- **THEN** el sistema recomienda `n2d-standard-8` como `Growth`

#### Scenario: Recomendación para servidor heavy/modded
- **WHEN** `MaxPlayers` es 49 o mayor
- **THEN** el sistema recomienda `c2d-standard-8` como `Heavy/Modded`
