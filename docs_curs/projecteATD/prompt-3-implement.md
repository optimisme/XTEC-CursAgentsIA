# Prompt 3 — Executar el bucle agèntic d’implementació

Implementa el projecte seguint estrictament les tasques definides a:

```text
tasks/tasks.md
```

Treballa de manera autònoma fins que totes les tasques implementables estiguin `[done]` o existeixi un bloqueig real que no puguis resoldre amb la informació i les eines disponibles.

Aquest projecte s’executa amb un model petit i poc context. Mantén cada iteració limitada a una sola tasca atòmica.

## 1. Context inicial

Abans de modificar res:

1. llegeix `AGENTS.md`;
2. llegeix `tasks/tasks.md`;
3. identifica la primera tasca `[pending]` que tingui totes les dependències `[done]`;
4. llegeix només la part de `PLAN.md` necessària per aquella tasca;
5. carrega només els skills necessaris per aquella tasca;
6. inspecciona només els fitxers relacionats amb l’abast de la tasca.

No carreguis tot el projecte ni tots els skills si no és necessari.

## 2. Git i GitHub

El repositori utilitza Git durant tot el desenvolupament.

També hi ha disponible l’MCP de GitHub.

L’MCP de GitHub obté l’autenticació mitjançant la variable d’entorn:

```text
GITHUB_PERSONAL_ACCESS_TOKEN
```

Aquesta variable també pot estar definida a:

```text
server/settings.env
```

Regles:

- no mostris mai el valor de `GITHUB_PERSONAL_ACCESS_TOKEN`;
- no copiïs el token a cap arxiu versionat;
- no incloguis `server/settings.env` en cap commit;
- no imprimeixis secrets als logs;
- no modifiquis ni regeneris el token;
- utilitza el GitHub MCP quan sigui útil per consultar informació del repositori remot;
- utilitza Git per `status`, `diff`, `add`, `commit` i `push`;
- no creïs Issues, Pull Requests ni GitHub Projects tret que una tasca ho demani explícitament;
- no facis `force push`;
- no reescriguis l’historial existent;
- no facis `git reset --hard`, `git rebase` o `git commit --amend` tret que sigui imprescindible i estigui explícitament autoritzat.

Abans de començar la primera tasca, comprova:

```bash
git status
```

Si hi ha canvis previs no relacionats amb el treball actual:

- no els eliminis;
- no els sobreescriguis;
- no els incloguis accidentalment als commits;
- conserva’ls intactes.

## 3. Bucle obligatori

Repeteix aquest procés per cada tasca.

### A. Seleccionar la tasca

Escull la primera tasca `[pending]` executable segons l’ordre de `tasks/tasks.md`.

Una tasca és executable quan totes les seves dependències estan `[done]`.

No saltis una tasca executable per començar-ne una de posterior.

### B. Marcar l’inici

Canvia només l’estat de la tasca:

```text
[pending] -> [in-progress]
```

Només pot existir una tasca `[in-progress]`.

No facis encara cap commit només per aquest canvi d’estat.

### C. Preparar el context mínim

Per a la tasca actual:

1. llegeix el seu objectiu;
2. llegeix les dependències;
3. llegeix els criteris de finalització;
4. llegeix els tests de validació;
5. llegeix els tests de regressió;
6. consulta només les seccions necessàries de `PLAN.md`;
7. carrega només els skills relacionats;
8. inspecciona només els fitxers afectats.

No ampliïs el context sense necessitat.

### D. Implementar

Implementa exclusivament l’abast de la tasca.

Regles:

- evita refactors aliens a la tasca;
- evita dependències noves innecessàries;
- mantén Node.js + Express + SQLite;
- mantén el frontend estàtic a `server/public/`;
- mantén la lògica d’autorització al servidor;
- no donis per segura cap validació feta només al client;
- conserva compatibilitat amb les funcionalitats ja completades;
- escriu codi senzill, explícit i modular;
- no implementis funcionalitats corresponents a tasques posteriors si no són imprescindibles per completar la tasca actual.

### E. Crear o actualitzar tests

Implementa els tests indicats a:

```text
**Tests de validació**
```

de la tasca actual.

Si la tasca arregla un bug:

1. crea primer, sempre que sigui viable, un test que reprodueixi el problema;
2. comprova que el test falla abans de la correcció;
3. implementa la correcció;
4. comprova que el test passa després.

No eliminis tests existents només per aconseguir que la suite passi.

