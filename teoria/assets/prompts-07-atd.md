# Prompts · Sessió 07 · ATD i treball autònom

Prompts de [07 - ATD i treball autònom](../07%20-%20ATD%20i%20treball%20autònom.md), en ordre i preparats per copiar i enganxar.

**Com fer-los servir**

- Els blocs `text` van a **OpenCode**, obert dins la carpeta del repositori on treballes. Els blocs `bash` van al **terminal**.
- Enganxa **un prompt cada vegada** i revisa el resultat abans del següent.
- Els MCPs de GitHub i Playwright són globals (sessió 04): no cal configurar-los.

---

## Pràctica 1 · Repositori `ia-07-sudoku`

Copia `assets/prompt-sudoku.md` a `prompts/prompt-sudoku.md` i revisa'l.

### Pas 1 · Generar els tres prompts

```text
Llegeix @prompts/prompt-sudoku.md i genera els tres prompts a prompts/. Canvis respecte a l'original:
- En lloc d'un únic tasks-sudoku.md, les tasques s'han d'escriure una per fitxer a tasks/TXX-nom.md, amb un PLAN.md que les llisti en ordre amb el seu estat.
- Fes servir aquests estats, tots amb el número de prioritat davant (també [done], que a l'original no en porta): N:[backlog], N:[ready], N:[in progress], N:[in review], N:[done].
- L'estat només es guarda a PLAN.md.
- Si la validació d'una tasca falla, torna a N:[ready] amb el motiu escrit a la línia de sota.
- L'arnès s'ha de crear a .agents/, amb .opencode com a enllaç (sessió 02).
```

### Pas 2 · L'arnès

```text
Implementa la descripció de @prompts/prompt-sudoku-arnes.md
```

### Pas 3 · Les tasques

```text
Implementa la descripció de @prompts/prompt-sudoku-tasques.md. Cada tasca de tasks/TXX-nom.md ha de seguir aquesta plantilla:
# TXX · Títol
Depèn de: —
## Objectiu
## Context
## No facis
## Criteris d'acceptació
## Tests
```

### Pas 4 · `AGENTS.md`

```text
Genera AGENTS.md per a aquest projecte a partir de l'arnès, PLAN.md i les tasques.
```

**Comprova-ho:** cada tasca té una sola responsabilitat, un test, una secció «No facis», i les dependències de `PLAN.md` són correctes. Corregeix a mà el que calgui.

---

## Pràctica 2 · `/next-md-task` i `/run-tasks`

### Pas 5 · Comanda `/next-md-task`

```text
Crea l'arxiu .agents/commands/next-md-task.md amb exactament aquest contingut. Si l'agent orquestrador de .agents/agents/ no es diu orchestrator, posa el seu nom a la línia agent:. Si l'orquestrador no pot editar PLAN.md o fer git commit, ajusta-li els permisos només per a això.
---
description: Implement and validate the highest-priority [ready] task in PLAN.md. One task only.
agent: orchestrator
---
# /next-md-task — one Markdown task

Use the agents defined in .agents/agents/.
1. Read PLAN.md. If a task is N:[in progress] or N:[in review] from an interrupted run, set it back to N:[ready]. Pick the N:[ready] task with the lowest N. If there is none, report it and stop.
2. Change its status to N:[in progress] in PLAN.md and read only its file in tasks/.
3. Delegate the implementation to the implementation subagent. Respect the "No facis" section of the task.
4. Change the status to N:[in review] and delegate the validation to the test and review subagents: npm test (all tests, not only the new ones) and every acceptance criterion. If the task changes the interface, also check it with the Playwright MCP at http://localhost:3000.
5. If the validation passes, set the status to N:[done], move to N:[ready] every N:[backlog] task whose dependencies are now all done, and make one commit "TXX: <title>".
6. If the validation fails, set the status back to N:[ready], write the reason on the line below the task in PLAN.md, do not commit, and stop.
Only the orchestrator edits PLAN.md. Never work on more than one task.
```

### Pas 6 · Servidor (terminal)

En un altre terminal, des de `ia-07-sudoku`, i deixa'l obert:

```bash
npx serve .
```

Reinicia OpenCode i executa `/next-md-task` una vegada. **Comprova-ho:** el diff, el commit i `PLAN.md`.

### Pas 7 · Comanda `/run-tasks`

```text
Crea l'arxiu .agents/commands/run-tasks.md amb exactament aquest contingut, i a la línia agent: posa el mateix agent que a next-md-task.md:
---
description: Run the /next-md-task workflow in a loop until no [ready] task is left, a task fails or the limit is reached.
agent: orchestrator
---
# /run-tasks — task loop

Read .agents/commands/next-md-task.md and follow its steps once per cycle. Do not change or duplicate its rules.
- Process only one task per cycle. Never work on more than one task at a time.
- Re-read PLAN.md before and after every cycle.
- Stop when there are no [ready] tasks, as soon as a cycle fails, or after $ARGUMENTS completed tasks (10 if no number is given).
- At the end, print a summary: tasks done in this run, the task that failed (if any) and what is left.
```

