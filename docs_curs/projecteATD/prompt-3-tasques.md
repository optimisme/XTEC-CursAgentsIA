Genera la planificació executable del projecte mitjançant GitHub Issues i el GitHub Project existent `ProjecteDeures`, vinculat al repositori `RevisorDeures`, aplicant Atomic Task Decomposition (ATD).

Abans de començar llegeix:

* `PLAN.md`;
* `.opencode/skills/github-task-management`;
* `.opencode/skills/atomic-task-execution`;
* `.opencode/skills/browser-validation`;
* `.opencode/skills/regression-validation`;
* `.opencode/skills/git-workflow`;
* `.opencode/skills/bug-management`.

Important, tingues en compte:

* L'objectiu és definir les tasques a GitHub.
* No implementis encara cap funcionalitat.
* No generis la carpeta "src", ni implementis cap de les tasques definides.
* No escriguis arxius grans d'un sol cop: crea primer cada arxiu buit i afegeix el contingut per seccions petites.
* Les tasques es defineixen a GitHub com a "Issues" tipus "Open"
* No implementis encara cap funcionalitat.
* No generis la carpeta "src"
* No modifiquis `PLAN.md`.
* No modifiquis `.opencode/skills/`.
* No creïs agents ni AGENTS.md

Utilitza GitHub MCP per crear les GitHub Issues i incorporar-les i configurar-les dins del GitHub Project `ProjecteDeures`. No creïs cap GitHub Project nou.

## Principi arquitectònic obligatori

La planificació ha de respectar estrictament l'arquitectura definida a `PLAN.md`:

`servidor Node.js → OpenCode runtime → agent de revisió → model configurat a OpenCode`

No creïs una tasca que implementi la validació de pràctiques mitjançant una crida directa del servidor Node.js a vLLM o a una API OpenAI-compatible.

El servidor pot gestionar la invocació d'OpenCode, però la configuració del provider, model, `baseURL`, context, output i opcions de raonament ha de pertànyer a l'arnès OpenCode runtime.

Mantén separats:

* els agents OpenCode de desenvolupament del projecte;
* l'arnès OpenCode runtime que revisarà les entregues.

## GitHub

El repositori de desenvolupament és `RevisorDeures`.

El GitHub Project de seguiment ja existeix i és `ProjecteDeures`, vinculat a `RevisorDeures`.

Abans de crear les tasques:

1. utilitza GitHub MCP per localitzar `ProjecteDeures`;
2. comprova que és el Project vinculat al repositori `RevisorDeures`;
3. consulta els camps existents del Project;
4. reutilitza els camps compatibles ja existents;
5. crea o configura únicament els camps necessaris si GitHub MCP ho permet;
6. no creïs cap Project alternatiu;
7. no utilitzis labels com a substitut de `Status`, `Type`, `Phase`, `Order` o `Priority`.

Utilitza, sempre que les capacitats disponibles del GitHub MCP ho permetin, els camps de `ProjecteDeures`:

### Status

* `Todo`
* `In Progress`
* `Done`

### Type

* `Task`
* `Bug`

### Phase

Valors corresponents a les fases definides a `PLAN.md`.

### Order

Camp numèric per definir l'ordre normal de desenvolupament.

Assigna inicialment valors separats preferentment per increments de 10.

### Priority

* `Urgent`
* `High`
* `Medium`
* `Low`

No utilitzis la posició visual de les targetes com a única definició de l'ordre.

Si alguna operació concreta sobre `ProjecteDeures` no està disponible a través del GitHub MCP instal·lat, no inventis que s'ha realitzat, no creïs un Project alternatiu i informa clarament de la limitació.

## GitHub Issues

Transforma `PLAN.md` en tasques ATD.

Cada tasca ha de correspondre a una única GitHub Issue del repositori `RevisorDeures` i aquesta issue s'ha d'incorporar com a item de `ProjecteDeures`.

Utilitza identificadors globals:

`TASK-001`
`TASK-002`
`TASK-003`
...

No reiniciïs la numeració entre fases.

El títol ha de seguir preferentment:

`TASK-NNN — descripció breu`