No relaxis assertions correctes per adaptar-les a una implementació defectuosa.

### F. Executar els tests de validació

Executa els tests específics definits per la tasca.

La tasca no pot continuar cap al tancament mentre algun test de validació falli.

Si la tasca afecta una interfície o un flux web, utilitza també l’MCP Playwright.

Amb Playwright:

- inicia el servidor de test de manera controlada;
- utilitza dades de test;
- comprova comportament observable, no només que la pàgina carregui;
- valida navegació;
- valida contingut visible;
- valida permisos;
- valida els canvis persistits quan correspongui;
- comprova els casos d’error rellevants;
- tanca i neteja els recursos de test.

### G. Executar regressions

Executa tots els tests indicats a:

```text
**Tests de regressió**
```

A més, si has modificat una peça compartida, executa també les suites ja existents directament afectades encara que no apareguin explícitament a la tasca.

Els tests són acumulatius.

Una funcionalitat que ja estava `[done]` no es pot trencar per completar una tasca nova.

### H. Corregir errors

Si falla qualsevol test:

1. no canviïs de tasca;
2. no facis commit;
3. no facis push;
4. identifica la causa;
5. corregeix la implementació;
6. torna a executar el test que ha fallat;
7. torna a executar les regressions aplicables.

Un error provocat pel teu propi codi no és un bloqueig.

No continuïs fins que els tests requerits passin.

### I. Verificar els criteris de finalització

Quan els tests passin, revisa un per un els:

```text
**Criteris de finalització**
```

de la tasca.

Comprova que tots es compleixen realment.

No modifiquis els criteris de la tasca per adaptar-los a la implementació.

### J. Marcar la tasca com a completada

Només quan:

- la implementació està acabada;
- els criteris de finalització es compleixen;
- els tests de validació passen;
- els tests de regressió passen;

canvia:

```text
[in-progress] -> [done]
```

Aquest canvi de `tasks/tasks.md` ha de formar part del mateix commit que la implementació i els tests de la tasca.

### K. Revisar els canvis abans del commit

Executa:

```bash
git status
git diff
```

Revisa que els canvis del commit siguin coherents amb la tasca actual.

No incloguis accidentalment:

- `server/settings.env`;
- `.env`;
- secrets;
- `GITHUB_PERSONAL_ACCESS_TOKEN`;
- bases de dades de desenvolupament o test que no s’hagin de versionar;
- directoris temporals;
- repositoris clonats pel valorador;
- logs;
- artefactes generats;
- canvis previs de l’usuari no relacionats amb la tasca.

Si cal, afegeix patrons adequats a `.gitignore` com a part de la tasca corresponent.

### L. Crear el commit

Cada tasca `[done]` ha de correspondre a un commit propi.

Inclou:

- implementació;
- tests nous o modificats;
- canvis estrictament necessaris;
- canvi d’estat a `[done]` dins `tasks/tasks.md`.

No agrupis diverses tasques en un sol commit.

Fes staging només dels fitxers corresponents a la tasca.

Utilitza un missatge de commit curt amb l’identificador de la tasca.

Format recomanat:

```text
T012: implement student submission deletion
```

No facis commit si algun test requerit falla.

### M. Fer push

Després d’un commit correcte:

1. identifica la branca actual;
2. fes `git push` al remot corresponent;
3. si la branca encara no té upstream, configura’l amb un push normal;
4. no utilitzis `--force` ni `--force-with-lease`.

El cicle de la tasca només es considera complet quan:

```text
implementació
→ tests de validació
→ tests de regressió
→ [done]
→ commit
→ push
```

han acabat correctament.

Si el `push` falla per un problema temporal o de configuració:

- intenta diagnosticar-lo;
- no desfacis el commit correcte;
- no modifiquis historial;
- si no es pot resoldre amb les eines disponibles, registra el problema de manera clara abans de continuar.

### N. Continuar

Després del push correcte:

1. torna a llegir els estats de `tasks/tasks.md`;
2. identifica la següent tasca `[pending]` executable;
3. repeteix el bucle.

## 4. Gestió de bloquejos

Marca una tasca `[blocked]` només si existeix un impediment real que no pots resoldre amb el repositori, la documentació o les eines disponibles.

Exemples:

- falta una dependència externa imprescindible;
- una eina requerida no està disponible;
- falta una credencial imprescindible que no es pot substituir per mocks en aquella tasca;
- existeix una contradicció impossible de resoldre entre requisits;
- una API externa necessària no està disponible.

