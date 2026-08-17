Implementa o continua implementant el projecte seguint `AGENTS.md`.

Comença llegint:

* `AGENTS.md`;
* `PLAN.md`;
* els skills aplicables a `.opencode/skills/`;
* els fitxers de `tasks/`.

# Seguiment operacional local

Utilitza exclusivament `tasks/` per al seguiment operacional del desenvolupament.

No creïs ni utilitzis:

* GitHub Issues;
* GitHub Projects;
* labels de GitHub com a estat;
* fitxers de seguiment paral·lels.

Cada `TASK-NNN.md` i `BUG-NNN.md` comença amb una capçalera YAML. Llegeix i actualitza l'estat i la prioritat exclusivament mitjançant:

```yaml
status: ready
priority: 20
```

`status` només pot ser `backlog`, `ready`, `in_progress`, `in_review` o `done`.

`priority` és numèrica: el número més petit s'implementa abans entre els elements executables.

En bugs, tingues també en compte `severity`, `blocking` i `related-task`.

Git només s'utilitza per crear commits quan s'assoleixen les fites definides a `PLAN.md`.

No creïs commits individuals per tasca.

## Principi d'execució

Aquest prompt ha d'iniciar un **bucle agèntic autònom de desenvolupament**.

No implementis directament les tasques des de l'agent principal que rep aquest prompt.

Inicia l'agent:

`orchestrator`

i deixa que sigui l'`orchestrator` qui coordini tot el desenvolupament.

L'`orchestrator` manté el bucle fins que:

* el projecte queda complet;
* no existeix cap tasca executable;
* apareix un bloqueig que requereix una decisió externa;
* o es produeix un error que impedeix continuar de manera segura.

No demanis confirmació entre tasques executables.

No t'aturis després de completar una sola tasca.

## Reconciliació de l'estat inicial

Abans de seleccionar una nova tasca, l'`orchestrator` ha de reconciliar l'estat deixat per execucions anteriors.

Per cada `tasks/TASK-NNN.md` i `tasks/BUG-NNN.md`:

1. llegeix `status`, `priority` i les dependències de la capçalera;
2. comprova les dependències;
3. contrasta l'estat amb la implementació real i, quan sigui necessari, amb els criteris de validació;
4. corregeix automàticament inconsistències només quan es pugui determinar l'estat correcte de manera segura.

Com a mínim:

* una tasca implementada només pot tenir `status: done` si es pot demostrar de manera segura que ja havia superat una validació `PASS`; si no es pot demostrar, s'ha de repetir la validació abans de marcar-la com a `done`;
* una tasca no iniciada amb dependències pendents ha de tenir `status: backlog`;
* una tasca no iniciada amb totes les dependències satisfetes ha de tenir `status: ready`;
* una tasca que realment s'està implementant pot tenir `status: in_progress`;
* una tasca implementada però pendent de validator ha de tenir `status: in_review`;
* una tasca amb `status: in_progress` deixada per una execució interrompuda s'ha de reprendre, retornar a `status: ready` o passar a `status: in_review` segons l'estat real;
* una tasca amb `status: in_review` sense una implementació completa s'ha de retornar a `status: in_progress`;
* no canviïs un estat si no pots determinar de manera segura quin és el correcte.

Després, revisa totes les tasques amb `status: backlog` i passa a `status: ready` les que ja tinguin totes les dependències amb `status: done`.

No creïs una nova tasca només per corregir una inconsistència d'estat.

## Bucle agèntic principal

```text
orchestrator
→ seleccionar tasca
→ executor
→ validator
→ actualitzar tasks/
→ següent tasca
→ repetir
```

## 1. Selecció de la tasca

L'`orchestrator` ha de:

1. consultar `tasks/`;
2. actualitzar de `status: backlog` a `status: ready` les tasques desbloquejades;
3. identificar les tasques amb `status: ready`;
4. seleccionar la que tingui la `priority` més petita;
5. en empat, seleccionar l'identificador numèric més petit;
6. llegir completament la tasca;
7. comprovar de nou les dependències;
8. canviar el seu `status` a `in_progress`.

No seleccionis una nova tasca mentre qualsevol element de treball (`TASK-NNN` o `BUG-NNN`) tingui `status: in_progress` o `status: in_review`.

No hi pot haver més d'un element de treball amb `status: in_progress` o `status: in_review` alhora.

## Implementació