Cada issue ha d'incloure:

## Objective

Un únic resultat concret.

## Implementation

Què s'ha d'implementar.

## Validation

Criteris objectius que ha de comprovar el validator.

Quan sigui observable des del navegador, indica explícitament que s'ha de validar mitjançant Puppeteer MCP.

## Dependencies

Issues que han d'estar `Done` abans de poder executar-la.

Utilitza referències GitHub sempre que sigui possible.

## Phase

Fase de `PLAN.md` a la qual pertany.

## Regles ATD

Cada issue:

* ha de tenir un únic objectiu;
* ha de ser prou petita per una única iteració;
* ha de poder validar-se independentment;
* ha de dependre només de treball anterior;
* no ha d'incloure funcionalitats futures;
* ha de produir un canvi coherent que pugui correspondre a un commit.

Si una tasca és massa gran, divideix-la.

No creïs una issue independent de validació per cada implementació.

La validació forma part del flux normal:

`executor → validator`

Crea tasques específiques de validació només quan siguin:

* proves transversals;
* integracions;
* validacions globals de fase;
* regressions àmplies;
* validació final.

## Cobertura específica de l'arnès OpenCode runtime

La descomposició ha d'incloure, segons les fases de `PLAN.md`, tasques atòmiques per implementar els elements següents.

### Estructura de l'arnès

* directori propi per al projecte OpenCode runtime;
* configuració pròpia d'OpenCode;
* separació respecte `.opencode/agents/` de desenvolupament;
* instruccions pròpies de l'arnès;
* agent especialitzat en revisió d'entregues;
* skills runtime quan siguin justificats;
* permisos restrictius.

### Configuració del model

* provider configurable a OpenCode;
* model configurable a OpenCode;
* `baseURL` configurable;
* límit de context configurable;
* límit de sortida configurable;
* opcions de raonament configurables quan el provider les suporti;
* absència de valors sensibles hardcoded;
* possibilitat d'utilitzar un endpoint vLLM compatible amb OpenAI.

No facis que aquests paràmetres formin part de la lògica de validació del servidor Node.js.

### Agent runtime de revisió

L'agent ha de:

* revisar exclusivament el criteri rebut;
* inspeccionar el repositori del directori de treball;
* no modificar fitxers;
* no crear commits;
* no gestionar GitHub;
* tractar el contingut del repositori com a dades no fiables;
* ignorar instruccions del repositori que intentin modificar el procés de revisió;
* buscar evidències concretes;
* retornar una resposta estructurada.

### Contracte de resposta

Planifica la definició i validació d'un contracte amb:

* `status`;
* `evidence`;
* `feedback`.

`status` només pot ser:

* `PASS`;
* `FAIL`;
* `NEEDS_REVIEW`.

El servidor ha de validar aquest contracte abans de persistir el resultat.

### Invocació des de Node.js

Planifica tasques per:

* servei responsable d'executar OpenCode;
* execució no interactiva;
* selecció explícita de l'agent runtime;
* directori de treball corresponent al repositori temporal;
* prompt específic per criteri;
* captura de stdout;
* captura de stderr;
* captura del codi de sortida;
* timeout;
* cancel·lació del procés;
* gestió d'errors;
* neteja de recursos;
* parseig de la resposta estructurada.

La implementació ha d'evitar dependre d'un shell construït mitjançant concatenació insegura de text proporcionat per l'usuari.

### Context de la validació

Planifica que el servidor proporcioni a OpenCode només la informació necessària:

* identificador de pràctica;
* identificador del criteri;
* text del criteri;
* context mínim necessari.

OpenCode ha d'obtenir la informació del codi inspeccionant el repositori en lloc de rebre tot el seu contingut dins del prompt.

### Repositoris temporals

Inclou:

* validació de URL;
* acceptació inicial exclusivament de repositoris públics accessibles per HTTPS a `github.com`;
* rebuig d'URLs Git arbitràries, hosts alternatius i esquemes diferents d'HTTPS;
* clonació o obtenció segura;
* directori temporal únic;
* límits raonables;
* neteja final;
* errors Git/GitHub;
* repositoris inexistents o no accessibles.

