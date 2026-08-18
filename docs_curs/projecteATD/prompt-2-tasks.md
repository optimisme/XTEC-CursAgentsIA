# Prompt 2 — Generar `tasks/tasks.md` amb descomposició atòmica

Llegeix abans de començar:

- `AGENTS.md`;
- `PLAN.md`;
- els skills d’OpenCode estrictament necessaris.

**No implementis l’aplicació.** La teva única responsabilitat és crear o regenerar:

```text
tasks/tasks.md
```

a partir de `PLAN.md`.

El projecte serà implementat després per un model petit, amb poc context i capacitat de raonament limitada. Per tant, les tasques han de ser molt explícites, petites, ordenades i verificables.

## 1. Principis de descomposició

Descompon el projecte en tasques atòmiques.

Cada tasca ha de:

- tenir un únic objectiu principal;
- modificar un conjunt petit i coherent de fitxers;
- poder completar-se sense haver d’interpretar requisits implícits;
- indicar les dependències si en té;
- incloure criteris de finalització observables;
- indicar els tests exactes que s’han d’executar;
- incloure els tests nous necessaris per validar la funcionalitat creada;
- incloure els tests de regressió que cal tornar a executar;
- ser prou petita perquè un agent la pugui completar en una sessió curta.

No agrupis funcionalitats independents en una sola tasca.

No separis artificialment una implementació dels seus tests: una tasca funcional no es pot considerar completada fins que els tests que la validen existeixen i passen.

## 2. Format obligatori de seguiment

Utilitza només aquests estats:

```text
[pending]
[in-progress]
[done]
[blocked]
```

Cada tasca ha de tenir un identificador estable i estar en ordre d’execució:

```markdown
## [pending] T001 — Títol curt

**Objectiu**
...

**Depèn de**
- cap

**Abast**
- ...

**Criteris de finalització**
- ...

**Tests de validació**
- ...

**Tests de regressió**
- ...
```

Regles:

- els IDs no es renumeren una vegada creats;
- l’ordre del fitxer defineix l’ordre recomanat d’implementació;
- només hi pot haver una tasca `[in-progress]`;
- una tasca només passa a `[done]` després que implementació i tests passin;
- si no es pot continuar, passa a `[blocked]` i s’hi afegeix una línia `**Motiu del bloqueig**`;
- no utilitzis checkboxes Markdown addicionals que puguin confondre l’estat principal.

Al principi de `tasks/tasks.md`, afegeix una secció curta explicant aquestes regles.

## 3. Estratègia de dependències

Ordena les tasques de manera que cada nova tasca parteixi d’una base funcional i testejada.

La seqüència ha de cobrir, aproximadament:

1. esquelet del servidor i eines de test;
2. configuració i càrrega de `settings.env`;
3. SQLite i esquema;
4. autenticació/session management;
5. autorització per rols;
6. administració d’alumnes;
7. administració de pràctiques;
8. model i consultes d’entregues;
9. flux d’entrega de l’alumne;
10. consulta i esborrat condicionat d’entregues;
11. vistes administratives d’entregues per alumne;
12. vistes administratives d’entregues per pràctica;
13. marcar entregues com a revisades;
14. arnès específic del valorador OpenCode;
15. adaptador Node.js → OpenCode;
16. directori temporal, clonació, resposta estructurada i cleanup;
17. persistència del resultat de la valoració;
18. gestió d’errors del valorador;
19. tests d’integració;
20. fluxos E2E amb Playwright;
21. revisió final de regressions i neteja.

Aquesta llista és orientativa: crea tantes tasques atòmiques com siguin necessàries.

## 4. Requisits que no es poden perdre durant la descomposició

Comprova explícitament que existeixin tasques que cobreixin tots aquests requisits:

### Administrador

- usuari únic `admin`;
- contrasenya des de `server/settings.env`;
- login/logout;
- apartat `Alumnes`;
- crear i gestionar alumnes;
- veure entregues d’un alumne;
- apartat `Pràctiques`;
- crear i gestionar pràctiques;
- veure entregues d’una pràctica;
- marcar entregues com a revisades.

### Alumne

- login per correu electrònic + contrasenya;
- hash MD5 a SQLite, mai contrasenya en text pla;
- apartat `Entregues`;
- veure acceptació i revisió;
- eliminar només entregues no revisades;
- apartat `Enviar`;
- seleccionar pràctica;
- introduir URL de GitHub;
- crear entrega.

### Pràctiques

- títol;
- criteris d’acceptació;
- URL de GitHub.

### Entregues

- alumne;
- pràctica;
- URL entregada;
- estat/resultat de valoració;
- acceptada o no;
- revisada o no;
- timestamps necessaris.

