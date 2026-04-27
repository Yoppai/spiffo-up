## Purpose

Define el comportamiento de diagnóstico e instalación asistida del Pulumi CLI para permitir deploy GCP sin configuración manual previa.

## Requirements

### Requirement: Diagnóstico de Pulumi CLI antes de deploy
El sistema SHALL diagnosticar disponibilidad y versión del Pulumi CLI antes de ejecutar operaciones Pulumi locales para deploy, destroy o status.

#### Scenario: Pulumi CLI disponible
- **WHEN** el usuario inicia una acción GCP que requiere Pulumi y el CLI está disponible con versión compatible
- **THEN** el sistema marca el preflight como `ready` y permite continuar hacia la operación Pulumi solicitada

#### Scenario: Pulumi CLI faltante
- **WHEN** el usuario inicia una acción GCP que requiere Pulumi y el CLI no existe en `PATH` ni en el directorio gestionado por la app
- **THEN** el sistema no ejecuta `pulumi up`, muestra estado `missing` y ofrece instalación asistida o instrucciones manuales

#### Scenario: Versión incompatible
- **WHEN** el Pulumi CLI detectado existe pero no cumple la versión mínima configurada
- **THEN** el sistema bloquea la operación remota y ofrece actualizar mediante instalación asistida o instrucciones manuales

### Requirement: Instalación asistida opt-in
El sistema SHALL permitir instalar Pulumi CLI desde la app solo después de confirmación explícita del usuario, usando una versión pinneada y un directorio gestionado por la app.

#### Scenario: Usuario confirma instalación
- **WHEN** el usuario confirma `Install Pulumi` desde el TUI
- **THEN** el sistema descarga/instala el Pulumi CLI pinneado en app data y no modifica `PATH` global del sistema

#### Scenario: Usuario rechaza instalación
- **WHEN** el usuario rechaza o cancela la instalación asistida
- **THEN** el sistema conserva el servidor sin deploy remoto y muestra instrucciones manuales por plataforma

#### Scenario: Instalación falla
- **WHEN** la descarga o instalación del CLI falla
- **THEN** el sistema muestra estado `failed`, redacted error, instrucciones manuales y una acción de retry

### Requirement: Uso explícito del CLI gestionado
El sistema SHALL usar el Pulumi CLI gestionado por la app cuando exista, sin depender de que el usuario reinicie terminal o actualice `PATH`.

#### Scenario: CLI gestionado instalado
- **WHEN** el Pulumi CLI fue instalado por la app y el usuario reintenta deploy
- **THEN** el sistema usa ese binario mediante el wrapper de Automation API y continúa sin requerir `PATH` global

#### Scenario: CLI del sistema disponible
- **WHEN** el usuario ya tiene Pulumi CLI compatible en `PATH`
- **THEN** el sistema usa el CLI del sistema sin instalar otra copia

### Requirement: Tests sin descargas ni cloud real
El sistema SHALL permitir probar diagnóstico e instalación con fakes, sin descargar Pulumi ni crear recursos GCP durante `bun test`.

#### Scenario: Test de CLI faltante
- **WHEN** un test simula ausencia de Pulumi CLI
- **THEN** el sistema produce estado `missing` sin ejecutar red ni comandos reales

#### Scenario: Test de instalación exitosa
- **WHEN** un test simula instalación exitosa
- **THEN** el sistema produce estado `ready` y el deployer recibe un comando Pulumi falso o inyectado
