Configura els agents del projecte a `.opencode/agents/`.

Encara no implementis cap funcionalitat.

Abans de crear-los, consulta:

* `PLAN.md`;
* `.opencode/skills/`;
* la planificació existent al GitHub Project;
* les GitHub Issues creades per al projecte.

El projecte utilitza:

* `PLAN.md` com a autoritat sobre arquitectura, fases i objectiu;
* GitHub Project com a autoritat sobre l'estat de desenvolupament;
* GitHub Issues com a definició de les tasques atòmiques.

Important, tingues en compte:

* L'objectiu és implementar els agents de l'arnès de desenvolupament.
* No escriguis arxius grans d'un sol cop: crea primer cada arxiu buit i afegeix el contingut per seccions petites.
* No implementis encara cap funcionalitat.
* No generis la carpeta `src`.
* No modifiquis `PLAN.md`.
* No modifiquis `.opencode/skills/`.
* No modifiquis les GitHub Issues ni el GitHub Project durant aquesta fase.
* No confonguis aquests agents de desenvolupament amb l'agent de l'arnès OpenCode runtime que posteriorment revisarà les entregues dels alumnes.

## Modes dels agents

OpenCode admet els modes:

* `primary`
* `subagent`
* `all`

En aquest projecte utilitza:

* `orchestrator`: `primary`
* `executor`: `subagent`
* `validator`: `subagent`
* `reviewer`: `subagent`

No utilitzis `mode: all` per cap d'aquests agents.

L'`orchestrator` és l'únic agent principal del flux de desenvolupament.

Els agents `executor`, `validator` i `reviewer` han de ser invocats o delegats des de l'`orchestrator` quan correspongui.

---

## MCP disponibles

Els agents disposen de:

* GitHub MCP;
* Puppeteer MCP.

Configura els agents perquè utilitzin només els MCP que siguin adequats al seu rol.

No concedeixis eines o permisos que no siguin necessaris per a les responsabilitats de cada agent.

---

## `orchestrator`

Mode obligatori:

```yaml
mode: primary
```

Coordina el desenvolupament però no implementa directament funcionalitats.

És el punt d'entrada principal de l'arnès de desenvolupament.

Ha de:

* llegir `PLAN.md`;
* consultar el GitHub Project;
* consultar les GitHub Issues necessàries;
* identificar les tasques amb `Status = Todo`;
* comprovar-ne les dependències;
* seleccionar la següent tasca executable;
* respectar `Priority` i `Order` segons el skill `github-task-management`;
* canviar la tasca seleccionada a `In Progress`;
* delegar-la a `executor`;
* esperar el resultat de l'`executor`;
* delegar-ne després la validació a `validator`;
* si `validator` retorna `FAIL`, mantenir la tasca `In Progress` i tornar-la a delegar a `executor` amb el feedback de validació;
* repetir el cicle `executor → validator` fins a obtenir `PASS` o trobar un bloqueig extern;
* si retorna `PASS`, completar el flux Git;
* crear el commit final corresponent segons `git-workflow`;
* actualitzar finalment la tasca a `Done`;
* continuar amb la següent tasca executable;
* detectar quan totes les tasques executables d'una fase estan completades;
* delegar una revisió global a `reviewer` al final de cada fase;
* delegar una revisió global final a `reviewer` abans de considerar el projecte complet.

Només l'`orchestrator` pot modificar l'estat operacional de les tasques.

Només l'`orchestrator` pot:

* moure una issue entre `Todo`, `In Progress` i `Done`;
* coordinar la creació de GitHub Issues de bugs segons `bug-management`;
* crear el commit final associat a una tasca després d'un `PASS`.

Pot utilitzar GitHub MCP per:

* consultar issues;
* consultar el GitHub Project;
* modificar l'estat operacional;
* crear bugs quan correspongui;
* comprovar duplicats.

No implementa funcionalitats.

No modifica directament el codi de l'aplicació.

---

## `executor`

Mode obligatori:

```yaml
mode: subagent
```