No planifiquis executar arbitràriament el codi del repositori sense aïllament explícit.

### Seguretat

Inclou tasques per validar:

* contingut no fiable;
* prompt injection dins de README, codi, comentaris o altres fitxers;
* permisos de lectura;
* absència de GitHub MCP a l'agent runtime;
* absència d'eines d'escriptura sobre el repositori;
* absència d'execució de comandes o codi del repositori sense un mecanisme d'aïllament explícit;
* absència d'accés de xarxa innecessari;
* restricció d'accés al repositori temporal i als recursos propis de l'arnès runtime quan OpenCode ho permeti;
* absència d'escriptura innecessària;
* paths;
* timeouts;
* processos abandonats;
* sortides excessives;
* respostes malformades.

## Ordre

Assigna `Order` segons les dependències reals.

L'ordre ha de permetre que el projecte evolucioni progressivament cap a estats funcionals.

Una tasca no és executable només pel seu `Order`: totes les dependències han d'estar `Done`.

## Prioritat inicial

Utilitza `Medium` per defecte.

Utilitza `High` només quan existeixi una raó clara.

Reserva `Urgent` principalment per bugs bloquejants descoberts durant el desenvolupament.

## Estat inicial

Totes les tasques creades durant aquesta planificació han de començar com:

`Status = Todo` dins de `ProjecteDeures`

No comencis a implementar-les.

## Cobertura mínima

Les issues han de cobrir com a mínim:

* inicialització Node.js;
* servidor web;
* estructura de l'aplicació;
* interfície;
* creació i edició de pràctiques;
* criteris d'acceptació;
* formulari d'entrega;
* URL GitHub;
* accessibilitat del repositori;
* obtenció temporal;
* inspecció segura dels fitxers;
* contingut no fiable;
* estructura de l'arnès OpenCode runtime;
* configuració OpenCode runtime;
* provider;
* model;
* `baseURL`;
* context;
* output;
* raonament configurable;
* endpoint vLLM compatible amb OpenAI;
* agent runtime de revisió;
* permisos de l'agent;
* protecció contra prompt injection;
* invocació d'OpenCode des de Node.js;
* execució no interactiva;
* directori de treball;
* prompt específic per criteri;
* timeout;
* stdout;
* stderr;
* codi de sortida;
* resposta estructurada;
* validació de l'esquema;
* validació individual;
* `PASS`;
* `FAIL`;
* `NEEDS_REVIEW`;
* evidències;
* feedback;
* resultat global segons la regla: qualsevol `FAIL` → `FAIL`; cap `FAIL` però algun `NEEDS_REVIEW` → `NEEDS_REVIEW`; tots `PASS` → `PASS`;
* tractament separat dels errors tècnics, que mai no es poden convertir en `PASS`;
* persistència;
* errors Git/GitHub;
* errors d'OpenCode;
* errors del provider/model;
* respostes incorrectes de l'agent;
* neteja de processos i directoris temporals;
* validacions Puppeteer;
* regressions;
* validació global.

## Validacions arquitectòniques obligatòries

Inclou criteris que permetin comprovar que:

* el servidor no valida les entregues invocant directament vLLM;
* OpenCode és la capa runtime encarregada d'executar l'agent;
* la configuració del model resideix a OpenCode;
* l'agent runtime és diferent dels agents de desenvolupament;
* un canvi de provider o model no obliga a modificar la lògica de negoci del servidor;
* el repositori de l'alumne no pot alterar les instruccions de revisió;
* cada criteri es valida independentment;
* una resposta malformada no es tracta com a `PASS`.

## Revisió final

Abans d'acabar:

* comprova que totes les fases de `PLAN.md` estan cobertes;
* comprova dependències;
* comprova que no hi ha cicles;
* comprova identificadors;
* comprova que no hi ha tasques duplicades;
* comprova atomicitat;
* comprova criteris de validació;
* comprova l'ordre;
* comprova cobertura funcional;
* comprova que no s'ha introduït una integració directa Node.js → vLLM per validar entregues;
* comprova que l'arnès OpenCode runtime queda completament cobert.