### Valorador OpenCode

Ha de tenir tasques separades i ordenades per construir i validar:

- instruccions/arnès del valorador;
- contracte de sortida estructurada;
- adaptador Node.js que executa OpenCode;
- verificació de la sintaxi real del CLI instal·lat abans de fixar la comanda;
- ús segur de `child_process.spawn` o equivalent;
- directori temporal únic;
- clonació del repositori;
- inspecció segons criteris d’acceptació;
- retorn `accepted` + `summary`;
- validació de la resposta;
- actualització SQLite;
- cleanup en `finally`;
- timeout/error handling;
- mock/fake del procés OpenCode per poder testejar sense dependre de l’agent real.

### Pàgina principal

La pàgina principal ha de mostrar el formulari de login que automàticament anirà a la pàgina d'alumne o professor un cop identificat. L'admin entra amb la paraula "admin" enlloc de amb un correu electrònic.

# Pàgines i endpoints

En generar els tres prompts, defineix també les **pàgines de la interfície i els endpoints HTTP necessaris per implementar-les**, mantenint una correspondència clara entre frontend i API.

Tingues en compte com a mínim aquestes pàgines:

- `/` — login comú per a administrador i alumnes;
- `/admin` — espai principal de l'administrador;
- `/admin/alumnes` — gestió d'alumnes;
- `/admin/practiques` — gestió de pràctiques;
- `/admin/entregues` — consulta i revisió d'entregues;
- `/alumne` — espai principal de l'alumne;
- `/alumne/entregues` — consulta de les seves entregues;
- `/alumne/enviar` — formulari per fer una nova entrega.

Defineix els endpoints REST necessaris per donar suport a aquestes pàgines, incloent com a mínim:

- autenticació, sessió i logout;
- CRUD d'alumnes;
- CRUD de pràctiques;
- consulta d'entregues per alumne;
- consulta d'entregues per pràctica;
- creació i eliminació d'entregues de l'alumne;
- marcatge d'una entrega com a revisada;
- consulta de l'estat i resultat de la valoració automàtica.

Els endpoints han de tenir una estructura coherent, per exemple sota `/api/...`, i s'han de definir explícitament als prompts generats perquè posteriorment es puguin convertir en tasques atòmiques i tests.

## 5. Testing obligatori per tasca

Cada tasca funcional ha d’especificar:

### Tests de validació

Els tests nous o específics que demostren que la tasca està correctament implementada.

### Tests de regressió

Els tests ja existents que s’han de tornar a executar perquè la nova modificació podria afectar-los.

No posis simplement “executar tests”. Indica quin tipus o suite s’ha d’executar.

Quan una tasca modifica UI o un flux visible al navegador, inclou validació amb l’MCP Playwright.

Els tests Playwright han de ser acumulatius: quan ja existeix un flux crític automatitzat, reutilitza’l com a regressió en tasques posteriors relacionades.

## 6. Tasques E2E mínimes amb Playwright

Assegura’t que al final existeixi cobertura E2E, com a mínim, per:

- login admin;
- crear alumne;
- crear pràctica;
- login alumne;
- enviar una entrega;
- veure el resultat/estat de l’entrega;
- esborrar una entrega no revisada;
- verificar que una entrega revisada no es pot esborrar;
- admin → alumne → entregues;
- admin → pràctica → entregues;
- marcar una entrega com a revisada;
- logout i protecció de rutes.

## 7. Mida de les tasques

Si una tasca requereix diversos canvis conceptuals independents, divideix-la.

Senyals que una tasca és massa gran:

- toca alhora DB, autenticació, UI i valorador;
- té més d’un flux d’usuari independent;
- els criteris de finalització contenen diversos comportaments no relacionats;
- requereix molts tests diferents que no comparteixen el mateix objectiu.

Prefereix més tasques petites a poques tasques grans.

## 8. Validació final de `tasks/tasks.md`

Abans d’acabar:

1. comprova que cada requisit de `PLAN.md` apareix en almenys una tasca;
2. comprova que no hi ha funcionalitats inventades;
3. comprova que les dependències no formen cicles;
4. comprova que l’ordre permet implementar de principi a fi;
5. comprova que totes les tasques funcionals tenen validació;
6. comprova que les tasques web indiquen Playwright quan correspon;
7. comprova que els tests previs es reutilitzen com a regressió;
8. comprova que cap tasca exigeix un context excessiu;
9. deixa totes les tasques inicialment en `[pending]`;
10. no implementis cap tasca.

En acabar, mostra únicament un resum molt curt amb el nombre total de tasques creades.
