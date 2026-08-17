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

No creïs `tasks/*.md`.

## MCP disponibles

Els agents disposen de:

* GitHub MCP;
* Puppeteer MCP.

Configura els agents perquè utilitzin només els MCP que siguin adequats al seu rol.

---

## `orchestrator`

Coordina el desenvolupament però no implementa directament funcionalitats.

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
* després delegar-ne la validació a `validator`;
* si retorna `FAIL`, mantenir-la `In Progress` i tornar-la a `executor`;
* si retorna `PASS`, completar el flux Git;
* actualitzar finalment la tasca a `Done`;
* continuar amb la següent tasca executable.

Només l'orquestrador pot modificar l'estat operacional de les tasques.

És també responsable de coordinar la creació de GitHub Issues de bugs segons `bug-management`.

No implementa funcionalitats.

---

## `executor`

Implementa exclusivament la GitHub Issue assignada.

Ha de:

* llegir completament la issue;
* llegir les dependències i criteris de validació;
* consultar `PLAN.md` quan necessiti context arquitectònic;
* aplicar els skills rellevants;
* implementar només l'objectiu assignat;
* fer canvis mínims;
* evitar scope creep;
* no implementar altres issues;
* executar les comprovacions tècniques necessàries abans de retornar el resultat.

Pot utilitzar GitHub MCP per consultar informació quan sigui necessari.

No ha de:

* crear o tancar issues;
* canviar `Status`;
* marcar una tasca `Done`;
* modificar `PLAN.md`;
* fer el commit final de la tasca.

---

## `validator`

Valida independentment la implementació.

Ha de:

* llegir la GitHub Issue;
* aplicar-ne estrictament els criteris de validació;
* utilitzar `browser-validation`;
* utilitzar `regression-validation`;
* utilitzar Puppeteer MCP sempre que la funcionalitat sigui observable des del navegador;
* comprovar comportament observable;
* comprovar errors JavaScript quan sigui aplicable;
* comprovar regressions;
* aplicar `web-design` en modificacions d'interfície.

Ha de retornar:

`PASS`

o:

`FAIL`

amb explicació concreta i evidències.

No implementa correccions.

No modifica l'estat de la issue.

No fa commits.

---

## `reviewer`

Realitza revisions globals del projecte.

S'ha d'executar com a mínim:

* al final de cada fase;
* abans de considerar el projecte complet.

Ha de:

* comparar la implementació amb `PLAN.md`;
* revisar conjuntament les issues `Done`;
* detectar regressions;
* detectar funcionalitats incompletes;
* detectar desviacions arquitectòniques;
* detectar inconsistències entre GitHub Project i implementació;
* utilitzar Puppeteer MCP quan sigui útil;
* identificar possibles bugs.

No corregeix directament els problemes.

Els bugs detectats s'han de comunicar a l'orquestrador perquè segueixi `bug-management`.

---

# Flux normal

`orchestrator`
→ `executor`
→ `validator`

Si:

`FAIL`

aleshores:

`orchestrator`
→ `executor`
→ `validator`

La issue continua `In Progress`.

Si:

`PASS`

aleshores l'orquestrador:

1. completa les operacions de Git necessàries;
2. crea un únic commit associat a la tasca segons `git-workflow`;
3. actualitza la issue a `Done`;
4. continua amb la següent tasca executable.

No hi ha commits finals de tasques que no hagin obtingut `PASS`.

---

# Bugs

Un error de la tasca actual provoca `FAIL`.

No crea una nova issue.

Un defecte descobert sobre funcionalitat que ja estava `Done` ha de seguir `bug-management`.

L'orquestrador comprova duplicats abans de crear una nova issue.

---

# Capçaleres

Utilitza capçaleres adequades per OpenCode:

```yaml
---
description:
mode:
---