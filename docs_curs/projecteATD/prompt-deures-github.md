# Objectiu

Vull implementar la pàgina web descrita a continuació fent servir un **agent petit, amb poc context i un índex d’intel·ligència baix**.

Per facilitar-ne el desenvolupament, necessito dividir el procés en tres fases i generar **tres prompts independents**:

1. un prompt per configurar l’**arnès de desenvolupament**, sense implementar cap funcionalitat;
2. un prompt per generar la **planificació mitjançant GitHub Issues i etiquetes de les Issues**, sense implementar cap funcionalitat;
3. un prompt per executar la **implementació completa** seguint aquestes Issues.

Els prompts han de ser clars, directes i especialment pensats perquè un model petit pugui treballar amb poc context.

Genera els següents arxius:

* `prompts/prompt-deures-arnes.md`
* `prompts/prompt-deures-tasques.md`
* `prompts/prompt-deures-implementa.md`

No implementis el servidor durant aquesta execució. Genera només aquests tres prompts.

---

# 1. Prompt de configuració de l’arnès

`prompt-deures-arnes.md` ha de preparar exclusivament l’arnès de desenvolupament abans de començar la implementació.

**Aquest prompt no pot implementar funcionalitats de l’aplicació ni començar cap Issue.**

Ha de definir:

* skills;
* `PLAN.md`;
* agents i subagents;
* `AGENTS.md`.

Els fitxers de skills i agents han de tenir les capçaleres correctes.

En el cas dels agents, la capçalera ha d’indicar si són:

* `primary`;
* `subagent`.

L’arnès ha d’estar especialment preparat perquè un agent petit treballi amb poc context i delegui tasques simples.

Com a mínim, ha d’existir:

* un agent principal/orquestrador;
* un subagent d’implementació;
* un subagent de tests;
* un subagent de revisió o validació.

L’agent principal ha de saber que, durant la futura fase d’implementació, haurà de:

* consultar mitjançant l’MCP de GitHub les Issues del repositori;
* consultar les etiquetes assignades a cada Issue;
* seleccionar una sola Issue cada vegada;
* respectar prioritats, fases i dependències;
* delegar-ne la implementació;
* delegar-ne els tests i la revisió;
* actualitzar les etiquetes d’estat de la Issue;
* evitar modificacions simultànies incompatibles;
* avançar només quan la Issue actual estigui validada;
* tornar a consultar GitHub abans de cada nova iteració;
* no confiar en l’estat recordat d’execucions anteriors.

GitHub Issues i les seves etiquetes han de ser l’**única font de veritat** de l’estat de les tasques.

L’agent que implementa una tasca **no ha de ser l’únic encarregat de validar-la**.

## Skills

Defineix com a mínim skills per a:

### Gestió de tasques

Ha de definir com treballar, durant la fase d’implementació, amb:

* GitHub Issues mitjançant l’MCP de GitHub;
* etiquetes de les Issues;
* Issues executables;
* selecció de la següent Issue;
* prioritats;
* fases;
* dependències;
* actualització de les etiquetes d’estat;
* detecció i correcció d’incoherències entre l’estat real de la Issue i les seves etiquetes;
* desbloqueig de les Issues que hagin quedat executables;
* prevenció de la implementació de funcionalitats d’Issues futures.

No mantinguis l’estat de les tasques en fitxers locals.

### Execució de tasques atòmiques

Ha de fomentar:

* una única responsabilitat principal per Issue;
* canvis petits i localitzats;
* poc context necessari;
* evitar refactors innecessaris.

La Issue actual ha de contenir tota la informació necessària perquè el subagent implementador pugui treballar sense haver de carregar tota la planificació del projecte.

### Tests i prevenció de regressions

Ha de definir que:

* cada funcionalitat nova ha de tenir proves;
* els tests existents s’han de conservar;
* tots els tests previs formen part de la suite de regressió;
* una regressió impedeix completar una Issue.

### Validació web

Hi ha disponible l’**MCP Playwright**.

S’ha de fer servir durant la implementació per validar les funcionalitats web simulant accions reals d’usuari i comprovant també possibles errors del navegador.

### GitHub

Hi ha disponible l’**MCP de GitHub**.

S’ha de fer servir per:

