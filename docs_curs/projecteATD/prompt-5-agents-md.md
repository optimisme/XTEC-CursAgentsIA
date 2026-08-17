Genera l'arxiu `AGENTS.md` del projecte.

Abans d'escriure'l, llegeix:

* `PLAN.md`;
* `.opencode/agents/`;
* `.opencode/skills/`;
* una mostra suficient de `tasks/*.md` i, si cal, tots els fitxers necessaris per entendre dependències, prioritats, estats i fites.

`AGENTS.md` ha de descriure com s'ha de treballar en aquest projecte.

Important:

* L'objectiu és definir `AGENTS.md`.
* No ha de duplicar `PLAN.md`.
* No ha de duplicar totes les tasques de `tasks/`.
* No escriguis l'arxiu complet d'un sol cop: crea'l primer buit i afegeix-ne el contingut per seccions petites.
* No creïs GitHub Issues ni GitHub Projects.
* No utilitzis GitHub com a sistema de seguiment.

## Objectiu del projecte

Resumeix breument l'objectiu definit a `PLAN.md`.

No introdueixis tecnologies, fluxos o requisits que no apareguin al pla.

Si `PLAN.md` defineix integracions, runtimes, agents, serveis externs o separacions arquitectòniques específiques, resumeix-les de manera suficient per orientar el desenvolupament.

## Fonts d'autoritat

### `PLAN.md`

Font d'autoritat sobre:

* objectiu;
* arquitectura;
* requisits;
* fases;
* dependències globals;
* fites;
* criteris finals.

### `tasks/`

Font d'autoritat sobre:

* definició concreta de cada tasca ATD;
* estat operacional;
* prioritat numèrica;
* objectiu;
* implementació;
* validació;
* dependències;
* fase;
* fita.

No hi ha seguiment paral·lel a GitHub Issues o GitHub Projects.

### Capçalera operacional de `tasks/`

Documenta que cada `TASK-NNN.md` i `BUG-NNN.md` comença amb una capçalera YAML.

Per a tasques, la capçalera conté com a mínim:

```yaml
---
id: TASK-012
type: task
title: Descripció breu
status: ready
priority: 20
milestone: M2
phase: F2
dependencies:
  - TASK-008
---
```

Per a bugs, afegeix com a mínim:

```yaml
severity: high
blocking: true
related-task: TASK-012
```

`status` pot ser `backlog`, `ready`, `in_progress`, `in_review` o `done`.

`priority` és un enter positiu i el número més petit té prioritat entre tasques executables.

Documenta:

* `status: backlog`: dependències pendents o encara no executable;
* `status: ready`: executable;
* `status: in_progress`: en implementació;
* `status: in_review`: pendent de validator;
* `status: done`: implementada i validada.

Només l'`orchestrator` modifica `status`.

No hi pot haver més d'un element de treball (`TASK-NNN` o `BUG-NNN`) amb `status: in_progress` o `status: in_review` alhora.

En reconciliacions posteriors, no s'ha d'inferir `status: done` només perquè existeixi una implementació. Si no es pot demostrar de manera segura que hi havia un `PASS` anterior, cal repetir la validació abans de marcar l'element com a `done`.

## Estructura del projecte

Descriu l'estructura prevista segons `PLAN.md`.

Inclou sempre:

* `PLAN.md`;
* `tasks/`;
* `.opencode/agents/`;
* `.opencode/skills/`;
* els directoris principals de codi, configuració, proves o runtimes que realment defineixi el pla.

Diferencia clarament l'arnès de desenvolupament de qualsevol runtime, agent o subsistema que formi part de l'aplicació final, si `PLAN.md` estableix aquesta separació.

## Arquitectura i responsabilitats específiques del projecte

Documenta de manera concisa les decisions arquitectòniques de `PLAN.md` que els agents necessiten conèixer per implementar correctament el projecte.

Inclou, només quan el pla ho defineixi:

* fluxos entre components;
* separació de responsabilitats;
* runtimes o agents diferents de l'arnès de desenvolupament;
* serveis externs i integracions;
* contractes de dades o respostes;
* regles de seguretat;
* tractament d'entrades o contingut no fiable;
* gestió d'errors, timeouts i neteja de recursos.

No converteixis `AGENTS.md` en una còpia de `PLAN.md`: conserva només les regles necessàries per treballar correctament.

## Agents de desenvolupament

Flux normal:

```text
orchestrator → executor → validator
```

Si `FAIL`, torna a `executor`.

Només l'`orchestrator` modifica `tasks/`.

## Selecció de tasques

L'`orchestrator`:

1. llegeix `tasks/`;
2. reconcilia estats amb la implementació real;
3. passa a `status: ready` els elements amb `status: backlog` i dependències satisfetes;
4. considera només els elements amb `status: ready`;
5. selecciona la `priority` més petita;
6. resol empats per identificador;
7. canvia el seu `status` a `in_progress`.