Abans de bloquejar:

1. revisa l’error;
2. consulta `PLAN.md`;
3. consulta el skill corresponent;
4. inspecciona la configuració disponible;
5. si afecta OpenCode, comprova la CLI real instal·lada;
6. si afecta GitHub, comprova l’estat del repositori, remot i autenticació sense mostrar cap token.

Si la tasca queda bloquejada, canvia:

```text
[in-progress] -> [blocked]
```

i afegeix:

```markdown
**Motiu del bloqueig**
- <causa concreta i verificable>
```

Si és útil, afegeix també:

```markdown
**Per desbloquejar**
- <acció concreta necessària>
```

No marquis una tasca `[blocked]` simplement perquè els tests fallen.

## 5. Regles específiques del valorador OpenCode

Quan arribis a les tasques del valorador:

- mantén la integració encapsulada respecte de les rutes HTTP;
- comprova la sintaxi real de l’OpenCode instal·lat abans de codificar la invocació;
- utilitza `opencode --help` o documentació local/actual disponible;
- no inventis flags;
- executa processos amb arguments separats;
- prefereix `child_process.spawn` o una API equivalent;
- no construeixis ordres de shell concatenant dades de l’usuari;
- valida la URL de GitHub abans d’utilitzar-la;
- utilitza un directori temporal únic per cada valoració;
- no reutilitzis directoris temporals entre entregues;
- elimina sempre el directori temporal amb `finally`;
- aplica un timeout al procés;
- captura codis de sortida i errors;
- valida estrictament la sortida de l’agent abans d’escriure-la a SQLite;
- fes que els tests puguin substituir l’execució real d’OpenCode per un mock/fake determinista.

El flux és:

```text
entrega creada
→ valuation pending
→ directori temporal
→ OpenCode
→ clonació del repositori
→ inspecció
→ aplicació dels criteris
→ resposta estructurada
→ validació
→ persistència
→ cleanup
```

El contracte mínim de resultat del valorador és:

```json
{
  "accepted": true,
  "summary": "..."
}
```

La resposta pot contenir altres camps si `PLAN.md` ho defineix, però `accepted` i `summary` són obligatoris.

No confiïs en text lliure sense validació.

Gestiona almenys:

- valoració pendent;
- valoració completada;
- valoració fallida;
- timeout;
- resposta invàlida;
- error de clonació;
- error del procés OpenCode.

Cap d’aquests errors ha de deixar fitxers temporals abandonats.

## 6. Regles específiques d’autenticació i dades

Mantén aquests requisits durant totes les tasques:

- administrador únic `admin`;
- contrasenya de l’admin carregada des de `server/settings.env`;
- alumnes autenticats per correu electrònic + contrasenya;
- contrasenyes d’alumnes emmagatzemades com MD5 per requisit del projecte;
- cap contrasenya d’alumne en text pla a SQLite;
- cap contrasenya o hash mostrat a la interfície;
- l’alumne només pot accedir a les seves pròpies entregues;
- les operacions administratives requereixen rol admin;
- una entrega revisada no es pot esborrar per l’alumne;
- aquesta restricció s’aplica obligatòriament al servidor;
- les dues vistes administratives d’entregues consulten la mateixa entitat de dades;
- no dupliquis entregues per implementar les dues vistes.

## 7. `settings.env` i secrets

`server/settings.env` conté configuració sensible.

Pot incloure, entre altres variables:

```text
GITHUB_PERSONAL_ACCESS_TOKEN
```

i la contrasenya de l’administrador.

Regles obligatòries:

- `server/settings.env` no s’ha de versionar;
- comprova que estigui ignorat per Git;
- no llegeixis ni imprimeixis secrets si no és imprescindible;
- no copiïs secrets a tests;
- no copiïs secrets a fixtures;
- no copiïs secrets a documentació;
- no copiïs secrets a `tasks/tasks.md`;
- no copiïs secrets a `PLAN.md`;
- no copiïs secrets als commits;
- no copiïs secrets als missatges de commit;
- no copiïs secrets als prompts del valorador;
- utilitza variables d’entorn durant l’execució.

Si els tests necessiten configuració, utilitza valors ficticis específics de test.

## 8. Política de regressions

Els tests són acumulatius.

Quan una funcionalitat queda `[done]`, els seus tests formen part de la protecció de regressions del projecte.