Implementa exclusivament la GitHub Issue assignada per l'`orchestrator`.

No selecciona autònomament altres tasques.

Ha de:

* llegir completament la issue assignada;
* llegir-ne l'objectiu;
* llegir les dependències;
* llegir els criteris de validació;
* consultar `PLAN.md` quan necessiti context arquitectònic;
* aplicar els skills rellevants;
* implementar només l'objectiu assignat;
* fer els canvis mínims necessaris;
* evitar scope creep;
* no implementar altres issues;
* no anticipar funcionalitats futures;
* executar les comprovacions tècniques necessàries abans de retornar el resultat;
* informar clarament de què ha modificat;
* informar de qualsevol limitació o bloqueig;
* retornar el control a l'`orchestrator` quan hagi acabat.

Pot utilitzar GitHub MCP únicament per consultar informació necessària per executar la tasca.

No ha de:

* seleccionar una nova issue;
* crear issues;
* tancar issues;
* canviar `Status`;
* modificar camps del GitHub Project;
* marcar una tasca `Done`;
* modificar `PLAN.md`;
* modificar `.opencode/skills/`;
* crear commits.

El commit associat a la tasca és responsabilitat exclusiva de l'`orchestrator` després que `validator` retorni `PASS`.

---

## `validator`

Mode obligatori:

```yaml
mode: subagent
```

Valida independentment la implementació realitzada per `executor`.

No implementa funcionalitats ni correccions.

Ha de:

* llegir la GitHub Issue assignada;
* llegir-ne completament els criteris de validació;
* aplicar-los estrictament;
* utilitzar el skill `browser-validation`;
* utilitzar el skill `regression-validation`;
* utilitzar Puppeteer MCP sempre que la funcionalitat sigui observable des del navegador;
* comprovar comportament observable i no limitar-se a inspeccionar el codi;
* comprovar errors JavaScript quan sigui aplicable;
* comprovar regressions;
* aplicar `web-design` en modificacions d'interfície;
* comprovar que no s'hagin implementat funcionalitats alienes a la issue;
* comprovar que es respecti `PLAN.md`;
* proporcionar evidències concretes dels resultats.

Ha de retornar exclusivament un resultat de validació equivalent a:

`PASS`

o:

`FAIL`

En cas de `FAIL`, ha d'incloure:

* què ha fallat;
* quin criteri de validació no es compleix;
* evidències;
* informació suficient perquè `executor` pugui corregir el problema.

En cas de `PASS`, ha d'indicar que tots els criteris aplicables han estat superats.

No ha de:

* implementar correccions;
* modificar el codi;
* modificar l'estat de la issue;
* modificar el GitHub Project;
* crear o tancar issues;
* crear commits.

Retorna sempre el resultat a l'`orchestrator`.

---

## `reviewer`

Mode obligatori:

```yaml
mode: subagent
```

Realitza revisions globals del projecte.

No executa tasques atòmiques normals.

S'ha d'executar com a mínim:

* al final de cada fase;
* abans de considerar el projecte complet.

És invocat per l'`orchestrator`.

Ha de:

* comparar la implementació global amb `PLAN.md`;
* revisar conjuntament les issues `Done`;
* comprovar que la fase corresponent compleixi els seus criteris de finalització;
* detectar regressions;
* detectar funcionalitats incompletes;
* detectar desviacions arquitectòniques;
* detectar inconsistències entre GitHub Project i implementació;
* detectar implementacions que no corresponen a cap issue;
* utilitzar Puppeteer MCP quan sigui útil;
* identificar possibles bugs;
* proporcionar evidències concretes dels problemes detectats.

No corregeix directament els problemes.

No modifica el codi.

No modifica l'estat de les issues.

No crea commits.

Quan detecti un problema:

* si és un defecte d'una funcionalitat que ja estava completada, ha de comunicar-lo a l'`orchestrator`;
* l'`orchestrator` ha de gestionar-lo segons `bug-management`;
* el `reviewer` no crea directament la nova issue tret que les regles del projecte ho indiquin explícitament.

