Configura els skills del projecte a `.opencode/skills/`.

Important, tingues en compte:

* L'objectiu és implementar els skills de l'arnès de desenvolupament.
* No implementis l'aplicació.
* No generis encara `PLAN.md`.
* No generis encara la carpeta `tasks/`.
* No creïs GitHub Issues ni GitHub Projects.
* GitHub no s'utilitza per al seguiment operacional del desenvolupament.
* No creïs agents.
* No modifiquis fitxers fora de `.opencode/skills/`.
* No escriguis arxius grans d'un sol cop: crea primer cada arxiu buit i afegeix el contingut per seccions petites.
* No creïs `PLAN.md`, agents ni `AGENTS.md`.

Crea els següents skills:

## `web-design`

Defineix les normes d'estètica, usabilitat i accessibilitat que s'han de seguir durant tot el desenvolupament de la interfície.

L'aplicació ha de tenir una estètica moderna, neta i professional, inspirada en les interfícies d'aplicacions d'escriptori actuals.

Evita:

* estils excessivament decoratius;
* gradients innecessaris;
* ombres exagerades;
* aparença de plantilla genèrica;
* contenidors i targetes innecessaris.

### Tipografia

Utilitza **Geist Sans** com a tipografia principal.

* Utilitza una escala tipogràfica reduïda i consistent.
* Diferencia la jerarquia principalment mitjançant mida, pes i espaiat.
* Evita utilitzar molts pesos diferents.
* Prioritza la llegibilitat.
* Utilitza una font monoespai només per URLs, identificadors, fragments de codi o informació tècnica.

### Icones

Utilitza **Lucide Icons**.

* Mantén un únic estil d'icones.
* Prioritza icones lineals i simples.
* Mantén gruix i mida coherents.
* No barregis Lucide amb emojis o altres biblioteques.
* Les icones no han de substituir textos quan l'acció pugui resultar ambigua.
* Els botons exclusivament amb icona han de tenir una etiqueta accessible.

### Recursos

* Utilitza Geist Sans i Lucide com a recursos locals o dependències del projecte.
* Evita dependre de CDNs externs.

### Paleta

Base clara:

* fons principal: `#F8FAFC` / `#FFFFFF`;
* superfícies: `#FFFFFF`;
* vores: `#E2E8F0`;
* text principal: `#0F172A`;
* text secundari: `#64748B`;
* accent: `#2563EB`;
* accent hover: `#1D4ED8`.

Colors semàntics:

* `PASS`: `#16A34A`;
* `FAIL`: `#DC2626`;
* `NEEDS_REVIEW`: `#D97706`;
* informació: `#2563EB`.

No utilitzis mai el color com a única manera de comunicar un estat.

### Prioritats

Prioritza sempre:

1. usabilitat;
2. accessibilitat;
3. simplicitat;
4. consistència;
5. estètica.

### Revisió visual

Inclou una checklist breu per comprovar:

* consistència visual;
* contrast i llegibilitat;
* responsive;
* formularis;
* errors;
* estats de càrrega;
* èxit i error;
* focus visible;
* navegació amb teclat;
* accessibilitat bàsica.

---

## `task-management`

Defineix `tasks/` com a sistema únic d'execució i seguiment operacional de les tasques ATD.

El projecte utilitza:

* `PLAN.md` com a pla estable, arquitectura, fases i fites;
* `tasks/TASK-NNN.md` com a definició i estat de cada tasca atòmica;
* `tasks/BUG-NNN.md` per defectes descoberts sobre funcionalitat ja completada;
* Git només per crear commits en fites (`milestones`) superades;
* GitHub no s'utilitza per Issues, Projects ni seguiment de tasques.

### Font d'autoritat operacional

La carpeta `tasks/` és l'única font d'autoritat sobre l'estat operacional.

No mantinguis una còpia paral·lela de l'estat a:

* `PLAN.md`;
* `AGENTS.md`;
* GitHub Issues;
* GitHub Projects;
* labels;
* altres checklists.

### Capçalera de tasques i bugs

Cada `tasks/TASK-NNN.md` i `tasks/BUG-NNN.md` ha de començar amb una capçalera YAML delimitada per `---`.

La capçalera és la font d'autoritat per a l'estat, la prioritat i les metadades operacionals. 

Per a una tasca:

```yaml
---
id: TASK-012
type: task
title: Descripció breu
status: ready
priority: 20
milestone: M2
phase: F2
dependencies:
  - TASK-008
---
```