L'`orchestrator` delega la tasca a:

`executor`

L'`executor`:

* implementa exclusivament la tasca assignada;
* respecta objectiu, dependències i criteris;
* consulta `PLAN.md` quan necessita context;
* aplica els skills corresponents;
* fa els canvis mínims;
* evita scope creep;
* no implementa altres tasques;
* no anticipa funcionalitats futures;
* executa les comprovacions tècniques necessàries;
* no modifica l'estat de `tasks/`;
* no crea commits;
* retorna el control a l'`orchestrator`.

Quan `executor` acaba satisfactòriament, l'`orchestrator` canvia:

```text
status: in_progress → status: in_review
```

## Validació

L'`orchestrator` delega immediatament a:

`validator`

El `validator`:

* llegeix el fitxer de tasca;
* comprova estrictament `Validation`;
* aplica `browser-validation`;
* aplica `regression-validation`;
* utilitza Puppeteer MCP quan la funcionalitat és observable des del navegador;
* comprova comportament observable;
* comprova errors JavaScript;
* comprova regressions;
* aplica `web-design` quan correspongui;
* comprova absència de scope creep;
* comprova que es respecta `PLAN.md`.

Retorna:

`PASS`

o:

`FAIL`

amb evidències concretes.

## Bucle de correcció

Si `validator` retorna `FAIL`:

1. l'`orchestrator` canvia:

```text
status: in_review → status: in_progress
```

2. no crea cap commit;
3. no selecciona una nova tasca;
4. proporciona a `executor` el feedback i les evidències;
5. repeteix:

```text
executor → validator
```

fins a `PASS` o bloqueig extern.

Un error que forma part de la tasca actual no crea `BUG-NNN.md`.

## Finalització d'una tasca

Si `validator` retorna `PASS`:

1. l'`orchestrator` comprova que els canvis corresponen exclusivament a la tasca;
2. canvia:

```text
status: in_review → status: done
```

3. no crea cap commit de tasca;
4. actualitza de `status: backlog` a `status: ready` les tasques que hagin quedat desbloquejades;
5. comprova si s'ha completat alguna fita;
6. si no cal revisió de fita, continua automàticament amb la següent tasca executable.

## Bucle conceptual

```text
while project_not_complete:

    reconcile_tasks()

    task = select_ready_task_with_lowest_priority()

    if no_task:
        review_project_state()
        stop_if_blocked_or_complete()

    set_in_progress(task)

    while task_not_passed:

        executor.implement(task)
        set_in_review(task)

        result = validator.validate(task)

        if result == FAIL:
            set_in_progress(task)
            executor receives validator feedback
            continue

        if result == PASS:
            set_done(task)
            unlock_ready_tasks()
            break

    if milestone_complete:
        reviewer.review_milestone()

        if milestone_review == PASS:
            commit_milestone()

    continue
```

Aquest pseudocodi és conceptual i no s'ha d'implementar com a codi de l'aplicació.

## Milestones Git

Les milestones concretes provenen exclusivament de `PLAN.md`.

No n'inventis, no les renumeris i no en dupliquis la definició dins del flux d'execució.

Quan totes les tasques necessàries d'una milestone tenen `status: done`, comprova si és candidata a revisió segons els criteris de `PLAN.md`.

No es crea cap commit per tasca individual.

## Revisió de fita

Una fita es considera candidata a revisió quan totes les tasques que `PLAN.md` exigeix per aquella fita tenen `status: done`.

L'`orchestrator` delega:

`orchestrator → reviewer`

El `reviewer`:

* compara la implementació amb `PLAN.md`;
* comprova els criteris de la fita;
* revisa conjuntament les tasques amb `status: done` de la fita;
* detecta regressions;
* detecta funcionalitats incompletes;
* detecta desviacions arquitectòniques;
* detecta inconsistències entre `tasks/` i la implementació;
* utilitza Puppeteer MCP quan sigui útil;
* identifica possibles bugs.

### Fita amb `FAIL`

Si detecta defectes:

* no creïs commit;
* l'`orchestrator` gestiona els defectes segons `bug-management`;
* crea `BUG-NNN.md` només per defectes de funcionalitat ja considerada completada;
* assigna `status: ready` o `status: backlog`;
* executa aquests bugs pel flux normal;
* repeteix després la revisió de fita.

### Fita amb `PASS`

Només després del `PASS`:

