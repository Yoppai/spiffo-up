# Delta for Local Server Inventory

## ADDED Requirements

### Requirement: Campos opcionales de backup en ServerRecord
El sistema SHALL permitir que `ServerRecord` incluya `backupPath?: string | null` y `backupSize?: number | null` para persistir metadatos de backup al archivar.

#### Scenario: Servidor archivado con metadatos
- **GIVEN** un servidor con `status='archived'`, `backupPath` y `backupSize`
- **WHEN** se hidrata en `servers-store`
- **THEN** los campos estan disponibles para la UI sin romper tipos existentes

#### Scenario: Servidor sin metadatos de backup
- **GIVEN** un servidor sin `backupPath` ni `backupSize`
- **WHEN** se usa en componentes de archived servers
- **THEN** no produce error de TypeScript por `strict: true`
