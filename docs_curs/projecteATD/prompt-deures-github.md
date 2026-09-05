# Objectiu

Vull implementar la pàgina web descrita a continuació fent servir un **agent petit, amb poc context i un índex d’intel·ligència baix**.

Per facilitar-ne el desenvolupament, necessito dividir el procés en tres fases i generar **tres prompts independents**:

1. un prompt per configurar l’**arnès de desenvolupament**, sense implementar cap funcionalitat;

2. un prompt per generar la **planificació mitjançant GitHub Projects en mode Kanban**, sense implementar cap funcionalitat;

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

* un agent orquestrador;

* un subagent d’implementació;

* un subagent de revisió;

* un subagent de tests o validació.

L’agent orquestrador ha de saber que, durant la futura fase d’implementació, haurà de:

* consultar mitjançant l’MCP de GitHub el Project del repositori;

* consultar els camps Status, Priority i Phase de cada item;

* seleccionar una sola Issue cada vegada;

* respectar els camps de prioritat i fase, i les dependències;

* delegar-ne la implementació;

* delegar-ne els tests i la revisió;

* moure la tasca entre Backlog, In development i Done actualitzant el camp Status;

* evitar modificacions simultànies incompatibles;

* avançar només quan la Issue actual estigui validada;

* tornar a consultar GitHub abans de cada nova iteració;

* no confiar en l’estat recordat d’execucions anteriors.

GitHub Project i els seus camps han de ser l’**única font de veritat** de l’estat de les tasques.

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

* actualització del camp Status del Project;

* detecció i correcció d’incoherències entre l’estat real de la Issue i les seves etiquetes;

* desbloqueig de les Issues que hagin quedat executables;

* prevenció de la implementació de funcionalitats d’Issues futures.

No mantinguis una còpia local de l’estat de les tasques.

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

* configurar camps del GitHub Project;

* consultar camps del GitHub Project;

* afegir Issues al Project i actualitzar els seus camps;

* gestionar estat, prioritat i fase mitjançant camps del Project;

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

prompt-deures-tasques.md ha de generar exclusivament la planificació del desenvolupament mitjançant un GitHub Project v2 en mode Kanban, fent servir l’MCP de GitHub.

Aquest prompt no pot implementar cap funcionalitat, modificar el codi de l’aplicació ni començar l’execució de cap tasca.

La seva única responsabilitat és:

analitzar el projecte;

definir les tasques;

fes servir el projecte "NOM_PROJECTE" que està vinculat al repositori d'aquest projecte

configurar-ne la vista principal en mode Kanban;

crear o actualitzar les GitHub Issues que representen les tasques;

afegir les Issues al Project;

configurar els camps del Project;

assignar a cada tasca l’estat, prioritat i fase corresponents;

definir dependències, criteris d’acceptació i tests.

## GitHub Project

El GitHub Project és la font de veritat de la planificació i del progrés.

Cada tasca ha de ser una GitHub Issue independent afegida al Project.

Divideix el projecte en tasques petites i atòmiques, ordenades segons prioritat, fase i dependències.

Cada Issue ha de contenir com a mínim:

objectiu;

descripció breu;

dependències;

criteris d’acceptació;

tests necessaris.

El títol de la Issue ha de ser curt, específic i orientat a una única responsabilitat.

La descripció ha de contenir suficient informació perquè un agent petit pugui implementar la tasca sense necessitar carregar tota la planificació del projecte.

Evita Issues grans que agrupin funcionalitats independents.

Les dependències entre Issues s’han d’indicar explícitament.

Quan GitHub i l’MCP disponible permetin representar dependències de manera estructurada, utilitza aquest mecanisme.

En cas contrari, utilitza al cos de la Issue una secció:

Depends on:
- #123
- #124

No dupliquis tota la informació de les Issues relacionades.

## Camps del Project

No utilitzis labels per representar l’estat, la prioritat o la fase.

Utilitza camps del GitHub Project.

Configura com a mínim aquests camps:

Status

Camp de tipus single-select amb exactament aquests valors:

Backlog
In development
Done

Semàntica:

Backlog: tasca encara no completada i no activa;

In development: única tasca principal que s’està implementant, provant o revisant;

Done: tasca completada, validada i tancada.

Només una tasca principal pot estar a In development alhora.

Una tasca només pot passar de Backlog a In development quan totes les seves dependències estiguin completades.

Una tasca només pot passar a Done quan:

els criteris d’acceptació es compleixen;

passen els tests específics;

passa tota la regressió acumulada;

la revisió independent és correcta;

si afecta la UI, passa la validació amb Playwright.

Priority

Camp de tipus single-select:

P0
P1
P2
P3

Un número menor significa una prioritat més alta.

P0 s’ha de reservar per a tasques especialment crítiques o bloquejants.

Phase

Camp de tipus single-select o number, segons el que suporti millor l’MCP:

1
2
3
4
...

La fase representa un punt del desenvolupament en què el conjunt de funcionalitats implementades ha de ser estable i superar tota la regressió acumulada.

## Vista Kanban

Configura una vista principal del Project en mode board/Kanban agrupada pel camp Status.

Les columnes han de correspondre a:

Backlog
In development
Done

El moviment de les targetes entre columnes ha de reflectir l’estat real de la implementació.

No utilitzis labels status:*, priority:* ni phase:*.

## Estat inicial

Quan es generi la planificació:

totes les tasques han de començar a Backlog;

cap tasca ha de començar a In development;

cap tasca ha de començar a Done.

Les dependències determinen quina tasca del Backlog és executable; no és necessari un estat separat Ready.

