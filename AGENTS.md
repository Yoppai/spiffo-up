# AGENTS.md

## Comandos verificados
- Instalar dependencias: `bun install`.
- Ejecutar TUI: `bun run index.tsx` (`README.md` dice `index.ts`, está desactualizado).
- Dev con watch: `bun --watch run index.tsx`.
- Tests: `bun test`; modo watch: `bun test --watch`.
- Build Node: `bun build ./index.tsx --outdir ./dist --target node`.
- Binario local: `bun build ./index.tsx --compile --outfile spiffo-up`.
- No hay scripts declarados para lint, formatter o typecheck; no inventes `npm`/`pnpm` commands.

## Estructura real
- Proyecto single-package Bun + TypeScript ESM; `package.json` expone bin `spiffo-up -> ./index.tsx`.
- Entry point único: `index.tsx`, con shebang Bun, renderiza Ink y espera `waitUntilExit()`.
- Shell de navegación actual: `src/cli/router.tsx`, usa `MemoryRouter` de `react-router` y reexporta hooks.
- `src/` todavía es mínimo; no asumas capas existentes más allá de lo que veas.

## Toolchain y imports
- `tsconfig.json`: `moduleResolution: "bundler"`, `allowImportingTsExtensions: true`, `verbatimModuleSyntax: true`, `noEmit: true`, `strict: true`, `jsx: react-jsx`, `types: ["bun"]`.
- Mantén imports ESM compatibles con Bun/bundler; `index.tsx` importa `./src/cli/router.js` aunque el archivo fuente sea `.tsx`.
- Artifacts ignorados: `node_modules`, `dist`, `out`, `coverage`, `.env*`, logs y caches.

## Producto y arquitectura objetivo
- Producto: CLI/TUI fullscreen para orquestar servidores Project Zomboid multi-cloud; MVP funcional solo en GCP, AWS/Azure como "Coming Soon".
- UI esperada: React 19 + Ink 7, sin subcomandos Commander antes del TUI.
- Estado/config objetivo según OpenSpec: Zustand, Zod + yaml, Pulumi + GCP, SSH/SFTP, RCON, cron-parser/cronstrue, i18next.
- Diseño PRD clave: layout reusable fullscreen con header/status/left menu/right content/footer; `TAB` solo cambia foco entre paneles; `Ctrl+A` abre resumen de cambios pendientes globales.
- Cambios de configuración van a un buffer global de pending changes; no reintroduzcas dirty-state por panel salvo que cambie la spec.

## OpenSpec / flujo de trabajo
- `openspec/config.yaml` pide escribir en español y conservar technical terms, code examples y paths en English.
- Proposals OpenSpec: menos de 1500 palabras y siempre sección `Non-goals`.
- Tasks OpenSpec: chunks máximos de 2 horas.
- En explore mode (`.opencode/commands/opsx-explore.md` y skill local), trabajar read-only: investigar, pensar y crear artefactos OpenSpec; no implementar código.