* crear Issues;
* consultar Issues;
* actualitzar Issues;
* tancar Issues;
* crear etiquetes;
* consultar etiquetes;
* assignar i retirar etiquetes de les Issues;
* gestionar estats, prioritats i fases mitjançant etiquetes;
* realitzar els commits de fita.

Abans de realitzar qualsevol operació, comprova l’estat real actual de GitHub.

No assumeixis que la informació recordada d’una execució anterior continua sent correcta.

### Disseny gràfic

Defineix una skill específica per mantenir una interfície:

* senzilla;
* clara;
* funcional;
* responsive;
* accessible;
* inspirada en **Material Design**.

Ha de definir de manera coherent:

* paleta de colors;
* tipografia;
* jerarquia visual;
* navegació;
* formularis;
* taules i llistats;
* targetes;
* botons;
* focus;
* errors;
* estats interactius;
* espaiat.

Evita decoració innecessària i mantén una aparença uniforme entre totes les pàgines.

---

# 2. Arquitectura de l’aplicació

El servidor ha de funcionar amb:

* **Node.js**
* **Express**
* **SQLite**

Tot el servidor ha d’estar dins de:

```text
server/
```

Els fitxers estàtics de la interfície han d’estar dins de:

```text
server/public/
```

Prioritza una arquitectura senzilla, amb poques dependències i fàcil de modificar per un agent petit.

Separa clarament, quan sigui possible:

* accés a dades;
* autenticació i sessions;
* lògica de negoci;
* API HTTP;
* valoració automàtica;
* interfície web.

---

# 3. Usuaris i autenticació

## Administrador

Hi ha un únic usuari administrador:

```text
admin
```

La seva contrasenya està definida a:

```text
SERVER_ADMIN_PWD
```

dins de:

```text
server/settings.env
```

## Alumnes

L’administrador pot crear i gestionar alumnes.

Cada alumne té:

* nom;
* correu electrònic;
* contrasenya.

El correu electrònic i la contrasenya es fan servir per iniciar sessió.

La contrasenya **no s’ha de guardar en text pla**. A la base de dades només se n’ha de guardar el hash segons el mecanisme especificat pel projecte.

L’administrador ha de poder consultar totes les entregues d’un alumne.

---

# 4. Gestió de pràctiques

L’administrador pot crear, modificar i eliminar pràctiques.

Cada pràctica té:

* títol;
* criteris d’acceptació.

Per a cada pràctica, l’administrador pot consultar totes les entregues associades.

---

# 5. Gestió d’entregues

L’administrador pot consultar entregues:

1. seleccionant un alumne;
2. seleccionant una pràctica;
3. des del llistat general d’entregues.

L’administrador pot marcar una entrega com a **revisada**.

L’estat de revisió manual és independent del resultat de la valoració automàtica.

---

# 6. Espai personal de l’alumne

L’alumne accedeix mitjançant:

* correu electrònic;
* contrasenya.

## Entregues

L’alumne pot consultar les entregues que ha fet.

Per cada entrega ha de poder veure com a mínim:

* pràctica;
* URL del repositori;
* resultat de la valoració automàtica;
* si ha estat acceptada o rebutjada;
* si ha estat revisada pel professor.

L’alumne pot eliminar una entrega mentre encara no hagi estat revisada pel professor.

## Enviar

L’alumne pot fer una nova entrega:

1. seleccionant una pràctica;
2. introduint la URL del repositori de GitHub.

---

# 7. Valoració automàtica de les entregues

El servidor Node.js ha de fer directament peticions HTTP a un **servidor LLM compatible amb l’API d’OpenAI**.

La configuració del servidor LLM ha d’estar definida mitjançant variables d’entorn a:

```text
server/settings.env
```

Com a mínim:

```text
LLM_BASE_URL
LLM_API_KEY
LLM_MODEL
```

Els secrets no s’han de guardar al codi ni mostrar-se als logs.

## Procés de valoració

Quan s’ha de valorar una entrega, el servidor ha de:

1. obtenir els criteris d’acceptació de la pràctica;
2. clonar o descarregar el repositori GitHub en una carpeta temporal;
3. analitzar-ne els fitxers necessaris;
4. construir una petició clara i compacta per al model;
5. enviar-la al servidor LLM mitjançant una petició compatible amb l’API d’OpenAI;
6. obtenir una resposta estructurada;
7. guardar a SQLite el resultat de la valoració;
8. eliminar sempre els fitxers temporals.

