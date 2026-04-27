## MODIFIED Requirements

### Requirement: Menú global navegable
El sistema SHALL iniciar en Nivel 0 con foco en el panel izquierdo y un menú global navegable por teclado, incluyendo acceso al Setup Wizard desde `Crear Nuevo Servidor`.

#### Scenario: Foco inicial
- **WHEN** la app carga el dashboard global
- **THEN** el foco está en el panel izquierdo y el menú global muestra la opción seleccionada

#### Scenario: Navegación vertical del menú
- **WHEN** el foco está en el panel izquierdo y el usuario presiona `↑` o `↓`
- **THEN** la selección del menú global cambia y el panel derecho actualiza su título y contenido de preview

#### Scenario: TAB exclusivo entre paneles
- **WHEN** el usuario presiona `TAB`
- **THEN** el foco alterna entre panel izquierdo y panel derecho sin moverse entre elementos internos del panel

#### Scenario: Entrar al Setup Wizard
- **WHEN** el foco está en el panel izquierdo, `Crear Nuevo Servidor` está seleccionado y el usuario presiona `ENTER`
- **THEN** el sistema abre el Setup Wizard de creación de servidor en lugar de mostrar solo `Coming Soon`
