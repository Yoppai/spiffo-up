## Why

El proyecto ya tiene un PRD amplio, dependencias instaladas y un entrypoint Bun + Ink mínimo, pero todavía no existe una estructura técnica que ordene screens, stores, services, infrastructure, hooks, types e i18n. Esta base es necesaria ahora para que los siguientes cambios puedan implementar el TUI y el deploy de Project Zomboid sin mezclar UI, estado global, lógica de negocio y adaptadores técnicos.

## What Changes

- Crear el esqueleto técnico inicial bajo `src/` siguiendo la arquitectura Feature-Based Modular definida en `openspec/PRD.md`.
- Separar responsabilidades en carpetas estables: `cli/`, `screens/`, `components/`, `hooks/`, `stores/`, `services/`, `infrastructure/`, `lib/`, `types/` y `locales/`.
- Introducir módulos base mínimos para el root app, router, stores granulares, wrapper `useInkStore`, tipos compartidos, locales ES/EN y adapter inicial de SQLite via `bun:sqlite`.
- Mantener el entrypoint actual `index.tsx` en la raíz para no romper el binario `spiffo-up` definido en `package.json`.
- Dejar stubs/interfaces concretas de módulo solo donde habiliten la estructura; no implementar pantallas completas ni flujos reales de deploy.
- Añadir tests mínimos de estructura/contrato donde aporten seguridad sin convertir este cambio en implementación funcional.

## Capabilities

### New Capabilities
- `project-structure`: Define la estructura técnica base, límites entre capas, módulos iniciales y contratos mínimos para que futuras features del TUI se integren de forma consistente.

### Modified Capabilities
- None.

## Impact

- Afecta principalmente `src/` y puede ajustar imports del entrypoint raíz `index.tsx` hacia `src/cli/app.tsx` o `src/cli/router.tsx`.
- No añade dependencias nuevas; usa stack existente: Bun, TypeScript, React Ink, Zustand, Zod/yaml, i18next y `bun:sqlite`.
- No cambia comportamiento observable de deploy, cloud, SSH, SFTP, RCON ni Pulumi.
- Establece convenciones para próximos cambios: screens por feature, components puros, stores granulares, services como lógica de negocio e infrastructure como wrappers técnicos.

## Non-goals

- No implementar el layout fullscreen visual del dashboard.
- No implementar navegación real entre Menú Global, Server Dashboard o Wizard.
- No ejecutar deploys reales ni crear infraestructura GCP/Pulumi.
- No implementar SSH/SFTP/RCON funcional.
- No completar el schema SQLite ni migraciones productivas más allá de una base mínima si resulta necesaria para compilar.
- No reestructurar el PRD ni cambiar decisiones arquitectónicas ya documentadas.