Per a un bug:

```yaml
---
id: BUG-003
type: bug
title: Descripció breu del defecte
status: ready
priority: 5
severity: high
blocking: true
milestone: M2
phase: F2
related-task: TASK-012
dependencies: []
---
```

Valors permesos de `status`:

* `backlog`: definit però encara no executable, normalment perquè té dependències pendents;
* `ready`: executable;
* `in_progress`: l'`executor` l'està implementant o corregint;
* `in_review`: implementació pendent de validació del `validator`;
* `done`: implementada i validada amb `PASS`.

`priority` és un enter positiu. Com més petit sigui el valor, abans s'ha de prioritzar l'element entre els que siguin realment executables. La prioritat es conserva també quan `status: done`.

Per als bugs:

* `severity` ha de ser `critical`, `high`, `medium` o `low`;
* `blocking` indica si el defecte impedeix completar la fita o continuar amb treball dependent;
* `related-task` identifica, quan sigui possible, la tasca o funcionalitat completada on s'ha detectat el defecte.

La prioritat numèrica no pot saltar-se dependències.

### Fitxer de tasca

Després de la capçalera, cada fitxer de tasca ha de contenir com a mínim:

* objectiu únic;
* implementació esperada;
* criteris de validació;
* notes només quan siguin necessàries.

No dupliquis al cos els camps que ja formen part de la capçalera.

Format recomanat:

```markdown
---
id: TASK-012
type: task
title: Descripció breu
status: ready
priority: 20
milestone: M2
phase: F2
dependencies:
  - TASK-008
---

# TASK-012 — Descripció breu

## Objective
...

## Implementation
...

## Validation
...
```

No utilitzis checkboxes per representar l'estat.

### Transicions

L'`orchestrator` és l'únic agent que modifica el camp `status` de la capçalera.

Transicions normals:

```text
status: backlog → status: ready → status: in_progress → status: in_review → status: done
```

També pot existir:

```text
status: in_review → status: in_progress
```

quan el `validator` retorna `FAIL`.

Una tasca amb `status: backlog` passa a `status: ready` quan totes les dependències tenen `status: done`.

### Selecció de la següent tasca

1. reconcilia l'estat real amb els fitxers de `tasks/`;
2. actualitza a `status: ready` les tasques amb `status: backlog` que ja tinguin totes les dependències amb `status: done`;
3. considera només tasques amb `status: ready`;
4. selecciona el valor `priority` més petit;
5. en empat, utilitza l'identificador numèric més petit;
6. abans de delegar-la, canvia `status` a `in_progress`.

No hi pot haver més d'un element de treball (`TASK-NNN` o `BUG-NNN`) amb `status: in_progress` o `status: in_review` alhora.

---

## `atomic-task-execution`

Defineix com executar una tasca atòmica.

L'agent ha de:

* treballar exclusivament sobre el fitxer de tasca assignat;
* llegir completament objectiu, dependències i criteris;
* fer els canvis mínims necessaris;
* evitar scope creep;
* no implementar funcionalitats de tasques futures;
* respectar `PLAN.md`;
* no considerar la tasca completada fins que hagi estat validada.

L'`executor` no modifica l'estat de la tasca.

Quan acaba la implementació, retorna el control a l'`orchestrator`, que canvia:

```text
status: in_progress → status: in_review
```

Una tasca només pot passar a `status: done` després d'una validació `PASS`.

En una reconciliació posterior, la mera existència de la implementació no és suficient per inferir `status: done`. Si no es pot demostrar de manera segura que la tasca ja havia superat la validació, s'ha de repetir la validació abans de marcar-la com a `done`.

---

## `browser-validation`

Defineix la validació funcional mitjançant **Puppeteer MCP**.

Sempre que una funcionalitat sigui observable des del navegador, Puppeteer MCP s'ha d'utilitzar per validar-la.

Quan correspongui, comprova:

* càrrega de pàgines;
* existència i visibilitat dels elements;
* formularis;
* botons;
* enllaços;
* fluxos d'usuari;
* navegació;
* resultats mostrats;
* persistència després de recarregar;
* errors JavaScript a la consola;
* diferents amplades de pantalla;
* navegació amb teclat;
* focus visible;
* criteris rellevants de `web-design`.

Les validacions han de comprovar comportament observable i no limitar-se a inspeccionar el codi.

---

## `regression-validation`

Defineix com comprovar que una implementació no trenca funcionalitats ja completades.

