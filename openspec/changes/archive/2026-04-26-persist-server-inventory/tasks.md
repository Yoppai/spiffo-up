## 1. Schema SQLite y migración

- [x] 1.1 Implementar schema v1 en `src/infrastructure/database.ts` para `schema_migrations`, `servers`, `settings`, `pending_changes` y `backups`
- [x] 1.2 Configurar helpers de conexión SQLite con pragmas seguros y soporte de `:memory:` para tests
- [x] 1.3 Agregar tests de instalación idempotente del schema y conservación de datos existentes

## 2. Modelos y mapping

- [x] 2.1 Ajustar tipos compartidos para representar campos persistentes mínimos sin romper el TUI actual
- [x] 2.2 Crear mappers row ↔ domain para servers, settings, pending changes y backups
- [x] 2.3 Agregar tests de mapping para nombres SQL (`instance_type`, `static_ip`, `game_branch`) hacia campos usados por el TUI

## 3. Servicio de inventario local

- [x] 3.1 Crear service/repository bajo `src/services/` para CRUD básico de servidores
- [x] 3.2 Agregar operaciones de settings con defaults para `locale`, `theme` y `backup_path`
- [x] 3.3 Agregar operaciones para agregar/listar/limpiar pending changes
- [x] 3.4 Agregar operaciones mínimas para registrar/listar metadatos de backups por servidor
- [x] 3.5 Agregar tests del service usando SQLite `:memory:`

## 4. Seed demo e hidratación

- [x] 4.1 Mover seed demo actual a un flujo idempotente que inserta datos solo si `servers` está vacía
- [x] 4.2 Implementar bootstrap/hydration que carga SQLite hacia `servers-store`, `settings-store` y `pending-changes-store`
- [x] 4.3 Agregar estado o función de inicialización para evitar renderizar datos finales antes de hidratar
- [x] 4.4 Agregar tests de boot con DB vacía, DB poblada y reinicio sin sobrescribir datos persistidos

## 5. Integración TUI segura

- [x] 5.1 Conectar el arranque de la app al bootstrap local sin introducir subcomandos CLI
- [x] 5.2 Verificar que Main Menu y Server Dashboard siguen mostrando active/total servers y pending changes desde stores hidratados
- [x] 5.3 Confirmar que ninguna acción de inventario local dispara Pulumi, SSH, SFTP ni RCON

## 6. Validación

- [x] 6.1 Ejecutar `bun test` y corregir fallos relacionados con persistencia o stores
- [x] 6.2 Ejecutar build verificado `bun build ./index.tsx --outdir ./dist --target node`
- [x] 6.3 Revisar que los artifacts OpenSpec cumplen proposal, design y specs antes de aplicar