## Cobertura

Les tasques han de cobrir progressivament:

estructura del servidor;

base de dades;

autenticació;

alumnes;

pràctiques;

entregues;

API;

integració amb el servidor LLM;

valoració automàtica;

interfície d’administrador;

interfície d’alumne;

validació;

seguretat;

tests;

disseny gràfic;

accessibilitat.

## Fases

Assigna una fase a cada item mitjançant el camp Phase del Project.

Una fase només es considera completada quan:

totes les tasques de la fase tenen Status = Done;

totes les Issues corresponents estan tancades;

passen els tests específics;

passen tots els tests de regressió acumulats;

les funcionalitats web afectades passen la validació amb Playwright.

No s’ha d’avançar a la fase següent mentre existeixin errors.

Les tasques de fases futures poden romandre a Backlog fins que les seves dependències estiguin realment completades.

# 11. PLAN.md

PLAN.md ha de descriure la metodologia general d’implementació.

No ha de contenir una còpia de la llista de tasques.

El GitHub Project en mode Kanban és la font de veritat de la planificació i del progrés.

L’agent orquestrador ha de consultar l’estat real del Project mitjançant l’MCP de GitHub abans de seleccionar una tasca.

Les tasques s’han d’executar segons:

dependències;

fase;

prioritat.

Per cada futura iteració d’implementació:

consultar el GitHub Project;

consultar els items i els camps Status, Priority i Phase;

corregir possibles incoherències;

identificar les tasques de Backlog amb totes les dependències completades;

seleccionar la tasca executable de prioritat més alta de la fase activa;

canviar-ne Status de Backlog a In development;

delegar-ne la implementació;

executar els tests específics;

executar els tests de regressió;

fer-la revisar per un agent diferent de l’implementador;

validar els criteris d’acceptació;

si afecta la UI, validar-la amb Playwright;

corregir qualsevol problema;

repetir els tests;

canviar Status a Done només si totes les validacions passen;

tancar la GitHub Issue corresponent;

tornar a consultar el Project;

continuar amb la següent tasca executable.

Treballa en una única tasca principal cada vegada.

No mantinguis una còpia local de l’estat de les tasques.

## Consistència del Project

Abans de cada iteració, comprova la coherència entre el GitHub Project, les Issues, el codi i els tests.

Com a mínim:

una Issue tancada ha de tenir Status = Done;

una tasca amb Status = Done ha de tenir la seva Issue tancada;

una tasca amb dependències pendents no pot passar a In development;

només la tasca actual pot tenir Status = In development;

una tasca a Done ha d’haver superat els seus criteris d’acceptació i tests;

tots els items han de tenir Priority i Phase definits.

Si existeix una incoherència produïda per una execució anterior, corregeix-la mitjançant l’MCP de GitHub abans de continuar.

No confiïs en l’estat recordat d’execucions anteriors.

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

prompt-deures-implementa.md és l’únic dels tres prompts que pot implementar o modificar funcionalitats de l’aplicació.

Ha d’executar un bucle agèntic fins que totes les tasques del GitHub Project estiguin completades.

El GitHub Project en mode Kanban és l’única font de veritat del progrés.

Per cada iteració:

consultar el GitHub Project mitjançant l’MCP de GitHub;

consultar els items i els camps Status, Priority i Phase;

corregir possibles incoherències;

identificar les tasques de Backlog amb totes les dependències completades;

seleccionar la tasca executable de prioritat més alta de la fase activa;

comprovar-ne les dependències;

llegir només el context necessari de la Issue;

canviar-ne Status de Backlog a In development;

delegar la implementació a un subagent;

limitar els canvis a la tasca actual;

crear o actualitzar els tests necessaris;

executar els tests específics;

executar tota la regressió acumulada;

delegar la revisió a un agent diferent;

validar els criteris d’acceptació indicats a la Issue;

si afecta la UI, validar-la amb Playwright;

corregir qualsevol error;

tornar a executar els tests específics;

tornar a executar la regressió;

si tot és correcte, canviar Status a Done;

tancar la GitHub Issue corresponent;

comprovar si s’ha completat una fase;

tornar a consultar el Project;

continuar amb la següent tasca executable.

No implementis funcionalitats de tasques futures.

No facis refactors generals sense necessitat.

Treballa en una única tasca principal cada vegada.

Si no existeix cap tasca executable a Backlog però queden tasques sense completar:

revisa les dependències;

comprova si existeix alguna incoherència al Project;

detecta possibles dependències circulars o bloquejos;

no inventis noves tasques ni modifiquis arbitràriament les dependències.

Cada nova iteració ha de començar consultant de nou GitHub.

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

consulta el GitHub Project;

consulta els items i els camps Status, Priority i Phase;

detecta si existeix alguna tasca deixada a In development;

comprova l’estat real del codi i dels tests abans de decidir què fer;

corregeix qualsevol incoherència entre Project, Issues, codi i tests;

continua des de l’estat real del projecte.

No donis per completada una tasca únicament perquè una execució anterior l’havia deixat a In development.

No reiniciïs la planificació ni creïs Issues duplicades si el Project ja conté la planificació.

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

* definir les regles de treball amb GitHub Project v2 en mode Kanban.

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

* actualitzar el camp Status durant l’execució;

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

* gestió de GitHub Project en mode Kanban;

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

* actualització del camp Status del Project;

* gestió de dependències;

* agents i subagents;

* tests específics;

* regressions;

* validació Playwright;

* revisió independent;

* recuperació després d’interrupcions;

* commits de fita.

El resultat final d’aquesta execució han de ser exclusivament aquests tres prompts.