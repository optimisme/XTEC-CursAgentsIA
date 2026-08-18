# Prompt 1 — Generar l’arnès i el pla del projecte

Prepara l’arnès d’OpenCode i el pla d’implementació d’aquest projecte. **No implementis encara l’aplicació ni generis `tasks/tasks.md`.**

El projecte es desenvoluparà amb un model petit, amb poc context i capacitat de raonament limitada. Per tant:

- mantén `AGENTS.md`, els agents i els skills curts, explícits i sense redundàncies;
- divideix el coneixement per responsabilitats i fes que els detalls específics quedin als skills;
- evita instruccions implícites;
- evita agents o skills que no aportin una responsabilitat clara;
- no carreguis context innecessari;
- fes que cada fitxer tingui una única funció fàcil d’entendre.

## 1. Estructura de l’arnès

Crea com a mínim:

```text
AGENTS.md
PLAN.md
.opencode/
  agents/
  skills/
```

Fes servir les convencions actuals d’OpenCode.

### Skills

Cada skill ha d’estar a:

```text
.opencode/skills/<skill-name>/SKILL.md
```

Cada `SKILL.md` ha de començar amb YAML frontmatter vàlid i incloure com a mínim:

```yaml
---
name: <skill-name>
description: <descripció curta i específica>
---
```

El `name` ha de coincidir amb el nom de la carpeta.

Crea només els skills necessaris per cobrir, de manera separada i concisa:

1. arquitectura Node.js/Express/SQLite del projecte;
2. persistència, autenticació i seguretat bàsica;
3. interfície web estàtica i fluxos admin/alumne;
4. testing del servidor i testing web amb Playwright;
5. integració del valorador basat en OpenCode.

### Agents

Els agents locals han d’estar a:

```text
.opencode/agents/<agent-name>.md
```

Cada agent ha de tenir YAML frontmatter vàlid amb `description` i `mode`.

Exemple de camps obligatoris:

```yaml
---
description: <responsabilitat de l’agent>
mode: primary
---
```

o:

```yaml
---
description: <responsabilitat de l’agent>
mode: subagent
---
```

Mantén un conjunt mínim d’agents. Com a orientació:

- un agent principal de desenvolupament, `mode: primary`;
- un subagent de revisió, `mode: subagent`;
- un subagent de validació/tests, `mode: subagent`.

No creïs agents redundants.

Configura permisos coherents amb la responsabilitat de cada agent: els agents de revisió no han de modificar codi si no és necessari.

## 2. AGENTS.md

Crea un `AGENTS.md` curt al directori arrel.

Ha de definir només les regles globals imprescindibles:

- seguir `PLAN.md`;
- quan existeixi, seguir `tasks/tasks.md`;
- treballar una sola tasca atòmica cada vegada;
- no ampliar l’abast de la tasca actual;
- llegir només els skills necessaris;
- executar els tests associats a la tasca;
- executar també els tests de regressió aplicables;
- no marcar una tasca com a completada si algun test falla;
- mantenir compatibilitat amb Node.js/Express/SQLite;
- no afegir frameworks frontend;
- no introduir dependències si una solució simple amb les dependències existents és suficient.

No copiïs a `AGENTS.md` tota l’especificació funcional: aquesta informació ha d’estar a `PLAN.md` i als skills.

## 3. PLAN.md

Genera un `PLAN.md` prou detallat perquè un altre agent petit pugui convertir-lo després en tasques atòmiques, però sense implementar codi.

### Arquitectura obligatòria

L’aplicació ha de viure principalment sota:

```text
server/
  public/
  settings.env
```

Tecnologies:

- Node.js;
- Express;
- SQLite;
- HTML, CSS i JavaScript estàtic dins `server/public/`;
- sense framework frontend.

El pla ha de proposar una estructura interna simple i modular per al servidor, separant com a mínim:

- arrencada/configuració;
- base de dades;
- autenticació;
- rutes admin;
- rutes alumne;
- entregues;
- integració amb el valorador OpenCode;
- tests.

No sobrearquitecturis.

## 4. Requisits funcionals

### Autenticació

Hi ha dos tipus d’accés.

#### Administrador

- només existeix un usuari administrador;
- el seu nom d’usuari és `admin`;
- la seva contrasenya es defineix a `server/settings.env`;
- no cal guardar l’administrador a SQLite.

#### Alumne

Cada alumne té:

- nom;
- correu electrònic únic;
- contrasenya.

L’alumne inicia sessió amb correu electrònic i contrasenya.

Per requisit del projecte, la contrasenya de l’alumne s’ha de guardar a SQLite com a hash MD5 i mai en text pla. Encapsula el càlcul i comparació del hash en una funció/mòdul específic per poder substituir l’algoritme en el futur sense afectar la resta de l’aplicació.

No mostris mai hashes ni contrasenyes a la interfície.

### Administració d’alumnes

L’administrador té un apartat `Alumnes` on pot:

- llistar alumnes;
- crear alumnes;
- editar les dades necessàries;
- accedir a les entregues d’un alumne concret.

### Administració de pràctiques

L’administrador té un apartat `Pràctiques`.

Cada pràctica té:

- títol;
- criteris d’acceptació;
- URL de GitHub.

