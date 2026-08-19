# Objectiu

Vull implementar la pàgina web descrita a continuació fent servir un **agent petit, amb poc context i un índex d’intel·ligència baix**.

Per facilitar-ne el desenvolupament, necessito dividir el procés en tres fases i generar **tres prompts independents**:

1. un prompt per configurar l’**arnès de desenvolupament**;
2. un prompt per generar la **planificació de tasques**;
3. un prompt per executar la **implementació completa** seguint aquestes tasques.

Els prompts han de ser clars, directes i especialment pensats perquè un model petit pugui treballar amb poc context.

Genera els següents arxius:

* `prompts/prompt-deures-arnes.md`
* `prompts/prompt-deures-tasques.md`
* `prompts/prompt-deures-implementa.md`

No implementis el servidor. Genera només aquests tres prompts.

---

# 1. Prompt de configuració de l’arnès

`prompt-arnes.md` ha de preparar l’arnès de desenvolupament abans de començar la implementació.

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

L’agent principal ha de:

* consultar `tasks/tasks-deures.md`;
* seleccionar una sola tasca cada vegada;
* respectar prioritats i dependències;
* delegar-ne la implementació;
* delegar-ne els tests i la revisió;
* evitar modificacions simultànies incompatibles;
* avançar només quan la tasca actual estigui validada.

L’agent que implementa una tasca **no ha de ser l’únic encarregat de validar-la**.

## Skills

Defineix com a mínim skills per a:

### Gestió de tasques

Ha de permetre:

* seleccionar la següent tasca;
* respectar prioritats i dependències;
* actualitzar-ne l’estat;
* evitar implementar funcionalitats de tasques futures.

### Execució de tasques atòmiques

Ha de fomentar:

* una única responsabilitat principal per tasca;
* canvis petits i localitzats;
* poc context necessari;
* evitar refactors innecessaris.

### Tests i prevenció de regressions

Ha de definir que:

* cada funcionalitat nova ha de tenir proves;
* els tests existents s’han de conservar;
* tots els tests previs formen part de la suite de regressió;
* una regressió impedeix completar una tasca.

### Validació web

Hi ha disponible l’**MCP Playwright**.

S’ha de fer servir per validar les funcionalitats web simulant accions reals d’usuari i comprovant també possibles errors del navegador.

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

En generar els prompts, defineix explícitament els endpoints REST necessaris perquè posteriorment es puguin convertir fàcilment en tasques atòmiques i tests.

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

`prompt-deures-tasques.md` ha de generar tota la planificació en:

```text
tasks/tasks-deures.md
```

No ha d’implementar encara funcionalitats.

Divideix el projecte en **tasques petites i atòmiques**, ordenades segons prioritat i dependències.

Cada tasca ha d’indicar com a mínim:

* identificador;
* estat;
* prioritat;
* objectiu;
* dependències;
* criteris d’acceptació;
* tests necessaris.

Utilitza aquests estats:

* `pendent`;
* `implementant`;
* `revisant`;
* `completada`.

Les tasques han de cobrir progressivament:

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

Agrupa les tasques per fases.

Una fase només es considera completada quan:

* totes les tasques estan `completada`;
* passen els tests específics;
* passen tots els tests de regressió acumulats;
* les funcionalitats web afectades passen la validació amb Playwright.

No s’ha d’avançar de fase mentre existeixin errors.

---

# 11. PLAN.md

`PLAN.md` ha de descriure la metodologia general d’implementació.

Les tasques de `tasks/tasks-deures.md` s’han d’executar segons:

1. prioritat;
2. dependències.

Per cada tasca:

1. seleccionar la següent tasca executable;
2. marcar-la `implementant`;
3. delegar-ne la implementació;
4. executar els tests específics;
5. executar els tests de regressió;
6. marcar-la `revisant`;
7. fer-la revisar per un agent diferent de l’implementador;
8. corregir qualsevol problema;
9. repetir els tests;
10. marcar-la `completada` només si totes les validacions passen.

L’estat de `tasks/tasks-deures.md` s’ha d’actualitzar durant tota la implementació.

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
* una regressió impedeix completar una tasca.

No eliminis ni relaxis tests previs simplement perquè una nova implementació falli.

---

# 13. Prompt d’implementació

`prompt-deures-implementa.md` ha d’executar un bucle agèntic simple fins completar `tasks/tasks-deures.md`.

Per cada iteració:

1. llegir `tasks/tasks-deures.md`;
2. seleccionar la tasca pendent executable de més prioritat;
3. comprovar les dependències;
4. marcar-la `implementant`;
5. delegar la implementació a un subagent;
6. limitar els canvis a la tasca actual;
7. crear o actualitzar els tests;
8. executar els tests específics;
9. executar tota la regressió;
10. marcar-la `revisant`;
11. delegar la revisió a un agent diferent;
12. validar els criteris d’acceptació;
13. si afecta la UI, validar-la amb Playwright;
14. corregir qualsevol error;
15. tornar a executar les proves;
16. marcar-la `completada` només quan tot sigui correcte;
17. continuar amb la següent tasca.

No implementis funcionalitats de tasques futures.

No facis refactors generals sense necessitat.

Treballa en **una única tasca principal cada vegada**.

---

# 14. Commits de fita

Quan es completi una fase i tots els seus tests passin, fes un **commit de fita** mitjançant l’MCP de GitHub.

No facis commits per cada tasca.

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

# Criteris generals

Els tres prompts han d’estar especialment optimitzats per treballar amb **models petits, poc context i capacitat de raonament limitada**.

Prioritza:

* instruccions simples;
* tasques atòmiques;
* poca informació necessària per cada execució;
* una sola tasca activa;
* canvis petits;
* responsabilitats separades entre agents;
* arquitectura simple;
* tests freqüents;
* regressions acumulatives;
* validació abans d’avançar.

Evita:

* tasques grans;
* context innecessari;
* refactors no relacionats;
* dependències innecessàries;
* prompts excessivament llargs dins de l’arnès generat;
* duplicació d’instruccions.

---

# Arxius que necessito

No implementis el servidor.

Genera exclusivament:

1. `prompts/prompt-deures-arnes.md`

   * skills;
   * `PLAN.md`;
   * agents i subagents;
   * `AGENTS.md`.

2. `prompts/prompt-deures-tasques.md`

   * ha de generar `tasks/tasks-deures.md`;
   * descomposició atòmica;
   * prioritats i dependències;
   * criteris d’acceptació;
   * tests i regressions.

3. `prompts/prompt-deures-implementa.md`

   * implementació a partir de `tasks/tasks-deures.md`;
   * agents i subagents;
   * tests específics;
   * regressions;
   * validació Playwright;
   * revisió independent;
   * commits de fita.

El resultat final d’aquesta execució han de ser exclusivament aquests tres prompts.