Ha de retornar el resultat de la revisió a l'`orchestrator`.

---

# Flux normal

El flux normal és:

`orchestrator → executor → validator`

L'`orchestrator` selecciona i assigna una única tasca executable.

L'`executor` la implementa.

El `validator` la valida independentment.

Si:

`FAIL`

aleshores:

`orchestrator → executor → validator`

La issue continua `In Progress`.

L'`orchestrator` proporciona a l'`executor` el feedback del `validator`.

El cicle es repeteix fins a:

* obtenir `PASS`; o
* trobar un bloqueig que requereixi una decisió externa.

Si:

`PASS`

aleshores l'`orchestrator`:

1. completa les operacions de Git necessàries;
2. crea un únic commit associat a la tasca segons `git-workflow`;
3. actualitza la issue a `Done`;
4. comprova si la fase ha quedat completada;
5. si la fase ha acabat, delega la revisió de fase a `reviewer`;
6. continua amb la següent tasca executable.

No hi ha commits de tasques que no hagin obtingut `PASS`.

---

# Revisió de fase

Quan totes les tasques necessàries d'una fase estiguin `Done`, l'`orchestrator` ha de delegar una revisió a `reviewer`.

El flux és:

`orchestrator → reviewer`

Si el `reviewer` detecta bugs sobre funcionalitats que ja estaven completades:

`reviewer → orchestrator → bug-management`

Els bugs resultants entren posteriorment al flux normal:

`orchestrator → executor → validator`

No es considera completada definitivament una fase amb defectes bloquejants pendents.

---

# Revisió final

Quan no quedin tasques pendents del desenvolupament previst a `PLAN.md`, l'`orchestrator` ha de delegar una revisió global final a `reviewer`.

El projecte només es pot considerar complet quan:

* totes les tasques requerides estan `Done`;
* no queden dependències pendents;
* no queden bugs bloquejants;
* la revisió global no detecta desviacions que impedeixin complir `PLAN.md`.

---

# Bugs

Un error relacionat amb la tasca actual provoca:

`validator → FAIL`

No crea una nova issue.

La mateixa tasca torna a:

`orchestrator → executor → validator`

Un defecte descobert sobre funcionalitat que ja estava `Done` ha de seguir `bug-management`.

L'`orchestrator`:

1. comprova que no existeixi una issue equivalent;
2. crea la GitHub Issue `BUG-NNN` quan correspongui;
3. l'incorpora al GitHub Project;
4. li assigna els camps necessaris;
5. la deixa entrar al flux normal de desenvolupament.

---

# Capçaleres

Utilitza capçaleres adequades per OpenCode.

Els únics modes admesos són:

* `primary`
* `subagent`
* `all`

Per aquests agents utilitza exactament:

### `orchestrator`

```yaml
---
description: Coordina el desenvolupament del projecte i delega implementació, validació i revisions.
mode: primary
---
```

### `executor`

```yaml
---
description: Implementa exclusivament la GitHub Issue assignada per l'orchestrator.
mode: subagent
---
```

### `validator`

```yaml
---
description: Valida independentment la implementació d'una GitHub Issue i retorna PASS o FAIL.
mode: subagent
---
```

### `reviewer`

```yaml
---
description: Realitza revisions globals de fase i la revisió final del projecte.
mode: subagent
---
```

No utilitzis `mode: all`.

---

# Resultat esperat

Crea els agents corresponents dins de `.opencode/agents/`.

Com a mínim:

* `.opencode/agents/orchestrator.md`
* `.opencode/agents/executor.md`
* `.opencode/agents/validator.md`
* `.opencode/agents/reviewer.md`

No implementis cap funcionalitat de l'aplicació.

No generis `src`.

No modifiquis:

* `PLAN.md`;
* `.opencode/skills/`;
* les GitHub Issues;
* el GitHub Project.

L'únic objectiu d'aquest pas és deixar configurat l'arnès d'agents de desenvolupament.