La petició al LLM ha d’incloure com a mínim:

* instruccions de valoració;
* criteris d’acceptació;
* informació rellevant del repositori.

El resultat ha de permetre determinar de manera inequívoca:

* `accepted`: `true` o `false`;
* explicació breu de la valoració.

La resposta del model s’ha de validar abans de guardar-la.

Un error del servidor LLM no s’ha de confondre amb una entrega rebutjada: l’aplicació ha de poder representar també un estat d’error o valoració pendent.

La implementació ha d’evitar enviar informació innecessària al model, ja que el sistema ha de funcionar correctament amb models petits i context limitat.

---

# 8. Pàgines

La pàgina principal ha de mostrar un login comú.

L’administrador inicia sessió amb:

```text
admin
```

en lloc d’un correu electrònic.

Tingues en compte com a mínim aquestes pàgines:

* `/` — login comú;
* `/admin` — espai principal de l’administrador;
* `/admin/alumnes` — gestió d’alumnes;
* `/admin/practiques` — gestió de pràctiques;
* `/admin/entregues` — consulta i revisió d’entregues;
* `/alumne` — espai principal de l’alumne;
* `/alumne/entregues` — consulta de les seves entregues;
* `/alumne/enviar` — nova entrega.

---

# 9. API HTTP

En generar els prompts, defineix explícitament els endpoints REST necessaris perquè posteriorment es puguin convertir fàcilment en Issues atòmiques i tests.

Utilitza una estructura coherent sota:

```text
/api/...
```

Inclou com a mínim endpoints per a:

* login;
* consulta de sessió;
* logout;
* CRUD d’alumnes;
* CRUD de pràctiques;
* consulta d’entregues;
* entregues per alumne;
* entregues per pràctica;
* creació d’una entrega;
* eliminació d’una entrega;
* marcatge com a revisada;
* consulta del resultat de la valoració;
* execució o reintent de la valoració automàtica quan sigui necessari.

Mantén una correspondència clara entre pàgines, API i funcionalitats.

---

# 10. Prompt de definició de tasques

`prompt-deures-tasques.md` ha de generar exclusivament la planificació del desenvolupament mitjançant **GitHub Issues i etiquetes de les Issues**, fent servir l’MCP de GitHub.

**Aquest prompt no pot implementar cap funcionalitat, modificar el codi de l’aplicació ni començar l’execució de cap Issue.**

La seva única responsabilitat és:

* analitzar el projecte;
* definir les tasques;
* crear o actualitzar les GitHub Issues;
* crear les etiquetes necessàries;
* assignar a cada Issue les etiquetes corresponents;
* definir dependències, criteris d’acceptació i tests.

## GitHub Issues

Divideix el projecte en **tasques petites i atòmiques**, ordenades segons prioritat, fase i dependències.

Cada tasca s’ha de representar mitjançant una GitHub Issue independent.

Cada Issue ha de contenir com a mínim:

* objectiu;
* descripció breu;
* dependències;
* criteris d’acceptació;
* tests necessaris.

El títol de la Issue ha de ser curt, específic i orientat a una única responsabilitat.

La descripció ha de contenir suficient informació perquè un agent petit pugui implementar la Issue sense necessitar carregar tota la planificació del projecte.

Evita Issues grans que agrupin funcionalitats independents.

Les dependències entre Issues s’han d’indicar explícitament.

Quan GitHub i l’MCP disponible permetin representar dependències de manera estructurada, utilitza aquest mecanisme.

En cas contrari, utilitza al cos de la Issue una secció:

```text
Depends on:
- #123
- #124
```

No dupliquis tota la informació de les Issues relacionades.

## Etiquetes de les Issues

L’estat, la prioritat i la fase de cada tasca s’han de representar exclusivament mitjançant etiquetes de GitHub Issues.

Crea les etiquetes necessàries si encara no existeixen.

### Estat

Cada Issue ha de tenir **exactament una** etiqueta d’estat:

```text
status:backlog
status:ready
status:in-progress
status:in-review
status:done
```

Semàntica:

* `status:backlog`: la Issue encara no és executable;
* `status:ready`: totes les dependències estan completades i es pot implementar;
* `status:in-progress`: és la Issue que s’està implementant;
* `status:in-review`: la implementació ha acabat i està en procés de tests o revisió;
* `status:done`: tots els criteris d’acceptació, tests i revisions han passat.

