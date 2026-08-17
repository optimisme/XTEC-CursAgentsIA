Genera la planificació executable del projecte a la carpeta `tasks/` aplicant Atomic Task Decomposition (ATD).

Abans de començar llegeix:

* `PLAN.md`;
* `.opencode/skills/task-management`;
* `.opencode/skills/atomic-task-execution`;
* `.opencode/skills/browser-validation`;
* `.opencode/skills/regression-validation`;
* `.opencode/skills/git-workflow`;
* `.opencode/skills/bug-management`.

Important:

* L'objectiu és definir les tasques locals del projecte.
* No implementis encara cap funcionalitat.
* No generis encara cap directori ni fitxer d'implementació de l'aplicació, inclòs `server/`.
* No modifiquis `PLAN.md`.
* No modifiquis `.opencode/skills/`.
* No creïs agents ni `AGENTS.md`.
* No creïs GitHub Issues.
* No creïs ni modifiquis GitHub Projects.
* No utilitzis GitHub MCP per planificar ni fer seguiment.
* GitHub no és una font d'autoritat operacional.
* Crea primer la carpeta `tasks/` i després cada fitxer buit abans d'afegir-hi contingut per seccions petites.

## Respecte obligatori de `PLAN.md`

La descomposició de tasques ha de respectar estrictament l'arquitectura, requisits, fases, dependències, restriccions i milestones definides a `PLAN.md`.

No reinterpretes ni substitueixis l'arquitectura del pla per una alternativa pròpia.

Quan una restricció arquitectònica sigui crítica per evitar una implementació incorrecta, reflecteix-la als criteris de `Validation` de les tasques afectades en lloc de duplicar tot el contingut de `PLAN.md`.

Mantén separats els components o subsistemes que `PLAN.md` defineixi com a independents.

## Estructura de `tasks/`

Crea una tasca per fitxer:

```text
tasks/
  TASK-001.md
  TASK-002.md
  TASK-003.md
  ...
```

Per bugs futurs s'utilitzarà:

```text
tasks/BUG-001.md
tasks/BUG-002.md
...
```

En aquesta fase crea `TASK-NNN.md`; no inventis bugs que encara no s'han detectat.

No creïs un únic `tasks.md`.

## Capçalera, estat i prioritat

Cada fitxer ha de començar amb una capçalera YAML delimitada per `---`. 

Per a les tasques creades en aquesta fase, utilitza:

```yaml
---
id: TASK-001
type: task
title: Descripció breu
status: ready
priority: 10
milestone: M1
phase: F1
dependencies: []
---
```

Valors permesos de `status`:

* `backlog`
* `ready`
* `in_progress`
* `in_review`
* `done`

Regles:

* `priority` és un enter positiu;
* un valor més petit implica execució anterior entre tasques executables;
* deixa espai entre prioritats quan sigui útil, preferentment `10`, `20`, `30`, ...;
* la prioritat no pot saltar-se dependències;
* les tasques amb dependències pendents han de començar amb `status: backlog`;
* les tasques sense dependències pendents i que ja es poden executar han de començar amb `status: ready`;
* en aquesta fase no creïs tasques amb `status: in_progress`, `status: in_review` ni `status: done`.

No assignis la mateixa `priority` si pots establir un ordre clar. Si hi ha tasques realment equivalents, l'empat es resoldrà per identificador.

## Format obligatori de cada tasca

Utilitza identificadors globals:

```text
TASK-001
TASK-002
TASK-003
...
```

No reiniciïs la numeració entre fases.

Format:

```markdown
---
id: TASK-001
type: task
title: Descripció breu
status: ready
priority: 10
milestone: M1
phase: F1
dependencies: []
---

# TASK-001 — Descripció breu

## Objective
Un únic resultat concret.

## Implementation
Què s'ha d'implementar.

## Validation
Criteris objectius que ha de comprovar el validator.
```

Quan hi hagi dependències:

```yaml
dependencies:
  - TASK-001
  - TASK-004
```

La fita ha d'existir a `PLAN.md`.

Quan una funcionalitat sigui observable des del navegador, indica explícitament a `Validation` que s'ha de validar mitjançant Puppeteer MCP.

Els bugs futurs utilitzaran una capçalera específica, per exemple:

```yaml
---
id: BUG-001
type: bug
title: Descripció breu del defecte
status: ready
priority: 5
severity: high
blocking: true
milestone: M2
phase: F2
related-task: TASK-012
dependencies: []
---
```

No inventis bugs en aquesta fase.

## Regles ATD

Cada tasca:

