## 1. Panel Architecture

- [x] 1.1 Extract Server Dashboard panel metadata/router from `server-dashboard-screen.tsx` while preserving current menu labels and shell behavior.
- [x] 1.2 Add a panel UI state model for right-panel cursors, action cursors, sub-view mode, draft values and validation errors.
- [x] 1.3 Route right-panel input from `DashboardScreen` to panel-specific handlers only when `focusedPanel === 'right'`.
- [x] 1.4 Ensure `TAB`, `ESC`, `Ctrl+A`, left-menu navigation and `Back to Servers` keep existing global behavior.

## 2. Mock/Stub Boundaries

- [x] 2.1 Define typed mock dashboard adapter interfaces for lifecycle, players, stats/logs, advanced files, scheduler and backups.
- [x] 2.2 Implement deterministic mock data and stub results with clear `Mock`/`Stub` labels where user-visible.
- [x] 2.3 Add helpers for image tag mapping, instance tier display, estimated costs, config filenames and simple cron validation.

## 3. Read-Only and Action Panels

- [x] 3.1 Implement `Server Management` panel actions, horizontal navigation and archive confirmation stub.
- [x] 3.2 Implement `Players` table with row/action navigation and kick/ban/message stub behavior.
- [x] 3.3 Implement `Stats` panel with mock metrics, logs snapshot, refresh action and logs sub-view stub.
- [x] 3.4 Implement `Advanced Settings` file list and edit/replace/download sub-view or result stubs.
- [x] 3.5 Implement `Scheduler` list/edit thin UI with cron validation and local stub save/delete behavior.
- [x] 3.6 Implement `Backups` history, create backup stub and restore/delete confirmation stubs.

## 4. Pending Changes Panels

- [x] 4.1 Implement `Provider & Region` main view, region selector and instance selector with infrastructure pending changes.
- [x] 4.2 Implement `Build` branch selector and `Queue Changes` behavior with build pending change metadata.
- [x] 4.3 Implement `Basic Settings` form drafts, validation and `Queue Changes` for env/ini-lua fields.
- [x] 4.4 Implement `Admins` form drafts, validation and sensitive pending changes for password.
- [x] 4.5 Verify panel dots, banner and `Ctrl+A` modal reflect newly queued panel changes.
- [x] 4.6 Verify navigating away from unqueued drafts does not open dirty-state modals or auto-enqueue changes.

## 5. Tests and Verification

- [x] 5.1 Add render tests proving every Server Dashboard panel shows specific content instead of future placeholders.
- [x] 5.2 Add input tests for right-panel vertical/horizontal navigation and `TAB` focus semantics.
- [x] 5.3 Add pending change tests for Provider & Region, Build, Basic Settings and Admins metadata.
- [x] 5.4 Add stub action tests for destructive confirmations and no remote side effects.
- [x] 5.5 Run `bun test` and fix failures.
- [x] 5.6 Run `bun build ./index.tsx --outdir ./dist --target node` and fix failures.