Les etiquetes `status:*` són mútuament excloents.

Quan es canviï l’estat d’una Issue, retira primer l’etiqueta `status:*` anterior i assigna només la nova.

### Prioritat

Cada Issue ha de tenir **exactament una** etiqueta de prioritat:

```text
priority:p0
priority:p1
priority:p2
priority:p3
```

Un número menor significa una prioritat més alta.

`priority:p0` s’ha de reservar per a tasques especialment crítiques o bloquejants.

### Fase

Cada Issue ha de tenir **exactament una** etiqueta de fase.

Utilitza:

```text
phase:1
phase:2
phase:3
phase:4
...
```

La fase representa un punt del desenvolupament en què el conjunt de funcionalitats implementades ha de ser estable i superar tota la regressió acumulada.

## Estat inicial

Quan es generi la planificació:

* les Issues sense dependències pendents han de tenir `status:ready`;
* les Issues bloquejades per altres Issues han de tenir `status:backlog`;
* cap Issue ha de començar amb `status:in-progress`, `status:in-review` o `status:done`.

## Cobertura

Les Issues han de cobrir progressivament:

* estructura del servidor;
* base de dades;
* autenticació;
* alumnes;
* pràctiques;
* entregues;
* API;
* integració amb el servidor LLM;
* valoració automàtica;
* interfície d’administrador;
* interfície d’alumne;
* validació;
* seguretat;
* tests;
* disseny gràfic;
* accessibilitat.

## Fases

Agrupa les Issues per fases mitjançant les etiquetes `phase:*`.

Una fase només es considera completada quan:

* totes les Issues de la fase tenen `status:done`;
* totes les Issues de la fase estan tancades;
* passen els tests específics;
* passen tots els tests de regressió acumulats;
* les funcionalitats web afectades passen la validació amb Playwright.

No s’ha d’avançar a la fase següent mentre existeixin errors.

Les Issues de la fase següent només poden passar a `status:ready` quan les seves dependències estiguin realment completades.

---

# 11. PLAN.md

`PLAN.md` ha de descriure la metodologia general d’implementació.

No ha de contenir una còpia de la llista de tasques.

GitHub Issues i les seves etiquetes són la font de veritat de la planificació.

L’agent principal ha de consultar l’estat real de les Issues mitjançant l’MCP de GitHub abans de seleccionar una tasca.

Les Issues s’han d’executar segons:

1. dependències;
2. fase;
3. prioritat.

Per cada futura iteració d’implementació:

1. consultar les GitHub Issues;
2. consultar les seves etiquetes;
3. corregir possibles incoherències d’estat;
4. detectar Issues amb `status:ready`;
5. seleccionar la Issue executable de prioritat més alta;
6. substituir `status:ready` per `status:in-progress`;
7. delegar-ne la implementació;
8. executar els tests específics;
9. executar els tests de regressió;
10. substituir `status:in-progress` per `status:in-review`;
11. fer-la revisar per un agent diferent de l’implementador;
12. validar els criteris d’acceptació;
13. corregir qualsevol problema;
14. repetir els tests;
15. substituir `status:in-review` per `status:done` només si totes les validacions passen;
16. tancar la GitHub Issue;
17. detectar les Issues que hagin quedat desbloquejades;
18. substituir `status:backlog` per `status:ready` quan totes les seves dependències estiguin completades.

Treballa en una única Issue principal cada vegada.

No mantinguis una còpia local de l’estat de les tasques.

## Consistència de les Issues

Abans de cada iteració, comprova la coherència entre l’estat real de la GitHub Issue i les seves etiquetes.

Com a mínim:

* una Issue tancada ha de tenir `status:done`;
* una Issue amb `status:done` ha d’estar tancada;
* una Issue amb dependències pendents no pot tenir `status:ready`;
* només la tasca actual pot tenir `status:in-progress`;
* una Issue que ja no té dependències pendents pot passar de `status:backlog` a `status:ready`;
* una Issue no pot tenir més d’una etiqueta `status:*`;
* una Issue no pot tenir més d’una etiqueta `priority:*`;
* una Issue no pot tenir més d’una etiqueta `phase:*`.

Si existeix una incoherència produïda per una execució anterior, corregeix-la mitjançant l’MCP de GitHub abans de continuar.