* ha de tenir un únic objectiu;
* ha de ser prou petita per una única iteració;
* ha de poder validar-se independentment;
* ha de dependre només de treball anterior;
* no ha d'incloure funcionalitats futures;
* ha de produir un canvi coherent;
* no implica un commit individual.

Si una tasca és massa gran, divideix-la.

No creïs una tasca independent de validació per cada implementació.

La validació forma part del flux normal:

`executor → validator`

Crea tasques específiques de validació només quan siguin:

* proves transversals;
* integracions;
* validacions globals de fase;
* regressions àmplies;
* validació final.

## Cobertura derivada del pla

Descompon totes les fases i resultats necessaris de `PLAN.md` en tasques atòmiques suficients per implementar el projecte complet.

Per cada part del pla:

* crea les tasques mínimes necessàries per assolir-ne el resultat;
* conserva les dependències reals;
* inclou criteris de validació objectius;
* cobreix configuració, integracions, seguretat, gestió d'errors i neteja quan `PLAN.md` ho requereixi;
* no inventis funcionalitats, tecnologies o subsistemes que el pla no defineixi;
* no ometis restriccions arquitectòniques o de seguretat perquè estiguin descrites només a `PLAN.md`.

Si `PLAN.md` defineix un arnès, runtime, servei extern, agent, provider, model, repositori temporal o qualsevol altra integració específica, crea les tasques necessàries per implementar-la exactament segons el pla.

## Priorització

Assigna `priority` segons dependències i ordre real de desenvolupament.

L'ordre ha de permetre que el projecte evolucioni progressivament cap a estats funcionals.

Una tasca no és executable només per tenir una `priority` baixa: totes les dependències han de tenir `status: done`.

No facis servir categories `Urgent`, `High`, `Medium` o `Low`. La prioritat és exclusivament numèrica.

Per bugs bloquejants futurs, utilitza `blocking: true` i reserva prioritats prou baixes per situar-los abans de les tasques normals disponibles.

## Assignació de milestones

Cada `TASK-NNN.md` ha d'indicar exactament una milestone existent a `PLAN.md` mitjançant el camp YAML `milestone`.

No inventis milestones alternatives i no assumeixis que sempre existeixen `M1` a `M7`.

Assigna cada tasca a la milestone on el seu resultat sigui necessari per primera vegada.

La prioritat i les dependències determinen l'ordre operacional; la milestone determina el bloc funcional que serà revisat i commitejat conjuntament.

No creïs commits durant aquest pas.

## Milestones Git

Les milestones concretes, el seu abast, criteris de finalització i missatges de commit provenen exclusivament de `PLAN.md`.

Durant aquesta fase:

* associa cada tasca a una milestone existent;
* comprova que totes les milestones que requereixen implementació tenen tasques suficients;
* no redefineixis les milestones;
* no creïs commits;
* no creïs una tasca artificial només per representar el commit de milestone.

## Cobertura mínima

La carpeta `tasks/` ha de cobrir tot el treball necessari per satisfer `PLAN.md`, incloent, quan sigui aplicable:

* infraestructura i configuració;
* funcionalitats;
* interfície;
* persistència;
* integracions;
* contractes i validació de dades;
* gestió d'errors i casos límit;
* seguretat;
* neteja de recursos;
* proves funcionals;
* Puppeteer MCP per funcionalitats web observables;
* regressions;
* validació global.

No converteixis aquesta llista genèrica en requisits inexistents: només crea tasques per elements exigits o justificats per `PLAN.md`.

## Validacions arquitectòniques obligatòries

Inclou criteris de `Validation` suficients per comprovar que les tasques respecten les decisions arquitectòniques i restriccions de `PLAN.md`.

Especialment, protegeix els límits entre components, les dependències prohibides, les restriccions de seguretat i qualsevol separació de responsabilitats que el pla declari explícitament.

No dupliquis a cada tasca tota l'arquitectura: incorpora només les restriccions que siguin rellevants per validar aquella tasca.

## Revisió final

Abans d'acabar:

* comprova que totes les fases de `PLAN.md` estan cobertes;
* comprova que totes les fites necessàries tenen tasques associades;
* comprova dependències;
* comprova que no hi ha cicles;
* comprova identificadors;
* comprova que no hi ha tasques duplicades;
* comprova atomicitat;
* comprova criteris de validació;
* comprova prioritats;
* comprova que totes les tasques inicials tenen `status: ready` o `status: backlog`;
* comprova que només tenen `status: ready` les que tenen totes les dependències satisfetes;
* comprova cobertura funcional;
* comprova que totes les restriccions arquitectòniques de `PLAN.md` estan cobertes;
* comprova que totes les integracions i subsistemes definits al pla tenen les tasques necessàries;
* comprova que no s'ha creat cap Issue ni Project a GitHub.