L’administrador pot:

- crear i gestionar pràctiques;
- veure les entregues rebudes per una pràctica concreta.

### Entregues

Una entrega relaciona:

- un alumne;
- una pràctica;
- la URL de GitHub entregada per l’alumne;
- el resultat de la valoració automàtica;
- si ha estat acceptada o no;
- si ha estat revisada pel professor;
- dates necessàries per ordenar i auditar el procés.

L’administrador pot marcar una entrega com a revisada.

Hi ha dues vistes administratives diferents sobre les mateixes entregues:

1. entregues d’un alumne determinat;
2. entregues d’una pràctica determinada.

No dupliquis les dades: són dues consultes/vistes sobre la mateixa entitat.

### Espai de l’alumne

L’alumne autenticat només pot veure i modificar les seves pròpies dades d’entrega.

#### `Entregues`

Mostra les seves entregues i, per cadascuna:

- pràctica;
- URL entregada;
- si ha estat acceptada;
- si ha estat revisada pel professor;
- resultat/resum de la valoració quan correspongui.

L’alumne pot esborrar una entrega **només mentre no estigui revisada**.

Aquesta restricció s’ha de validar al servidor, no només a la interfície.

#### `Enviar`

Permet:

- seleccionar una pràctica existent;
- introduir/enganxar una URL de GitHub;
- crear una nova entrega.

Valida al servidor les dades rebudes.

## 5. Valorador OpenCode

El servidor ha d’incloure una integració amb un agent OpenCode específic per valorar entregues.

Dissenya aquesta integració perquè estigui encapsulada i no barrejada amb les rutes HTTP.

El valorador rep explícitament:

1. instruccions fixes de valoració;
2. els criteris d’acceptació definits pel professor;
3. la URL de GitHub entregada per l’alumne.

Flux obligatori:

1. l’entrega queda registrada amb estat de valoració pendent;
2. es crea un directori temporal únic;
3. OpenCode s’executa amb un arnès específic de valoració;
4. l’agent descarrega/clona el repositori GitHub dins el directori temporal;
5. inspecciona el projecte;
6. aplica els criteris d’acceptació;
7. retorna una resposta estructurada i fàcil de validar, amb com a mínim:
   - `accepted`: booleà;
   - `summary`: text breu;
8. el servidor valida i desa el resultat a SQLite;
9. els fitxers temporals s’eliminen sempre, també si hi ha error;
10. els errors deixen un estat de valoració explícit i no corrompen l’entrega.

La invocació d’OpenCode s’ha de fer des de Node.js sense construir ordres insegures amb concatenació de shell. Prefereix `child_process.spawn` o equivalent amb arguments separats.

Abans d’implementar la integració, l’agent de desenvolupament haurà de comprovar la sintaxi real de la versió instal·lada d’OpenCode (`opencode --help` o documentació disponible) i no inventar flags.

El pla ha d’indicar on viuran:

- les instruccions de l’agent valorador;
- l’adaptador Node.js que invoca OpenCode;
- la validació de la resposta;
- la gestió del directori temporal;
- els tests del valorador.

## 6. Base de dades

Defineix al `PLAN.md` un esquema SQLite mínim i normalitzat per:

- alumnes;
- pràctiques;
- entregues.

Inclou claus primàries, claus foranes, unicitat del correu electrònic i els camps necessaris per a la valoració i la revisió.

No generis encara migracions ni SQL definitiu si no és necessari: descriu l’esquema de manera inequívoca.

## 7. Sessions i autorització

El pla ha de definir una solució simple per:

- iniciar i tancar sessió;
- distingir administrador i alumne;
- protegir rutes;
- impedir que un alumne accedeixi a entregues d’un altre alumne;
- impedir operacions d’administració a alumnes.

Les comprovacions d’autorització han d’existir al servidor.

## 8. Tests

El `PLAN.md` ha d’incloure una estratègia de tests obligatòria.

Com a mínim:

- tests de lògica i persistència;
- tests de rutes HTTP;
- tests d’autenticació i autorització;
- tests de les restriccions d’esborrat/revisió;
- tests de la integració del valorador amb OpenCode substituïble per mock/fake;
- tests web amb Playwright per als fluxos crítics.

Fluxos Playwright mínims:

- login admin;
- crear alumne;
- crear pràctica;
- login alumne;
- crear entrega;
- consultar l’entrega;
- impedir esborrar una entrega revisada;
- navegació admin per entregues d’un alumne;
- navegació admin per entregues d’una pràctica;
- marcar una entrega com a revisada.

Els tests creats en una fase anterior s’han de conservar i executar com a regressió quan una nova tasca pugui afectar aquella funcionalitat.

## 9. Resultat d’aquest prompt

En acabar:

- han d’existir `AGENTS.md` i `PLAN.md`;
- han d’existir els skills necessaris amb frontmatter correcte;
- han d’existir els agents mínims necessaris amb `mode: primary` o `mode: subagent`;
- no ha d’existir implementació funcional de l’aplicació;
- no s’ha de crear encara `tasks/tasks.md`;
- revisa que no hi hagi contradiccions entre `AGENTS.md`, `PLAN.md`, agents i skills;
- mostra un resum final molt curt dels fitxers creats.