1. comprova que l'arbre de treball conté els canvis esperats des de l'última fita;
2. comprova l'historial Git i verifica si el commit exacte definit per la milestone a `PLAN.md` ja existeix;
3. si ja existeix, considera la milestone ja commitejada i no creïs cap commit duplicat;
4. si no existeix, crea un únic commit lògic de fita segons `git-workflow`;
5. format recomanat:

```text
MILESTONE-MN: descripció breu
```

6. comprova que el commit existeix correctament quan s'hagi creat;
7. continua amb la següent fita.

No facis `push` tret que una instrucció explícita ho demani.

## Bugs

### Error de la tasca actual

```text
validator → FAIL → mateixa tasca → executor
```

No crea `BUG-NNN.md`.

### Defecte en funcionalitat ja amb `status: done`

L'`orchestrator`:

1. comprova a `tasks/` que no existeixi un bug equivalent;
2. crea `tasks/BUG-NNN.md`;
3. documenta reproducció, resultat esperat, observat i evidències;
4. assigna fase i fita;
5. defineix dependències;
6. assigna una `priority` numèrica;
7. posa `status: ready` si és executable o `status: backlog` si està bloquejat;
8. deixa que entri al flux normal.

No creïs GitHub Issues.

## Respecte de l'arquitectura i requisits de `PLAN.md`

Durant la implementació, tracta `PLAN.md` com a font d'autoritat sobre arquitectura, tecnologies, integracions, seguretat i requisits específics del projecte.

Per cada tasca:

* implementa exactament la responsabilitat assignada;
* respecta els límits entre components definits al pla;
* no substitueixis una integració planificada per una connexió directa o una arquitectura alternativa;
* mantén separats els subsistemes que `PLAN.md` declari independents;
* aplica les restriccions de seguretat, permisos, tractament d'entrades, timeouts i neteja quan siguin aplicables;
* comprova la documentació o capacitats reals de les eines quan una tasca depengui d'un mecanisme concret i no estigui prou especificat;
* no inventis credencials, URLs, ports, tokens, models ni configuracions.

Si `PLAN.md` defineix un runtime, agent, provider, model, repositori temporal, contracte estructurat o servei extern, implementa'l mitjançant les tasques corresponents i conserva l'arquitectura exacta definida al pla.

No repeteixis aquí tots els requisits específics del projecte: l'`executor` i el `validator` han de consultar `PLAN.md` i el fitxer de tasca assignat.

## MCP

Utilitza Puppeteer MCP sempre que una funcionalitat sigui observable des del navegador.

GitHub MCP no s'utilitza per gestionar Issues, Projects o estat de desenvolupament.

## Condicions per continuar automàticament

Després de cada tasca amb `PASS`:

1. canvia el seu `status` a `done`;
2. desbloqueja tasques amb `status: backlog` quan correspongui;
3. comprova si s'ha completat una fita;
4. executa `reviewer` si cal;
5. crea commit només si la fita obté `PASS`;
6. selecciona la següent tasca amb `status: ready` i `priority` més baixa;
7. continua.

## Condicions de parada

Atura el bucle només si:

### Projecte complet

* totes les tasques requerides tenen `status: done`;
* no queden bugs bloquejants;
* totes les fites requerides estan superades;
* els commits de fita corresponents existeixen;
* la revisió global final és satisfactòria.

### Bloqueig extern

Existeix una decisió, credencial, recurs, configuració externa o informació imprescindible que els agents no poden resoldre de manera segura.

### Cap tasca executable

Existeixen tasques amb `status: backlog`, però totes estan bloquejades per dependències o condicions que no es poden resoldre dins del bucle actual.

### Error irrecuperable

Un problema impedeix continuar sense risc de corrompre el projecte o Git.

Un `FAIL` normal del validator no és una condició de parada.

## Finalització global

Quan aparentment no quedin tasques pendents:

1. revisa novament tots els fitxers de `tasks/`;
2. comprova que no quedin tasques amb `status: ready`, `status: in_progress` o `status: in_review`;
3. comprova les tasques amb `status: backlog` i determina si són realment innecessaris o estan bloquejats;
4. comprova totes les fases i fites de `PLAN.md`;
5. delega una revisió global final a `reviewer`;
6. gestiona qualsevol bug detectat;
7. torna al bucle si apareixen noves tasques;
8. considera el projecte complet només quan la revisió global sigui satisfactòria i les fites tinguin els seus commits.