Després de cada implementació:

* identifica funcionalitats relacionades;
* comprova possibles regressions;
* repeteix proves prèvies quan sigui necessari;
* utilitza Puppeteer MCP quan siguin proves web;
* comprova nous errors JavaScript;
* informa de qualsevol regressió abans del `PASS`.

---

## `git-workflow`

Defineix el flux Git del desenvolupament.

### Principi

No es crea un commit per cada tasca.

Els commits es creen únicament quan s'assoleix una fita (`Milestone`) definida a `PLAN.md` i aquesta fita ha superat la revisió global del `reviewer`.

Durant les tasques individuals:

* es poden modificar fitxers;
* no es crea cap commit final de tasca;
* els canvis validats s'acumulen fins a la fita corresponent.

### Commit de fita

Quan totes les tasques requerides d'una fita tenen `status: done`:

1. l'`orchestrator` delega la revisió de fita al `reviewer`;
2. si el `reviewer` detecta problemes, es creen o reactiven tasques locals i no es crea el commit;
3. quan la revisió de fita retorna `PASS`, l'`orchestrator` comprova l'abast dels canvis;
4. abans de crear el commit, comprova l'historial Git i verifica que el commit exacte de la fita encara no existeix;
5. si ja existeix, considera la fita ja commitejada i no creïs un commit duplicat;
6. si no existeix, crea un únic commit coherent de fita;
7. comprova que el commit s'ha creat correctament;
8. continua amb la fita següent.

Format recomanat:

```text
MILESTONE-MN: descripció breu
```

Per exemple:

```text
MILESTONE-M2: complete practice management
```

No utilitzis GitHub Issues ni GitHub Projects.

No facis `push` ni publiquis canvis remots tret que una instrucció explícita del projecte ho demani. El seguiment operacional continua residint exclusivament a `tasks/`.


## Milestones Git

Les milestones concretes del projecte es defineixen exclusivament a `PLAN.md`.

El skill no ha d'inventar, duplicar ni hardcodejar identificadors, noms, abast o missatges de commit de milestones concretes.

### Regla general

No es crea cap commit quan acaba una tasca individual.

Quan totes les tasques necessàries d'una milestone definida a `PLAN.md` estan completades:

1. l'`orchestrator` comprova que no hi hagi bugs bloquejants associats;
2. delega una revisió global de la milestone al `reviewer`;
3. si el `reviewer` retorna `FAIL`, no es crea cap commit i es creen o reactiven les tasques locals necessàries;
4. després de corregir-les, la milestone es torna a revisar;
5. només si el `reviewer` retorna `PASS`, l'`orchestrator` comprova primer si el commit exacte de la milestone ja existeix a l'historial Git;
6. si ja existeix, no crea cap commit duplicat;
7. si no existeix, crea un únic commit coherent per a la milestone;
8. el missatge del commit ha de seguir el format o missatge definit a `PLAN.md`.

Cada milestone genera com a màxim un commit final.

No facis `push` ni publiquis canvis remots tret que una instrucció explícita del projecte ho demani.

GitHub Issues i GitHub Projects no s'utilitzen per al seguiment operacional.

## `bug-management`

Defineix com gestionar defectes trobats durant el desenvolupament.

### Error de la tasca actual

Si el problema forma part de la funcionalitat que s'està implementant:

* no creïs un nou fitxer `BUG-NNN.md`;
* el `validator` retorna `FAIL`;
* l'`orchestrator` retorna la mateixa tasca a `status: in_progress`;
* la mateixa tasca torna a l'`executor`.

### Regressió o bug en funcionalitat ja completada

Si es detecta un defecte en funcionalitat anterior:

1. comprova que no existeixi ja un `BUG-NNN.md` equivalent;
2. crea un nou `tasks/BUG-NNN.md`;
3. utilitza numeració global i estable;
4. documenta reproducció, resultat esperat, resultat observat i evidències;
5. assigna fase, fita, dependències i prioritat numèrica;
6. determina si pot començar amb `status: ready` o ha de quedar amb `status: backlog`;
7. incorpora'l al mateix flux:

```text
orchestrator → executor → validator
```

Un bug bloquejant ha de tenir `blocking: true` i rebre una `priority` numèrica prou baixa per executar-se abans de les tasques normals disponibles, sense ignorar dependències.

No creïs GitHub Issues per bugs.

---

Cada skill ha de tenir una capçalera:

```yaml
---
name:
description:
---
```
