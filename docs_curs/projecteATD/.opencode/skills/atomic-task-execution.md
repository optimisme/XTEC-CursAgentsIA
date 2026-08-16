# Skill: Atomic Task Execution

## Descripció
Executar una sola tasca atòmica del pla i evitar scope creep.
Aquesta skill garanteix que cada agent executor se centri exclusivament en la tasca assignada.

## Principis
- Una tasca = un focus = un conjunt de canvis limitats
- No avançar tasques futures
- No implementar funcionalitats extra
- Fer canvis mínims per complir els criteris de validació

## Flux d'execució
1. Rebre la tasca assignada per l'orchestrator
2. Llegir "Què s'ha d'implementar" de la tasca
3. Llegir els criteris de validació
4. Implementar només el necessari
5. Confirmar que els criteris es compleixen
6. Informar a l'orchestrator que la tasca està llesta

## Prevenció de Scope Creep
- NO crear arxius no mencionats a la tasca
- NO modificar funcions no relacionades
- NO afegir funcionalitats extra
- NO canviar l'estructura del projecte
- Si una tasca requereix molts canvis, proposar dividir-la

## Abast per Fase

### Fase 1 - HTML i CSS bàsic
- Crear arxius HTML/CSS/JS bàsics
- Estructura inicial del projecte

### Fase 2 - Dades i estat
- Definir estructures de dades JavaScript

### Fase 3 - Renderitzat
- Funcions de dibuix al canvas

### Fase 4 - Controls
- Moviment de peces i interacció

### Fase 5 - Mecàniques de joc
- Fixació de peces, eliminació de línies

### Fase 6 - Game Over
- Detecció i reinici

### Fase 7-8 - Validació
- Tests i correccions (no implementa codi, només validacions)
