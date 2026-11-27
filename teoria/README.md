# Programació amb agents IA · Teoria

Vuit temes en **set sessions de 3 h** (de 9 a 12 h). Cada sessió té com a màxim **1 h d'explicació** i menys de **2 h d'activitat**: la pràctica del tema i la tasca del projecte «Lliuraments». Les tasques estan pensades per **acabar-se a classe**; fora de classe només queden les ampliacions opcionals i la redacció del projecte final.

## Calendari

| Dia | Tema | Explicació | Activitat a classe |
|---|---|---|---|
| dl. 30.11.26 | 01 | 55 min | Instal·lar OpenCode i connectar-lo, prompts *one-shot*, T1 (1 h 50 min) |
| dj. 3.12.26 | 02 | 60 min | Arnès SDD, passos 0–8, i T2 (1 h 55 min) |
| dl. 7.12.26 | 03 | 40 min | Eina CMD, Ollama i T3 (1 h 40 min) |
| dj. 10.12.26 | 04 | 40 min | MCPs de GitHub i Playwright, `task-contract` i T4 (1 h 55 min) |
| dl. 14.12.26 | 05 + 06 | 60 min | Google Sheets (T5) i RAG local (T6) (1 h 55 min) |
| dj. 17.12.26 | 07 | 55 min | Sudoku, `/run-tasks` i T7 (2 h) |
| dl. 21.12.26 | 08 | 60 min | T8 i presentació del projecte final (1 h 50 min) |

- Als apunts i a les diapositives, «sessió 01»…«sessió 08» és el **número de tema**. Els temes 05 i 06 es fan el mateix dia.
- Cada tasca té una **ampliació opcional** per a qui vagi més de pressa o vulgui continuar a casa.
- Abans del primer dia: Node.js 24.22 o superior (el demanen els temes 05 i 06) i `git`. Abans del tema 03: Ollama instal·lat i el model descarregat (uns 2 GB).

## Temes

