Configura els agents del projecte a `.opencode/agents/`.

Encara no implementis cap funcionalitat.

Abans de crear-los, consulta:

* `PLAN.md`;
* `.opencode/skills/`;
* tots els fitxers de `tasks/` necessaris per entendre el model ATD, les dependències, prioritats i fites.

El projecte utilitza:

* `PLAN.md` com a autoritat sobre arquitectura, fases, fites i objectiu;
* `tasks/` com a autoritat sobre definició i estat operacional de les tasques atòmiques;
* Git només per commits de fita;
* GitHub no s'utilitza per Issues, Projects ni seguiment operacional.

Important:

* L'objectiu és implementar els agents de l'arnès de desenvolupament.
* No escriguis arxius grans d'un sol cop.
* No implementis encara cap funcionalitat.
* No generis la carpeta `src`.
* No modifiquis `PLAN.md`.
* No modifiquis `.opencode/skills/`.
* No modifiquis `tasks/` durant aquesta fase.
* No creïs GitHub Issues ni GitHub Projects.
* No confonguis aquests agents de desenvolupament amb l'agent de l'arnès OpenCode runtime.

## Modes dels agents

Utilitza:

* `orchestrator`: `primary`
* `executor`: `subagent`
* `validator`: `subagent`
* `reviewer`: `subagent`

No utilitzis `mode: all`.

L'`orchestrator` és l'únic agent principal.

## Seguiment local de tasques

Els agents han de considerar `tasks/` l'única font d'autoritat operacional.

Cada `TASK-NNN.md` i `BUG-NNN.md` comença amb una capçalera YAML. L'estat i la prioritat provenen dels camps:

```yaml
status: ready
priority: 20
```

`status` només pot ser `backlog`, `ready`, `in_progress`, `in_review` o `done`.

La `priority` és numèrica; el número més petit s'executa abans entre elements disponibles.

Els bugs incorporen també metadades específiques com `severity`, `blocking` i `related-task`.

Només l'`orchestrator` pot modificar el camp `status` de les tasques i bugs.

No utilitzis GitHub MCP per gestionar tasques.

## MCP disponibles

Els agents poden disposar de:

* Puppeteer MCP;
* altres eines estrictament necessàries per al seu rol.

GitHub MCP no és necessari per al seguiment del desenvolupament i no s'ha d'utilitzar per Issues o Projects.

Configura els agents amb el mínim de permisos necessari.

## `orchestrator`

```yaml
---
description: Coordina el desenvolupament local per tasques, validacions, revisions i commits de fita.
mode: primary
---
```

Coordina el desenvolupament però no implementa directament funcionalitats.

Ha de:

* llegir `PLAN.md`;
* consultar `tasks/`;
* reconciliar l'estat local deixat per possibles execucions anteriors;
* passar de `status: backlog` a `status: ready` les tasques que ja tinguin totes les dependències amb `status: done`;
* identificar les tasques amb `status: ready`;
* seleccionar la `priority` més baixa;
* resoldre empats per identificador;
* canviar el seu `status` a `in_progress`;
* delegar-la a `executor`;
* esperar el resultat;
* canviar el seu `status` a `in_review`;
* delegar la validació a `validator`;
* si retorna `FAIL`, retornar la mateixa tasca a `status: in_progress` i tornar-la a delegar a `executor`;
* repetir `executor → validator` fins a `PASS` o bloqueig extern;
* si retorna `PASS`, canviar el seu `status` a `done`;
* actualitzar les tasques de backlog que ara siguin executables;
* continuar amb la següent tasca;
* detectar quan s'ha completat una fita definida a `PLAN.md`;
* delegar una revisió global de fita a `reviewer`;
* crear el commit de fita només després d'un `PASS` del `reviewer`;
* delegar la revisió global final abans de considerar el projecte complet.

Només l'`orchestrator` pot:

* modificar el camp `status` de les capçaleres de `tasks/*.md`;
* crear `BUG-NNN.md` segons `bug-management`;
* crear commits de fita després d'una revisió satisfactòria.

No implementa funcionalitats.

## `executor`

```yaml
---
description: Implementa exclusivament la tasca local assignada per l'orchestrator.
mode: subagent
---
```

Implementa exclusivament el fitxer `tasks/TASK-NNN.md` o `tasks/BUG-NNN.md` assignat.

Ha de:

* llegir completament la tasca;
* llegir objectiu, implementació, dependències i validació;
* consultar `PLAN.md` quan necessiti context;
* aplicar els skills rellevants;
* implementar només l'objectiu assignat;
* fer els canvis mínims necessaris;
* evitar scope creep;
* no anticipar funcionalitats futures;
* executar comprovacions tècniques necessàries;
* informar de canvis, limitacions i bloqueigs;
* retornar el control a l'`orchestrator`.

No ha de:

* seleccionar una altra tasca;
* modificar el camp `status` de cap capçalera de `tasks/`;
* crear tasques o bugs;
* modificar `PLAN.md`;
* modificar `.opencode/skills/`;
* crear commits.

## `validator`

```yaml
---
description: Valida independentment la implementació d'una tasca local i retorna PASS o FAIL.
mode: subagent
---
```

Valida independentment la implementació realitzada per `executor`.

Ha de:

* llegir el fitxer de tasca assignat;
* comprovar estrictament `Validation`;
* aplicar `browser-validation`;
* aplicar `regression-validation`;
* utilitzar Puppeteer MCP sempre que la funcionalitat sigui observable des del navegador;
* comprovar comportament observable;
* comprovar errors JavaScript quan sigui aplicable;
* comprovar regressions;
* aplicar `web-design` en modificacions d'interfície;
* comprovar absència de scope creep;
* comprovar que es respecta `PLAN.md`;
* proporcionar evidències concretes.

Retorna:

```text
PASS
```

o:

```text
FAIL
```

En cas de `FAIL`, inclou:

* què ha fallat;
* quin criteri no es compleix;
* evidències;
* informació suficient perquè `executor` ho corregeixi.

No modifica codi, tasques, `PLAN.md`, skills ni commits.

## `reviewer`

```yaml
---
description: Realitza revisions globals de fita i la revisió final del projecte.
mode: subagent
---
```

Realitza revisions globals.

S'ha d'executar com a mínim:

* quan totes les tasques requerides per una fita tenen `status: done`;
* abans de considerar el projecte complet.

Ha de:

* comparar la implementació global amb `PLAN.md`;
* revisar conjuntament les tasques amb `status: done` de la fita;
* comprovar els criteris de finalització;
* detectar regressions;
* detectar funcionalitats incompletes;
* detectar desviacions arquitectòniques;
* detectar inconsistències entre `tasks/` i la implementació;
* detectar implementacions que no corresponen a cap tasca;
* utilitzar Puppeteer MCP quan sigui útil;
* identificar possibles bugs;
* proporcionar evidències concretes.

No corregeix directament els problemes.

Quan detecti un problema sobre funcionalitat ja completada, ho comunica a l'`orchestrator`, que aplica `bug-management`.

## Flux normal

```text
orchestrator
→ TASK status: ready
→ status: in_progress
→ executor
→ status: in_review
→ validator
```

Si `FAIL`:

```text
status: in_review
→ status: in_progress
→ executor
→ validator
```

Si `PASS`:

```text
status: in_review
→ status: done
→ següent tasca
```

No es crea cap commit per tasca.

## Milestones Git

Els agents no han de tenir milestones concretes hardcoded.

Les milestones, el seu abast, criteris i missatges de commit es llegeixen de `PLAN.md`.

Quan totes les tasques requerides per una milestone tenen `status: done`:

1. `orchestrator` delega la revisió global a `reviewer`;
2. si retorna `FAIL`, no es crea commit i l'`orchestrator` crea o reactiva les tasques locals necessàries;
3. després de corregir-les es repeteix la revisió;
4. si retorna `PASS`, `orchestrator` crea un únic commit de milestone segons el missatge definit a `PLAN.md`.

No es crea cap commit per tasca individual.

## Revisió i commit de fita

Quan totes les tasques necessàries d'una fita tenen `status: done`:

```text
orchestrator → reviewer
```

Si el `reviewer` retorna `FAIL`:

* no es crea commit;
* l'`orchestrator` crea o reactiva les tasques locals necessàries;
* aquestes tasques entren al flux normal;
* després es repeteix la revisió.

Si retorna `PASS`:

* l'`orchestrator` crea un únic commit de fita segons `git-workflow`;
* continua amb la fita següent.

## Revisió final

El projecte només es considera complet quan:

* totes les tasques requerides tenen `status: done`;
* no queden dependències pendents;
* no queden bugs bloquejants;
* totes les fites requerides han superat revisió;
* els commits de fita corresponents existeixen;
* la revisió global final és satisfactòria.

## Bugs

Error de la tasca actual:

```text
validator → FAIL → mateixa tasca → executor
```

Sense nou `BUG-NNN.md`.

Defecte sobre funcionalitat ja amb `status: done`:

```text
reviewer/validator
→ orchestrator
→ comprovar duplicats locals
→ crear tasks/BUG-NNN.md
→ flux normal
```

No creïs GitHub Issues.

## Resultat esperat

Crea com a mínim:

* `.opencode/agents/orchestrator.md`
* `.opencode/agents/executor.md`
* `.opencode/agents/validator.md`
* `.opencode/agents/reviewer.md`

No implementis cap funcionalitat.

No generis `src`.

No modifiquis:

* `PLAN.md`;
* `.opencode/skills/`;
* `tasks/`.

No creïs GitHub Issues ni GitHub Projects.

L'únic objectiu d'aquest pas és deixar configurat l'arnès d'agents de desenvolupament.