Reinicia OpenCode i executa `/run-tasks 3`. Quan s'aturi, obre `http://localhost:3000`.

---

## Part C · Tasques programades

> El plugin `opencode-scheduler` (1.3.0) és d'OpenCode 1 i no s'executa a OpenCode 2. La tasca es programa directament al sistema operatiu amb `opencode run`.

### Pas 8 · El prompt programat

Dins d'`ia-07-sudoku`:

```text
Crea l'arxiu prompts/resum-diari.md amb exactament aquest contingut:
# Daily summary
You run unattended: nobody can answer questions or approve permissions.
1. Read PLAN.md and the git log of the last 24 hours.
2. Run npm test.
3. Overwrite STATUS.md with: tasks done today, tasks still pending, the task that failed (if any) and the test result.
Do not modify any other file.
```

### Pas 9 · L'script

```text
Crea l'script scripts/resum-diari.sh (a Windows, scripts/resum-diari.ps1). L'script ha d'entrar a la carpeta d'aquest projecte amb la seva ruta absoluta i executar, amb la ruta absoluta de l'executable opencode:
opencode run --file prompts/resum-diari.md "Follow the instructions in the attached file."
Ha d'afegir la data, la sortida i els errors a logs/resum-diari.log. Afegeix logs/ al .gitignore. No l'executis.
```

### Pas 10 · Programar-lo

```text
Programa scripts/resum-diari.sh perquè el sistema operatiu l'executi cada dia a les 21:00 amb el nom resum-diari (launchd a macOS, cron a Linux, Programador de tasques a Windows). No l'executis ara. Digues-me on l'has registrat i com es desactiva.
```

### Pas 11 · Provar-lo ara (terminal)

```bash
bash scripts/resum-diari.sh                # Windows: powershell -File scripts\resum-diari.ps1
tail -n 20 logs/resum-diari.log
```

**Comprova-ho:** s'ha creat `STATUS.md`. Si al log hi ha `permission requested: … auto-rejecting`, el projecte té `ask` per a aquella eina: les tasques programades no poden preguntar.

---

## Tasca T7 · Projecte «Lliuraments»

Al repositori `lliuraments`.

### T7.1 · La tasca, a partir de la issue

```text
Fes servir l'MCP de GitHub per llegir la issue oberta d'aquest repositori (la de la T4). Redacta-la com una tasca a tasks/TXX-nom.md, on XX és el primer número que no faci servir docs/tasks.json, amb aquesta plantilla:
# TXX · Títol
Depèn de: —
## Objectiu
## Context
## No facis
## Criteris d'acceptació
## Tests
La tasca ha de tenir una sola responsabilitat i s'ha de poder validar amb npm test: la lògica va a webs/lliuraments.js com a funció pura, amb el seu test.
Afegeix al final de PLAN.md una secció "## Tasques" amb una línia per a aquesta tasca i l'estat 1:[ready]. No toquis la resta de PLAN.md. No implementis res.
```

**Comprova-ho:** llegeix la tasca. Té una sola responsabilitat? Diu què no ha de fer? Corregeix-la a mà si cal.

### T7.2 · La comanda `/next-md-task`

Copia la comanda de la pràctica 2. Al terminal, des de `lliuraments`:

```bash
cp ../ia-07-sudoku/.agents/commands/next-md-task.md .agents/commands/
```

```text
Adapta .agents/commands/next-md-task.md a aquest projecte, sense canviar-ne el flux:
- Els agents són els de .agents/agents/: orchestrator, programmer i reviewer. No hi ha tester: el reviewer executa npm test.
- A PLAN.md, les tasques i el seu estat només són a la secció "## Tasques".
- La validació és npm test (tots els tests) i cada criteri d'acceptació. Fes servir l'MCP de Playwright a http://localhost:3000/webs/ només si el reviewer en té permís.
- Si l'orchestrator no pot editar PLAN.md o fer git commit, ajusta-li els permisos només per a això.
No toquis .agents/commands/next-task.md.
```

### T7.3 · Executa-la

En un altre terminal, des de `lliuraments`: `npx serve .`. Surt d'OpenCode, torna-hi a entrar i executa:

```text
/next-md-task
```

Si la tasca falla, llegeix el motiu a la línia de sota a `PLAN.md`, corregeix la tasca o el codi i torna-la a executar.

### T7.4 · Etiqueta i push

La comanda ja ha fet el commit de la tasca.

```text
Crea l'etiqueta t7 i fes push de la branca main i de les etiquetes.
```

### Ampliació (opcional)

- Més tasques i el bucle: redacta'n dues més amb el prompt T7.1, copia també `run-tasks.md` de la pràctica i executa `/run-tasks`.
- Tasca programada: els passos 8 a 11 de la part C, ara dins de `lliuraments`.
- Continuar més tard:

```text
Crea DECISIONS.md amb les decisions tècniques preses fins ara i una frase explicant-ne el motiu, i HANDOFF.md amb només la informació necessària perquè un altre agent pugui continuar des d'una conversa nova sense tornar a investigar el projecte.
```