| Tema | Continguts | Tasca | Prerequisits |
|---|---|---|---|
| [01 · Agents IA i OpenCode](01%20-%20Agents%20IA%20i%20OpenCode.md) | LLM, context, ReAct, eines · instal·lar i configurar OpenCode, `opencode.json`, claus segures | T1 | — |
| [02 · Harness Engineering](02%20-%20Harness%20Engineering.md) | `AGENTS.md`, agents, skills, commands, eines pròpies (plugins) · compartir amb `.agents/` · equip d'exemple en marxa (`/implement`) · arnès SDD d'una tasca (`/next-task`) | T2 | 01 |
| [03 · Function calling i models locals](03%20-%20Function%20calling%20i%20models%20locals.md) | Crides a funcions pas a pas (CLI d'una pregunta) · Ollama | T3 | 01 |
| [04 · MCPs GitHub, Playwright i MCP propi](04%20-%20MCPs%20GitHub,%20Playwright%20i%20MCP%20propi.md) | MCP de GitHub, Playwright i `computer-use` · MCP propi `task-contract` | T4 | 02 |
| [05 · Serveis de Google per a agents](05%20-%20Serveis%20de%20Google%20per%20a%20agents.md) | Compte de servei i Google Sheets · OAuth i Gmail · comanda `/gmail-important` | T5 | 04 |
| [06 · RAGs i serveis de dades](06%20-%20RAGs%20i%20serveis%20de%20dades.md) | Embeddings, fragments, LanceDB, `mcp-local-rag` | T6 | 05 |
| [07 · ATD i treball autònom](07%20-%20ATD%20i%20treball%20autònom.md) | Descomposició atòmica · `PLAN.md` + `tasks/T*.md` · bucles agèntics (`/run-tasks`) · tasques programades amb `opencode run` | T7 | 02, 04, 06 |
| [08 · Servidors d'inferència](08%20-%20Servidors%20d'inferència.md) | Part 1: VRAM, KV cache, mida de models, quantització, servidors, velocitat en equips petits (TensorFold, Strata) · Part 2: vLLM, llama.cpp, Docker, `docker compose`, proxy | T8 | 02, 03, 07 |
| [Projecte final](Projecte%20final.md) | Recull de les tasques T1–T8 en un PDF, amb una valoració inicial del curs. És el que s'avalua | — | 01–08 |

## Projecte «Lliuraments»

Cada tema acaba amb una **tasca** petita (T1–T8) sobre un mateix projecte, amb l'enunciat a la carpeta [`enunciats/`](../enunciats/): una web estàtica i una CLI per fer el seguiment de les pràctiques lliurades, sense login ni backend.

- **Un sol repositori**, `lliuraments`, creat a la T1. En acabar cada tasca s'hi posa una **etiqueta** de git (`t1`…`t8`), que és el que es lliura (tema 01, apartat 17).
- Les pràctiques de cada tema es fan en repositoris a part (`ia-01-one-shot`, `ia-02-harness-sdd`…), excepte les dels temes 05 i 06, que es fan directament a `lliuraments` i ja són la tasca.

| Tasca | Què es fa a classe | Ampliació opcional |
|---|---|---|
| [T1](../enunciats/01%20-%20Tasca%20T1.md) | Repositori, `opencode.json`, `PLAN.md` i dades | — |
| [T2](../enunciats/02%20-%20Tasca%20T2.md) | Arnès SDD i una tasca amb `/next-task` | Les altres dues tasques |
| [T3](../enunciats/03%20-%20Tasca%20T3.md) | Una funció del projecte a la CLI de la pràctica | Més funcions, tests i Ollama |
| [T4](../enunciats/04%20-%20Tasca%20T4.md) | Una issue i una captura amb Playwright | Més issues, `reviewer` amb Playwright i `task-contract` |
| [T5](../enunciats/05%20-%20Tasca%20T5.md) | Resum per alumne a Google Sheets (és la pràctica) | Notes ponderades i Gmail |
| [T6](../enunciats/06%20-%20Tasca%20T6.md) | `docs/normativa.md` amb la font citada (final de la pràctica) | Penalitzacions amb `/next-task` |
| [T7](../enunciats/07%20-%20Tasca%20T7.md) | Una tasca en Markdown amb `/next-md-task` | `/run-tasks`, tasca programada, `DECISIONS.md` i `HANDOFF.md` |
| [T8](../enunciats/08%20-%20Tasca%20T8.md) | Comparativa de dos models a `docs/models.md` | KV cache, TensorFold o Strata |

El [projecte final](Projecte%20final.md) és un PDF que recull les tasques i la valoració de l'alumne; l'avaluació es fa a partir d'aquest document.

## Formats de tasques

- **SDD · `docs/tasks.json`** (sessió 02): tasques curtes amb criteris d'acceptació, implementades i validades una a una amb `/next-task`. La validació és real: `npm test` (i, a l'ampliació de la T4, Playwright).
- **Tasques en Markdown · `PLAN.md` + `tasks/T*.md`** (sessió 07): una tasca per fitxer amb context, dependències, límits i tests; `PLAN.md` en porta l'estat. `/next-md-task` en fa una i `/run-tasks` les fa en bucle, amb límits.
- Les issues de GitHub (sessió 04) només serveixen per descriure els bugs i les funcionalitats; a la sessió 07, la issue del projecte es converteix en una tasca en Markdown.
- L'MCP `task-contract` (sessió 04) valida l'informe final de cada tasca. Es crea a la pràctica; afegir-lo al projecte és una ampliació opcional.

## Convencions

- Rols dels agents: coordinador/orchestrator, planificador, programador/editor, revisor, validador/tester.
- L'arnès viu a `.agents/`, amb `.opencode` com a enllaç simbòlic (sessió 02).
- Credencials sempre a `.secrets/` (una per arxiu) i `.secrets/` al `.gitignore`. Excepcions: el token de GitHub, a `~/.secrets/` (sessió 04), i les apps pròpies de la sessió 03, que llegeixen la clau de `settings.env`, també ignorat.
- Diagrames petits en Mermaid dins del Markdown; els més grans a `assets/images/diagrames/*.svg`.
- Captures de pantalla a `assets/images/captures/`, amb el número de sessió com a prefix.
- Arxius de partida a `assets/`: `projecteTeach/` (sessió 02), `projectePaint/` (exemple extra de *function calling*, no es fa servir a classe), `todo-app.html` (sessió 04), NOFC i PEC per al RAG (sessió 06), `prompt-sudoku.md` (sessió 07).