No confiïs en l’estat recordat d’execucions anteriors.

---

# 12. Tests i prevenció de regressions

Les proves han de formar part del desenvolupament des del principi.

Utilitza tests específics per validar:

* base de dades;
* autenticació;
* permisos;
* endpoints REST;
* regles de negoci;
* integració amb el servidor LLM;
* gestió d’errors.

Utilitza **Playwright** per validar les funcionalitats web.

Els tests han de ser acumulatius:

* cada nova funcionalitat ha de tenir els seus tests;
* totes les tasques futures han de continuar passant els tests anteriors;
* una regressió impedeix completar una Issue.

No eliminis ni relaxis tests previs simplement perquè una nova implementació falli.

Una Issue no pot passar a `status:done` mentre existeixi algun error relacionat amb els seus criteris d’acceptació o alguna regressió.

---

# 13. Prompt d’implementació

`prompt-deures-implementa.md` és **l’únic dels tres prompts que pot implementar o modificar funcionalitats de l’aplicació**.

Ha d’executar un bucle agèntic fins que totes les GitHub Issues de la planificació estiguin completades.

GitHub Issues i les seves etiquetes són l’única font de veritat del progrés.


Per cada iteració:

1. consultar les GitHub Issues mitjançant l’MCP de GitHub;
2. consultar les etiquetes actuals de les Issues;
3. corregir possibles incoherències;
4. comprovar quines Issues han quedat desbloquejades;
5. substituir `status:backlog` per `status:ready` quan totes les dependències estiguin completades;
6. identificar les Issues amb `status:ready`;
7. seleccionar la Issue executable de prioritat més alta;
8. comprovar-ne les dependències;
9. llegir només el context necessari de la Issue;
10. substituir `status:ready` per `status:in-progress`;
11. delegar la implementació a un subagent;
12. limitar els canvis a la Issue actual;
13. crear o actualitzar els tests necessaris;
14. executar els tests específics;
15. executar tota la regressió acumulada;
16. substituir `status:in-progress` per `status:in-review`;
17. delegar la revisió a un agent diferent;
18. validar els criteris d’acceptació indicats a la Issue;
19. si afecta la UI, validar-la amb Playwright;
20. corregir qualsevol error;
21. tornar a executar els tests específics;
22. tornar a executar la regressió;
23. si tot és correcte, substituir `status:in-review` per `status:done`;
24. tancar la GitHub Issue;
25. comprovar quines Issues han quedat desbloquejades;
26. passar-les de `status:backlog` a `status:ready` quan correspongui;
27. comprovar si s’ha completat una fase;
28. continuar amb la següent Issue executable.

No implementis funcionalitats d’Issues futures.

No facis refactors generals sense necessitat.

Treballa en **una única Issue principal cada vegada**.

Si no existeix cap Issue `status:ready` però queden Issues sense completar:

1. revisa les dependències;
2. comprova si existeix alguna incoherència d’etiquetes;
3. comprova si alguna Issue hauria d’haver passat de `status:backlog` a `status:ready`;
4. detecta possibles dependències circulars o bloquejos;
5. no inventis noves tasques ni modifiquis arbitràriament les dependències.

Cada nova iteració ha de començar consultant de nou GitHub.

---

# 14. Commits de fita

Quan es completi una fase i tots els seus tests passin, fes un **commit de fita** mitjançant l’MCP de GitHub.

No facis commits per cada Issue.

Abans del commit de fita comprova que:

* totes les Issues de la fase tenen `status:done`;
* totes les Issues de la fase estan tancades;
* passen tots els tests específics;
* passa tota la regressió acumulada;
* les validacions Playwright necessàries han passat.

El missatge del commit ha d’identificar clarament la fase completada.

Quan sigui útil, pot fer referència a les Issues completades, però evita missatges excessivament llargs.

El token està disponible a:

```text
GITHUB_PERSONAL_ACCESS_TOKEN
```

i a l’arxiu:

```text
settings.env
```

No mostris ni incloguis mai tokens, claus, contrasenyes o altres secrets als commits o logs.

---

# 15. Recuperació després d’una interrupció

El procés ha de poder continuar correctament després d’aturar i tornar a executar l’agent.

En començar una nova execució del prompt d’implementació:

