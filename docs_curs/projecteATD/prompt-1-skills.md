Configura els skills del projecte a `.opencode/skills/`.

Important, tingues en compte:

* L'objectiu és implementar els skills de l'arnès.
* No implementis l'aplicació.
* No generis encara `PLAN.md`.
* No creïs GitHub Issues ni GitHub Projects.
* No creïs agents.
* No modifiquis fitxers fora de `.opencode/skills/`.
* No escriguis arxius grans d'un sol cop: crea primer cada arxiu buit i afegeix el contingut per seccions petites.
* No creïs PLAN.md, agents ni AGENTS.md

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

## `github-task-management`

Defineix GitHub com a sistema d'execució i seguiment de les tasques ATD.

El projecte utilitza:

* `PLAN.md` com a pla estable i arquitectura de desenvolupament;
* GitHub Issues com a tasques atòmiques;
* GitHub Project com a font d'autoritat de l'estat operacional.

No s'han de crear fitxers `tasks/*.md`.

Cada tasca executable ha de correspondre a una GitHub Issue.

Les issues han de tenir, quan sigui possible:

* identificador estable `TASK-NNN` o `BUG-NNN`;
* objectiu únic;
* descripció;
* implementació esperada;
* criteris de validació;
* dependències;
* fase;
* ordre;
* prioritat;
* tipus.

El GitHub Project ha d'utilitzar conceptualment:

### Status

* `Todo`
* `In Progress`
* `Done`

### Type

* `Task`
* `Bug`

### Phase

Fase definida a `PLAN.md`.

### Order

Valor numèric que defineix l'ordre normal de desenvolupament.

Utilitza preferentment increments de 10:

`10`, `20`, `30`, ...

per permetre inserir posteriorment tasques intermèdies.

### Priority

* `Urgent`
* `High`
* `Medium`
* `Low`

La prioritat no substitueix les dependències ni l'ordre.

`Priority` és principalment informativa i no altera l'ordre normal de desenvolupament, excepte per als bugs `Urgent`, especialment quan siguin bloquejants.

Per seleccionar la següent tasca:

1. considera només items `Todo`;
2. descarta els que tinguin dependències pendents;
3. prioritza bugs `Urgent`;
4. en la resta de casos utilitza el valor `Order` executable més baix.

No mantinguis una còpia local de l'estat de les tasques.

---

## `atomic-task-execution`

Defineix com executar una tasca atòmica.

L'agent ha de:

* treballar exclusivament sobre la GitHub Issue assignada;
* llegir-ne completament objectiu, dependències i criteris;
* fer els canvis mínims necessaris;
* evitar scope creep;
* no implementar funcionalitats de futures issues;
* respectar `PLAN.md`;
* no considerar la tasca completada fins que hagi estat validada.

Una issue `In Progress` pot passar a `Done` únicament després d'una validació `PASS`.

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

Cada GitHub Issue completada i validada ha de correspondre a un únic commit lògic.

Flux:

1. la issue passa a `In Progress`;
2. s'implementa;
3. es valida;
4. si retorna `FAIL`, no es crea cap commit final de tasca;
5. es corregeix i torna a validar;
6. després de `PASS`, es crea el commit corresponent;
7. només després que el commit s'hagi creat correctament, s'actualitza la issue a `Done`.

El commit ha d'incloure exclusivament els canvis relacionats amb aquella tasca.

Format recomanat:

`TASK-NNN: descripció breu`

o:

`BUG-NNN: descripció breu`

Quan sigui útil, referencia també el número de GitHub Issue.

No agrupis diverses tasques independents en un mateix commit.

No incloguis canvis aliens a la tasca.

---

## `bug-management`

Defineix com gestionar defectes trobats durant el desenvolupament.

### Error de la tasca actual

Si el problema forma part de la funcionalitat que s'està implementant:

* no creïs una nova issue;
* el validator retorna `FAIL`;
* la mateixa tasca torna a l'executor.

### Regressió o bug en funcionalitat ja completada

Si es detecta un defecte en funcionalitat anterior:

1. comprova amb GitHub MCP que no existeixi ja una issue equivalent;
2. crea una GitHub Issue de tipus `Bug`;
3. assigna-li identificador `BUG-NNN`;
4. documenta reproducció, resultat esperat, resultat observat i evidències;
5. defineix dependències, fase, ordre i prioritat;
6. incorpora-la al GitHub Project.

El bug passa després pel mateix flux:

`orchestrator → executor → validator`

No implementis un bug directament només perquè existeixi una incidència informal: ha d'existir una issue executable al GitHub Project.

---

Cada skill ha de tenir una capçalera:

```yaml
---
name:
description:
---
```