Conserva i reutilitza especialment els fluxos Playwright ja creats per comprovar:

- login admin;
- logout admin;
- creació d’alumnes;
- gestió d’alumnes;
- creació de pràctiques;
- gestió de pràctiques;
- login alumne;
- logout alumne;
- enviament d’entregues;
- consulta d’entregues;
- permisos;
- esborrat d’una entrega no revisada;
- prohibició d’esborrar una entrega revisada;
- revisió per part del professor;
- entregues filtrades per alumne;
- entregues filtrades per pràctica;
- protecció de rutes.

Si un canvi nou trenca una funcionalitat anterior:

1. no facis commit;
2. corregeix la regressió;
3. torna a executar els tests;
4. continua només quan tot torni a passar.

## 9. Disciplina de context

Per reduir l’ús de context:

- processa una sola tasca cada vegada;
- no rellegeixis fitxers grans sense necessitat;
- utilitza cerques dirigides per localitzar símbols, rutes i tests;
- llegeix fragments concrets dels fitxers quan sigui possible;
- evita copiar grans fragments de `PLAN.md` al codi;
- evita explicacions llargues durant el bucle;
- delega a subagents només quan realment aportin valor;
- dona als subagents una única responsabilitat petita i autocontinguda;
- no demanis a un subagent que revisi tot el projecte si només cal revisar una tasca;
- no carreguis tots els skills per defecte.

## 10. Ús dels subagents

Si utilitzes els agents definits a `.opencode/agents/`, mantén la separació de responsabilitats.

### Agent principal

Pot:

- seleccionar la tasca;
- implementar;
- coordinar;
- executar tests;
- actualitzar `tasks/tasks.md`;
- fer commit;
- fer push.

### Subagent de revisió

Pot:

- revisar el diff de la tasca;
- detectar errors;
- detectar desviacions de l’abast;
- comprovar criteris de finalització.

No ha de modificar codi si la seva configuració el defineix com a només lectura.

### Subagent de validació

Pot:

- executar tests;
- inspeccionar errors;
- utilitzar Playwright;
- comprovar regressions.

No deleguis una tasca sencera a diversos agents simultàniament si això complica la coordinació.

## 11. Revisions abans de cada commit

Abans de cada commit comprova:

### Abast

- els canvis corresponen a una única tasca;
- no hi ha funcionalitats anticipades;
- no hi ha refactors innecessaris.

### Tests

- tests de validació correctes;
- regressions correctes;
- Playwright executat quan correspon.

### Seguretat

- cap secret al diff;
- cap `settings.env`;
- cap token;
- cap contrasenya;
- cap directori temporal.

### Estat

- la tasca actual està `[done]`;
- no hi ha cap altra tasca `[in-progress]`;
- les dependències continuen coherents.

Només després crea el commit i fes push.

## 12. Criteri de finalització global

Quan no quedin tasques `[pending]` ni `[in-progress]`:

1. comprova si queda alguna tasca `[blocked]`;
2. executa la suite completa de tests del servidor;
3. executa la suite completa d’integració;
4. executa els fluxos Playwright finals definits a `tasks/tasks.md`;
5. comprova que no queden fitxers temporals de valoracions;
6. comprova que `server/settings.env` està ignorat per Git;
7. comprova que no s’han versionat secrets;
8. comprova que no s’han guardat contrasenyes d’alumnes en text pla a SQLite;
9. comprova que les rutes protegides rebutgen accessos no autoritzats;
10. comprova que les vistes d’admin per alumne i per pràctica funcionen;
11. comprova que les entregues revisades no poden ser esborrades pels alumnes;
12. comprova que tots els commits de les tasques `[done]` han estat pujats al remot;
13. executa:

```bash
git status
```

14. deixa el working tree net, excepte canvis previs de l’usuari que ja existissin abans del bucle.

Si aquesta validació final detecta una regressió:

- identifica la tasca responsable;
- corregeix-la;
- executa novament els tests necessaris;
- crea un commit correctiu clar;
- fes push;
- torna a executar la validació final.

## 13. Resposta final

En acabar, respon només amb un resum curt que inclogui:

- nombre de tasques `[done]`;
- tasques `[blocked]`, si n’hi ha;
- estat de la suite de tests;
- estat dels tests Playwright;
- nombre de commits creats durant el bucle;
- confirmació que els commits s’han enviat al remot;
- branca utilitzada.

No facis una explicació extensa de cada canvi si no es demana explícitament.
