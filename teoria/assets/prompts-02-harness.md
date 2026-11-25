# Prompts · Sessió 02 · Harness Engineering

Prompts de [02 - Harness Engineering](../02%20-%20Harness%20Engineering.md), en ordre i preparats per copiar i enganxar.

**Com fer-los servir**

- Els blocs `text` van a **OpenCode**, obert dins la carpeta del repositori (`ia-02-harness-sdd` per a l'exemple i la pràctica, `lliuraments` per a la tasca). Els blocs `bash` i `powershell` van al **terminal**.
- Enganxa **un prompt cada vegada**, en ordre, i fes la comprovació abans de passar al següent.
- Els prompts són en català, però demanen en **anglès** el contingut dels fitxers que es creen (agents, comandes, skills, `AGENTS.md`, codi) i els noms de fitxers, funcions i claus JSON. Els noms que ja surten als prompts (`orchestrator`, `docs/tasks.json`, `"pending"`…) no es tradueixen.
- Després de canviar agents, comandes o skills, surt d'OpenCode i torna-hi a entrar perquè els carregui.

---

## Exemple · L'arnès d'exemple en marxa (secció 10)

### `.gitignore`

El mateix de la sessió 01, al repositori nou `ia-02-harness-sdd`.

```text
Crea un .gitignore per a aquest projecte que ignori .secrets/, keys.env, *.env, node_modules/ i .DS_Store. Després fes-ne commit amb el missatge "chore: add .gitignore" i fes push.
```

### `/implement` · El rellotge suís

Primer copia `.agents/` del material del curs i crea l'enllaç `.opencode` (secció 10, pas 2). Surt i torna a entrar a OpenCode.

```text
/implement Crea un fitxer nou anomenat clock.html a la carpeta webs que mostri un rellotge analògic circular, dibuixat en un canvas i actualitzat cada segon. Ha de semblar un rellotge de les estacions de tren suïsses: busca a internet com són. Escriu el codi, els noms i els comentaris en anglès.
```

**Comprova-ho:** el `coordinator` fa un pla i delega als subagents. Obre `webs/clock.html` al navegador.

---

## Pràctica · Arnès SDD mínim (secció 11)

### Pas 0 · Buida l'arnès d'exemple (terminal)

```bash
rm -r .agents/*
```

```powershell
Remove-Item -Recurse .agents\*
```

### Pas 1 · Estructura

```text
Aquest repositori encara no té cap arnès d'OpenCode. Crea un arnès bàsic d'OpenCode amb aquestes carpetes buides, cadascuna amb un fitxer .gitkeep perquè git les conservi:
./.agents/agents
./.agents/commands
./.agents/skills
./.agents/plugins
./docs
./webs
```

**Comprova-ho:** `.opencode` encara apunta a `.agents` (`ls -l` o `Get-Item .opencode`).

### Pas 2 · Agents

```text
Crea tres fitxers d'agent per a aquest projecte de Spec Driven Development: .agents/agents/orchestrator.md, .agents/agents/programmer.md i .agents/agents/reviewer.md.
L'orchestrator ha de llegir docs/tasks.json, trobar la primera tasca pendent, demanar al programmer que la implementi, demanar al reviewer que la verifiqui, i només marcar-la com a feta quan tots els criteris d'acceptació es compleixin.
El programmer ha d'implementar només la tasca actual, fer canvis petits, no fer servir dependències i informar dels fitxers que ha canviat.
El reviewer ha de revisar els fitxers canviats, verificar els criteris d'acceptació, comprovar que el projecte continua funcionant, comprovar l'accessibilitat bàsica i informar de si la tasca es pot marcar com a feta.
Cada fitxer ha de tenir una capçalera d'OpenCode 2 amb description, mode i permissions: l'orchestrator té mode primary; el programmer i el reviewer, mode subagent. permissions és una llista de regles amb action, resource i effect (allow, ask o deny); les accions són read, grep, glob, edit, shell, subagent i skill. No facis servir el format antic (permission, bash, task, tools). Guanya l'última regla que coincideix: posa primer la regla que ho denega tot (action "*", resource "*", effect deny) i després el que cada agent sí que pot fer. Si cal, busca a la documentació d'OpenCode 2.
Escriu en anglès el contingut dels fitxers que creïs. Els noms de fitxers, carpetes, funcions i variables, i les claus JSON, també en anglès.
Encara no implementis l'app web. Crea només el flux d'agents.
```

**Comprova-ho:** les capçaleres fan servir `permissions` (no `permission`); el `reviewer` no té cap regla que li permeti `edit`; l'`orchestrator` és `mode: primary`.

### Pas 3 · Comanda `/next-task`

```text
Crea només aquest fitxer: .agents/commands/next-task.md, amb agent: orchestrator a la capçalera.
Quan s'executa /next-task, l'orchestrator coordina el flux, delega la implementació al programmer i la verificació al reviewer, i és l'únic rol que pot actualitzar docs/tasks.json.
Flux:
- Llegeix docs/tasks.json i troba la primera tasca amb "status": "pending". Si no n'hi ha cap, informa'n i atura't.
- Passa al programmer només el títol i els criteris d'acceptació d'aquesta tasca.
- No et saltis tasques i no implementis més d'una tasca. Fes canvis petits.
- Passa la tasca i els fitxers canviats al reviewer, que verifica cada criteri d'acceptació.
- Si es compleixen tots els criteris, canvia només l'estat d'aquesta tasca a "done". Si no, deixa-la "pending" i informa del que falta.
Escriu en anglès el contingut dels fitxers que creïs. Els noms de fitxers, carpetes, funcions i variables, i les claus JSON, també en anglès.
Ara no implementis cap tasca del projecte.
```

**Comprova-ho:** la capçalera té `description` i `agent: orchestrator`.

### Pas 4 · Skills

Tres prompts, un rere l'altre.

```text
Crea una skill nova d'OpenCode anomenada project-design a .agents/skills/project-design/SKILL.md.
Serveix per millorar el disseny visual d'interfícies i pàgines. L'agent ha de crear una interfície neta, minimalista i fàcil d'usar:
disseny senzill, espaiat suficient, mides de lletra llegibles, botons fàcils de veure i de clicar, colors coherents.
Escriu en anglès el contingut dels fitxers que creïs. Els noms de fitxers, carpetes, funcions i variables, i les claus JSON, també en anglès.
Crea només el fitxer de la skill. No modifiquis el codi de l'app.
```

```text
Crea una skill nova d'OpenCode anomenada code-review a .agents/skills/code-review/SKILL.md.
Serveix per revisar canvis de codi en una app web estàtica senzilla a webs/, feta amb HTML, CSS i JavaScript. Ha de comprovar:
els criteris d'acceptació de la tasca actual, que les funcionalitats existents no s'han trencat, que l'HTML, el CSS i el JS són senzills i llegibles, i que localStorage es fa servir de manera segura. Ha d'evitar refactoritzacions grans i preferir correccions petites i concretes.
Escriu en anglès el contingut dels fitxers que creïs. Els noms de fitxers, carpetes, funcions i variables, i les claus JSON, també en anglès.
Crea només el fitxer de la skill. No modifiquis el codi de l'app.
```

```text
Llegeix la carpeta de skills i explica als agents com fer-les servir. Assegura't que cada agent sap quina skill ha de fer servir. Escriu en anglès el que afegeixis als fitxers dels agents. No creïs skills noves.
```

**Comprova-ho:** cada `SKILL.md` té `name` i `description`, i cada agent diu quina skill fa servir.

### Pas 5 · `AGENTS.md`

```text
Crea AGENTS.md documentant l'arnès d'OpenCode d'aquest projecte.
Deixa clar que el flux de tasques només s'executa quan faig servir /next-task o demano explícitament continuar el desenvolupament de tasques. Amb els prompts normals (salutacions, preguntes, depuració) respon amb normalitat i no toquis docs/tasks.json.
Inclou-hi:
- docs/tasks.json és la font de veritat de les tasques.
- /next-task tria la primera tasca pendent, implementa només aquesta tasca, verifica els criteris d'acceptació i la marca com a feta només si tots es compleixen.
- l'orchestrator coordina, el programmer implementa i el reviewer verifica.
- Skills disponibles: project-design, code-review.
Escriu AGENTS.md en anglès.
Ara no implementis l'aplicació.
```

**Comprova-ho:** queda clar que el flux només s'executa amb `/next-task`.

### Pas 6 · Validació real

```text
Actualitza l'arnès perquè cada tasca es pugui validar, no només revisar:
- El programmer manté la lògica de l'app com a funcions pures a webs/grades.js (un mòdul ES), separada del codi del DOM, i afegeix tests a tests/grades.test.mjs amb node:test i node:assert. La lògica que fa servir localStorage el rep com a paràmetre, perquè els tests puguin passar-ne un de fals.
- Afegeix un package.json mínim sense dependències, amb "type": "module" i l'script "test": "node --test".
- El reviewer pot executar npm test (regla amb action shell, resource "npm test *" i effect allow), n'ha d'incloure la sortida a l'informe, i una tasca només és "done" si els tests passen.
- Afegeix a AGENTS.md una secció "Validation" amb aquestes regles.
Escriu en anglès el contingut dels fitxers que creïs. Els noms de fitxers, carpetes, funcions i variables, i les claus JSON, també en anglès.
Ara no implementis cap funcionalitat de l'app.
```

**Comprova-ho:** el `reviewer` continua sense poder editar i ara pot executar `npm test`.

### Pas 7 · Les tasques

```text
Crea docs/tasks.json per a aquest projecte de Spec Driven Development: un array JSON on cada tasca té id, title, status i acceptance (una llista de comprovacions que es poden verificar).
L'app és una calculadora de notes: webs/grades.html i webs/grades.js, HTML, CSS i JavaScript sense backend ni dependències. L'usuari afegeix assignatures amb una nota de 0 a 10 i veu la llista i la mitjana.
Crea exactament aquestes cinc tasques, en aquest ordre, totes amb status "pending":
T01 Pàgina amb un formulari (assignatura, nota, botó Afegeix) i la llista de notes. Funció addGrade(list, subject, grade).
T02 Rebutja les notes que no siguin números de 0 a 10 i mostra un missatge d'error. Funció isValidGrade(value).
T03 Mostra la mitjana amb un decimal. Funció average(list).
T04 Mostra "Aprovat" si la mitjana és 5 o més, i "Suspès" si no. Funció result(avg).
T05 Desa les notes a localStorage i les recupera en recarregar. Funcions saveGrades(storage, list) i loadGrades(storage).
Cada tasca ha d'incloure el criteri "npm test passes and includes a test for <its function>".
Escriu els títols i els criteris en anglès, excepte els textos "Aprovat" i "Suspès", que són els que veu l'usuari.
Ara no implementis l'app.
```

**Comprova-ho:** `docs/tasks.json` té cinc tasques `pending`, cadascuna amb criteris que es poden comprovar.

### Pas 8 · Executar

Surt d'OpenCode, torna-hi a entrar i executa `/next-task` fins que les cinc tasques siguin `done`. Per veure l'app: `npx serve .` en un altre terminal i obre `http://localhost:3000/webs/grades.html` (amb `file://` no funciona). Després:

```text
Fes un commit de tots els canvis i fes push a main.
```

---

# Tasca T2 · Projecte «Lliuraments»

Al repositori `lliuraments`, el mateix de la T1. Obre OpenCode **dins de `lliuraments`**, no al de la pràctica.

### T2.0 · Enllaç `.opencode` (terminal)

La T2 comença sense arnès. Crea la carpeta i l'enllaç abans dels prompts:

```bash
mkdir -p .agents && ln -s .agents .opencode
```

```powershell
New-Item -ItemType Directory -Force .agents; cmd /c mklink /D .opencode .agents
```

### T2.1–T2.5 · Arnès

Els mateixos prompts dels **passos 1 a 5** de la pràctica, sense canvis. Surt i torna a entrar a OpenCode després del pas 5.

### T2.6 · Validació real

El prompt del pas 6, ja adaptat a «Lliuraments».

```text
Actualitza l'arnès perquè cada tasca es pugui validar, no només revisar:
- El programmer manté la lògica de l'app com a funcions pures a webs/lliuraments.js (un mòdul ES), separada del codi del DOM, i afegeix tests a tests/lliuraments.test.mjs amb node:test i node:assert. La lògica rep les dades de data/lliuraments.json com a paràmetre, perquè els tests puguin passar-ne unes de prova.
- Afegeix un package.json mínim sense dependències, amb "type": "module" i l'script "test": "node --test".
- El reviewer pot executar npm test (regla amb action shell, resource "npm test *" i effect allow), n'ha d'incloure la sortida a l'informe, i una tasca només és "done" si els tests passen.
- Afegeix a AGENTS.md una secció "Validation" amb aquestes regles.
Escriu en anglès el contingut dels fitxers que creïs. Els noms de fitxers, carpetes, funcions i variables, i les claus JSON, també en anglès.
Ara no implementis cap funcionalitat de l'app.
```

### T2.7 · Les tres tasques

```text
Llegeix PLAN.md i crea docs/tasks.json amb el mateix format que la pràctica (id, title, status, acceptance). Crea només aquestes tres tasques, totes amb status "pending":
T01 Mostra la llista de pràctiques ordenada per data límit. Funció sortByDueDate(practices).
T02 Per a cada pràctica, una taula d'alumnes amb l'estat: delivered, late o pending. Funció isLate(date, dueDate).
T03 Un resum per alumne: quantes pràctiques té lliurades, tard i pendents. Funció summary(student, deliveries).
La lògica va a webs/lliuraments.js com a funcions pures, amb tests a tests/lliuraments.test.mjs. Cada tasca ha d'incloure el criteri "npm test passes and includes a test for <its function>".
Escriu els títols i els criteris en anglès.
Ara no implementis l'app.
```

**Comprova-ho:** `docs/tasks.json` té T01–T03 `pending`.

### T2.8 · Executar una tasca

Surt d'OpenCode, torna-hi a entrar i executa `/next-task` **una vegada** (T01). Per veure la web: `npx serve .` en un altre terminal i obre `http://localhost:3000/webs/…` (amb `file://` no funciona). Després:

```text
Fes un commit de tots els canvis, crea l'etiqueta t2 i fes push de la branca main i de les etiquetes.
```

**Ampliació (opcional):** executa `/next-task` dues vegades més (T02 i T03).