No es pot executar una tasca amb dependències pendents.

## Transicions

Documenta:

```text
status: backlog → status: ready
status: ready → status: in_progress
status: in_progress → status: in_review
status: in_review → status: done
status: in_review → status: in_progress   # validator FAIL
```

No utilitzis checkboxes per representar estats.

## Skills

Documenta breument:

* `web-design`;
* `task-management`;
* `atomic-task-execution`;
* `browser-validation`;
* `regression-validation`;
* `git-workflow`;
* `bug-management`.

Els fitxers dels skills són la font d'autoritat sobre les regles detallades.

## Puppeteer MCP

Utilitza'l sempre que una funcionalitat sigui observable des del navegador.

Inclou:

* navegació;
* formularis;
* clics;
* fluxos d'usuari;
* contingut;
* persistència;
* errors JavaScript;
* responsive;
* focus;
* teclat.

## Milestones Git

Documenta el mecanisme general de milestones sense copiar-ne tota la definició concreta.

Les milestones específiques, el seu abast, criteris i missatges de commit provenen de `PLAN.md`.

Regles:

* no es crea un commit per tasca;
* els canvis validats s'acumulen fins a la milestone corresponent;
* quan totes les tasques requerides tenen `status: done`, `reviewer` fa una revisió global;
* només després d'un `PASS`, `orchestrator` comprova primer si el commit exacte de la milestone ja existeix a l'historial Git;
* si ja existeix, considera la milestone ja commitejada i no crea cap duplicat;
* si no existeix, crea un únic commit amb el missatge definit a `PLAN.md`;
* un `FAIL` genera o reactiva treball local abans de tornar a revisar;
* no es fa `push` tret que una instrucció explícita ho demani.

## Git i fites

Documenta clarament:

* no es crea un commit per tasca;
* els canvis validats s'acumulen fins a una fita;
* les fites es defineixen a `PLAN.md`;
* quan totes les tasques requerides d'una fita tenen `status: done`, `reviewer` fa una revisió global;
* només després d'un `PASS` de la fita, l'`orchestrator` comprova si el commit exacte ja existeix;
* si ja existeix, no crea cap duplicat;
* si no existeix, crea un únic commit;
* format recomanat: `MILESTONE-MN: ...`;
* no es creen GitHub Issues ni GitHub Projects;
* GitHub no és la font d'estat;
* no es fa `push` tret que una instrucció explícita ho demani.

## Bugs

Error de la tasca actual:

```text
FAIL → executor
```

Sense crear un nou bug.

Bug en funcionalitat ja completada:

```text
detectar
→ comprovar duplicats a tasks/
→ crear BUG-NNN.md
→ assignar `status: ready` o `status: backlog`
→ flux normal
```

## Validació del desenvolupament

Una tasca no està completada perquè el codi existeixi.

Ha de superar:

* els criteris de `Validation` del seu fitxer;
* les comprovacions funcionals aplicables;
* Puppeteer MCP quan la funcionalitat sigui observable des del navegador;
* les regressions rellevants;
* les restriccions arquitectòniques, de seguretat i d'integració de `PLAN.md` que afectin la tasca.

## Regles de desenvolupament

* una sola tasca atòmica cada vegada;
* canvis mínims;
* evitar scope creep;
* no implementar treball futur;
* respectar dependències;
* respectar `PLAN.md`;
* respectar els límits entre components i responsabilitats definits al pla;
* si existeix una contradicció estructural important, informar-ne.

## Prioritat de fonts

En cas de contradicció:

1. requisits i restriccions explícites de `PLAN.md`;
2. fitxer `tasks/TASK-NNN.md` o `BUG-NNN.md` assignat;
3. `AGENTS.md`;
4. skills aplicables;
5. instruccions particulars de l'agent.

Una tasca no pot contradir `PLAN.md`.

L'estat operacional prové sempre de `tasks/`.

## Eines

Inclou les eines realment disponibles i necessàries segons `PLAN.md`, els agents i els skills.

Com a mínim documenta:

* Git per als commits de milestone;
* OpenCode com a arnès de desenvolupament;
* Puppeteer MCP quan hi hagi funcionalitat web observable;
* les eines, runtimes o serveis específics que `PLAN.md` exigeixi.

No presentis una tecnologia com a dependència directa si el pla la situa darrere d'una altra capa o integració.

No inventis credencials, URLs, ports, tokens, models o configuracions que no estiguin definides.

No implementis funcionalitats.

No modifiquis:

* `PLAN.md`;
* `.opencode/agents/`;
* `.opencode/skills/`;
* `tasks/`.

No creïs GitHub Issues ni GitHub Projects.

L'únic resultat ha de ser `AGENTS.md`.
