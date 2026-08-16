# Projecte ATD - Agent Environment

## Estructura del projecte

```
projecteATD/
├── .opencode/
│   ├── agents/
│   │   ├── orchestrator.md   # Agent orquestrador principal
│   │   ├── executor.md       # Agent implementador
│   │   ├── validator.md      # Agent validador
│   │   └── reviewer.md       # Agent revisor periòdic
│   └── skills/
│       ├── task-management.md         # Gestió de tasques del pla
│       ├── atomic-task-execution.md   # Execució atòmica de tasques
│       ├── browser-validation.md      # Validació amb navegador
│       └── regression-validation.md   # Comprovació de regressions
├── tasks/
│   └── tasks-tetris.md   # Pla d'implementació (font d'autoritat)
└── AGENTS.md             # Aquest fitxer
```

## Agents

### orchestrator
Orquestrador principal. Coordina el flux `executor → validator` segons el pla de `tasks-tetris.md`. Llegeix tasques pendents `[ ]`, les marca `[p]` per a l'executor, delega la validació al validator, i marca `[x]` només si la validació passa. No implementa codi directament.

### executor
Implementa només la tasca assignada per l'orchestrator. Fa canvis mínims i limitats al seu abast. No avança tasques futures ni marca estats.

### validator
Valida cada tasca implementada utilitzant els criteris de `tasks-tetris.md`. Utilitza **puppeteer mcp** sempre que sigui possible per a verificacions al navegador. Retorna `PASS` o `FAIL` amb explicació concreta. No implementa funcionalitats.

### reviewer
Revisa periòdicament tasques completades `[x]`. Detecta regressions, inconsistències i desviacions del pla. Proposa correccions però no les implementa. Pot usar puppeteer mcp.

## Skills

- **task-management**: Lectura de `tasks-tetris.md`, gestió d'estats `[ ]`, `[p]`, `[x]`, i dependències.
- **atomic-task-execution**: Execució d'una sola tasca atòmica. Evita scope creep.
- **browser-validation**: Validació funcional utilitzant puppeteer mcp.
- **regression-validation**: Comprovació de funcionalitats relacionades després de cada canvi.

## Puppeteer MCP

El sistema disposa de **puppeteer mcp** com a eina de validació al navegador. Està disponible a través de les següents operacions:

- **Navigate**: `puppeteer_puppeteer_navigate(url)` — Obrir la pàgina del joc
- **Screenshot**: `puppeteer_puppeteer_screenshot(name)` — Captura de pantalla
- **Evaluate**: `puppeteer_puppeteer_evaluate(script)` — Executar JavaScript al navegador
- **Click**: `puppeteer_puppeteer_click(selector)` — Clicar elements
- **Fill**: `puppeteer_puppeteer_fill(selector, value)` — Omplir camps
- **Hover**: `puppeteer_puppeteer_hover(selector)` — Hover sobre elements
- **Select**: `puppeteer_puppeteer_select(selector, value)` — Selecció en dropdowns

El validator utilitza puppeteer mcp per:
- Navegar a la pàgina HTML del joc
- Verificar l'existència d'elements del DOM (`#game-canvas`, `#score`, etc.)
- Executar codi JavaScript al context del navegador (`page.evaluate()`)
- Simular interaccions de teclat (fletxes, espai)
- Capturar errors de consola JavaScript
- Fer captures per verificació visual

## Flux de treball

```
orchestrator → executor → validator
                        ↓
                      PASS → marca [x] → següent tasca
                        ↓
                       FAIL → orchestrator → executor → validator
```

Revisions periòdiques del **reviewer** sobre tasques completades `[x]`.

## Pla del projecte (`tasks-tetris.md`)

El fitxer `tasks/tasks-tetris.md` conté el pla d'implementació complet:
- **35 tasques** numerades de T1.1 a T8.3
- **8 fases**: HTML base, Dades, Renderitzat, Controls, Mecàniques, Game Over, Validació, Test final
- Objectiu: Crear un joc Tetris funcional al canvas HTML5
- Font d'autoritat per a l'estat i pla del projecte
