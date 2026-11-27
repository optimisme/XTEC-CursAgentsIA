# Prompts · Sessió 01 · Agents IA i OpenCode

Prompts de [01 - Agents IA i OpenCode](../01%20-%20Agents%20IA%20i%20OpenCode.md), en ordre i preparats per copiar i enganxar.

**Com fer-los servir**

- Els blocs `text` van a **OpenCode**, obert dins la carpeta del repositori on treballes. Els blocs `bash` van al **terminal**.
- Enganxa **un prompt cada vegada** i revisa el resultat abans del següent.
- Els prompts *one-shot* de la pràctica són a un altre arxiu: [one-shot-prompts.md](one-shot-prompts.md). Es fan servir en anglès, tal com es van provar.

---

## Pràctica · Repositori `ia-01-one-shot`

### `.gitignore`

El primer que ha de tenir qualsevol projecte: les claus no poden arribar mai al repositori.

```text
Crea un .gitignore per a aquest projecte que ignori .secrets/, keys.env, *.env, node_modules/ i .DS_Store. Després fes-ne commit amb el missatge "chore: add .gitignore" i fes push.
```

**Comprova-ho:** `git check-ignore -v .secrets/x` ha de mostrar la línia del `.gitignore`.

### Prompts *one-shot*

Tria'n com a mínim tres de [one-shot-prompts.md](one-shot-prompts.md). Cada un en una sessió nova (`/new`) i amb l'agent `build`.

---

## Tasca T1 · Projecte «Lliuraments»

Al repositori `lliuraments`, nou, buit i clonat. És el repositori de totes les tasques del curs. Abans dels prompts, fes-hi el `.gitignore` amb el prompt de dalt.

### T1.1 · `opencode.json` (agent `build`)

Abans, el servidor IETI ha d'estar configurat amb el seu script (és global, només cal fer-ho un cop).

```text
Crea un arxiu opencode.json en aquest projecte amb "$schema": "https://opencode.ai/config.json", "default_agent": "build" i una regla a "permissions" que demani confirmació abans de fer git push: { "action": "shell", "resource": "git push *", "effect": "ask" }.
No hi afegeixis res més: el model i el servidor IETI ja són a la meva configuració global d'OpenCode.
```

**Comprova-ho:** `opencode.json` només té `$schema`, `default_agent` i `permissions`. Al push de la T1.4, OpenCode t'ha de demanar confirmació.

### T1.2 · `PLAN.md` (agent `plan`)

Canvia a l'agent **`plan`** amb MAJ + TAB.

```text
Vull fer "Lliuraments": una web estàtica (HTML, CSS i JavaScript, sense backend ni login) que mostra les pràctiques d'un grup i quins alumnes les han lliurat, si ho han fet tard i quines falten. Les dades són a data/lliuraments.json.
Escriu PLAN.md amb: objectiu, estructura de carpetes, model de dades i una llista de funcionalitats petites ordenades. No implementis res.
```

**Comprova-ho:** `PLAN.md` té les quatre parts. Corregeix el que no t'agradi abans de continuar.

### T1.3 · Dades (agent `build`)

Canvia a l'agent **`build`** amb MAJ + TAB.

```text
Crea data/lliuraments.json amb dades inventades: 3 pràctiques (id, title, dueDate), 5 alumnes (id, name, group) i una llista de lliuraments (studentId, practicaId, date). Els id són números enters (1, 2, 3…) i les dates tenen el format AAAA-MM-DD. Inclou algun lliurament fora de termini i alguna pràctica no lliurada.
```

**Comprova-ho:** el JSON té 3 pràctiques, 5 alumnes, algun lliurament amb `date` posterior a `dueDate` i alguna combinació alumne–pràctica sense lliurament.

### T1.4 · Commit, etiqueta i push

```text
Fes un commit amb opencode.json, .gitignore, PLAN.md i data/lliuraments.json, crea l'etiqueta t1 i fes push de la branca main i de les etiquetes.
```
