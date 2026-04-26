## Context

El repositorio actual es un single-package Bun + TypeScript ESM con `index.tsx` como binario real y `src/cli/router.tsx` como router mínimo. El PRD define una TUI fullscreen React Ink para orquestar servidores Project Zomboid multi-cloud, con MVP funcional en GCP y AWS/Azure como "Coming Soon".

La arquitectura decidida en `openspec/PRD.md` es Feature-Based Modular: co-locar pantallas principales en `screens/<feature>/`, mantener componentes puros en `components/`, stores Zustand granulares, `services/` para lógica de negocio e `infrastructure/` para wrappers técnicos. Este cambio crea esa base sin implementar el producto funcional.

## Goals / Non-Goals

**Goals:**
- Establecer la estructura de carpetas base bajo `src/` conforme al PRD.
- Mantener `index.tsx` en la raíz como entrypoint del binario y mover la composición principal a `src/cli/app.tsx`.
- Preparar boundaries para UI, hooks, stores, services, infrastructure, lib, types y locales.
- Crear contratos mínimos para stores granulares y tipos compartidos sin implementar flujos reales.
- Incluir `useInkStore` como regla de acceso a Zustand desde componentes Ink.
- Agregar placeholders/stubs útiles que compilen y guíen próximos cambios.

**Non-Goals:**
- Construir el layout fullscreen visual completo.
- Implementar navegación real de dashboard, wizard o server detail.
- Implementar deploy, Pulumi Automation API, SSH, SFTP, RCON o backups reales.
- Completar migraciones productivas SQLite o cifrado de claves.
- Añadir dependencias nuevas.

## Decisions

### 1. Mantener `index.tsx` en la raíz

`package.json` expone `spiffo-up -> ./index.tsx`, así que el entrypoint raíz se mantiene. La composición React se delega a `src/cli/app.tsx` y el router queda en `src/cli/router.tsx`.

Alternativa considerada: mover el entrypoint a `src/cli/index.tsx`, como muestra el PRD. Se descarta por ahora porque implicaría cambiar `package.json` y el binario antes de tener valor funcional.

### 2. Usar Feature-Based Modular del PRD como fuente de verdad

La estructura base seguirá:

```text
src/
├── cli/
├── screens/
├── components/
├── hooks/
├── stores/
├── services/
├── infrastructure/
├── lib/
├── types/
└── locales/
```

Alternativa considerada: arquitectura más layered con `ui/`, `domain/`, `state/` y `config/`. Se descarta porque divide pantallas TUI entre demasiadas carpetas y contradice la decisión del PRD de evitar Clean Architecture estricta.

### 3. Stores granulares desde el inicio

Se crean módulos separados para `servers-store`, `pending-changes-store`, `settings-store` y `app-store`. Cada store representa un dominio global distinto y evita un store monolítico.

Alternativa considerada: un único `app-store`. Se descarta porque el PRD ya identifica re-rendering y persistencia selectiva como riesgos; stores pequeños son más testeables.

### 4. `useInkStore` obligatorio para componentes que lean Zustand

El hook `src/hooks/use-ink-store.ts` encapsula el workaround documentado en el PRD para forzar re-render en Ink cuando cambia un store externo.

Alternativa considerada: usar directamente `useStore` de Zustand. Se descarta porque el PRD documenta el problema de Ink + Zustand y establece una regla de oro.

### 5. `services/` orquesta, `infrastructure/` adapta

`services/` contendrá casos de uso como deploy, lifecycle, backup, scheduler y pricing. `infrastructure/` contendrá wrappers concretos para `bun:sqlite`, Pulumi, GCP, SSH/SFTP y networking. No se crean interfaces abstractas si solo existe una implementación.

Alternativa considerada: crear puertos/interfaces para cada integración. Se descarta por YAGNI y por la regla del PRD: no abstracciones sin implementación alternativa.

### 6. `lib/` para reglas puras

Funciones sin side effects como validators, formatters, paths y cálculo de memoria JVM viven en `lib/`. Esto preserva testabilidad sin introducir una carpeta `domain/` pesada.

## Risks / Trade-offs

- Estructura demasiado amplia para un cambio inicial → Mitigación: crear solo módulos base/stubs necesarios y posponer archivos específicos de cada pantalla hasta sus cambios.
- Stubs que parezcan funcionales → Mitigación: nombrar exports y comentarios de forma clara, sin simular deploys reales.
- `services/` puede crecer como god folder → Mitigación: mantener un archivo por caso de uso y mover lógica pura a `lib/`.
- SQLite base incompleta → Mitigación: limitar este cambio al adapter/migration hook inicial; schema completo queda para cambio de persistencia/inventario.
- Tests frágiles por estructura → Mitigación: validar contracts mínimos e imports públicos, no snapshots de árbol completo.

## Migration Plan

1. Crear carpetas y módulos base bajo `src/`.
2. Agregar `src/cli/app.tsx` como root component mínimo y mantener `index.tsx` como launcher.
3. Ajustar `src/cli/router.tsx` para seguir compilando con el nuevo root app.
4. Añadir stores, hooks, types, locales y infrastructure/database mínimos.
5. Ejecutar `bun test` y `bun build ./index.tsx --outdir ./dist --target node`.

Rollback: revertir archivos creados bajo `src/` y restaurar `index.tsx`/`router.tsx` si algún import se ajusta.

## Open Questions

- ¿El schema SQLite completo se implementará en un cambio dedicado de persistencia o junto al primer flujo de creación de servidor?
- ¿Los themes vivirán inicialmente en `components/`, `lib/` o una carpeta futura dedicada cuando se implemente Global Settings?
