## 1. CLI root y estructura base

- [x] 1.1 Crear las carpetas base bajo `src/`: `cli`, `screens`, `components`, `hooks`, `stores`, `services`, `infrastructure`, `lib`, `types` y `locales`.
- [x] 1.2 Agregar `src/cli/app.tsx` como root component mínimo que renderice el router sin implementar pantallas completas.
- [x] 1.3 Ajustar `index.tsx` y `src/cli/router.tsx` para mantener el binario raíz estable y compatible con imports ESM/Bun.

## 2. Contratos compartidos y estado global

- [x] 2.1 Crear `src/types/index.ts` con tipos mínimos para providers, server status, server record, pending change, settings y navegación global.
- [x] 2.2 Crear stores Zustand granulares: `servers-store.ts`, `pending-changes-store.ts`, `settings-store.ts` y `app-store.ts` con estado inicial y acciones mínimas.
- [x] 2.3 Implementar `src/hooks/use-ink-store.ts` para acceso a Zustand compatible con re-rendering en Ink.

## 3. Boundaries técnicos mínimos

- [x] 3.1 Crear placeholders compilables para `components/`, `screens/`, `services/` y `lib/` que documenten responsabilidades sin implementar flujos funcionales.
- [x] 3.2 Crear `src/infrastructure/database.ts` como adapter inicial de `bun:sqlite` o placeholder explícito para conexión/migración futura, sin schema productivo completo.
- [x] 3.3 Crear `src/locales/en.json` y `src/locales/es.json` con claves mínimas para validar ubicación de i18n.

## 4. Verificación

- [x] 4.1 Agregar tests mínimos de estructura/contrato para imports públicos, stores y `useInkStore` si aplica.
- [x] 4.2 Ejecutar `bun test` y corregir fallos relacionados con la estructura.
- [x] 4.3 Ejecutar `bun build ./index.tsx --outdir ./dist --target node` y asegurar que el proyecto compila.