1. consulta les GitHub Issues obertes i tancades;
2. consulta les etiquetes `status:*`, `priority:*` i `phase:*`;
3. detecta possibles Issues deixades amb `status:in-progress` o `status:in-review`;
4. comprova l’estat real del codi i dels tests abans de decidir què fer;
5. corregeix qualsevol incoherència de les Issues o de les seves etiquetes;
6. continua des de l’estat real del projecte.

No donis per completada una Issue únicament perquè una execució anterior l’havia deixat amb `status:in-review`.

No reiniciïs la planificació ni creïs Issues duplicades si el projecte ja conté la planificació.

---

# Criteris generals

Els tres prompts han d’estar especialment optimitzats per treballar amb **models petits, poc context i capacitat de raonament limitada**.

Prioritza:

* instruccions simples;
* Issues atòmiques;
* poca informació necessària per cada execució;
* una sola Issue activa;
* canvis petits;
* responsabilitats separades entre agents;
* arquitectura simple;
* tests freqüents;
* regressions acumulatives;
* validació abans d’avançar;
* GitHub Issues com a font de veritat;
* etiquetes de GitHub Issues per representar estat, prioritat i fase;
* recuperació fiable després d’interrupcions.

Evita:

* tasques grans;
* context innecessari;
* refactors no relacionats;
* dependències innecessàries;
* prompts excessivament llargs dins de l’arnès generat;
* duplicació d’instruccions;
* mantenir l’estat de les tasques simultàniament a GitHub i en fitxers locals;
* crear Issues duplicades;
* confiar en informació de GitHub obtinguda en execucions anteriors sense tornar-la a consultar.

---

# Separació estricta de fases

Els tres prompts tenen responsabilitats diferents i no s’han de barrejar.

## `prompt-deures-arnes.md`

Només pot:

* crear/configurar skills;
* crear `PLAN.md`;
* crear/configurar agents i subagents;
* crear `AGENTS.md`;
* definir les regles de treball amb GitHub Issues i etiquetes.

**No pot implementar funcionalitats de l’aplicació.**

**No pot començar a executar Issues.**

## `prompt-deures-tasques.md`

Només pot:

* analitzar els requisits;
* crear la planificació;
* crear o actualitzar GitHub Issues;
* crear i assignar etiquetes;
* definir dependències;
* definir criteris d’acceptació;
* definir tests;
* assignar estat inicial, prioritat i fase.

**No pot implementar funcionalitats de l’aplicació.**

**No pot modificar el codi de l’aplicació.**

**No pot començar a executar les Issues creades.**

Quan hagi acabat de generar tota la planificació, s’ha d’aturar.

## `prompt-deures-implementa.md`

És l’únic prompt autoritzat a:

* seleccionar Issues executables;
* modificar el codi;
* implementar funcionalitats;
* crear o modificar tests;
* executar tests;
* validar amb Playwright;
* revisar implementacions;
* actualitzar les etiquetes d’estat durant l’execució;
* tancar Issues;
* fer commits de fita.

---

# Arxius que necessito

No implementis el servidor durant aquesta execució.

Genera exclusivament:

1. `prompts/prompt-deures-arnes.md`

   * skills;
   * `PLAN.md`;
   * agents i subagents;
   * `AGENTS.md`;
   * integració amb l’MCP de GitHub;
   * gestió de GitHub Issues i etiquetes;
   * **cap implementació de l’aplicació**.

2. `prompts/prompt-deures-tasques.md`

   * ha de crear la planificació mitjançant GitHub Issues;
   * ha de crear i utilitzar etiquetes `status:*`;
   * ha de crear i utilitzar etiquetes `priority:*`;
   * ha de crear i utilitzar etiquetes `phase:*`;
   * ha de definir prioritats i dependències;
   * ha d’incloure criteris d’acceptació i tests a cada Issue;
   * **no ha d’implementar cap funcionalitat**.

3. `prompts/prompt-deures-implementa.md`

   * implementació dirigida per GitHub Issues;
   * selecció de la següent Issue mitjançant l’MCP de GitHub;
   * actualització de les etiquetes d’estat;
   * gestió de dependències;
   * agents i subagents;
   * tests específics;
   * regressions;
   * validació Playwright;
   * revisió independent;
   * recuperació després d’interrupcions;
   * commits de fita.

El resultat final d’aquesta execució han de ser exclusivament aquests tres prompts.
