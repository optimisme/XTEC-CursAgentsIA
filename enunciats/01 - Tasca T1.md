# T1 · Projecte «Lliuraments»

> Enunciat de la tasca de la sessió 01. La teoria i la pràctica són a [01 - Agents IA i OpenCode](../teoria/01%20-%20Agents%20IA%20i%20OpenCode.md): els apartats i les seccions que se citen aquí són d'aquests apunts.

Al llarg del curs construirem, sessió a sessió, un mateix projecte: **Lliuraments**, una web estàtica i una eina de línia de comandes per fer el seguiment de les pràctiques que han lliurat els alumnes. Sense login ni backend: les dades són en un JSON. Cada sessió hi afegeix una tasca petita; el [projecte final](../teoria/Projecte%20final.md) és un PDF que les recull totes, amb la teva valoració del curs.

**Objectiu:** repositori preparat i projecte planificat.

> 📋 Els prompts de la T1 són a [prompts-01-agents-opencode.md](../teoria/assets/prompts-01-agents-opencode.md), en ordre i preparats per copiar i enganxar.

1. Crea a GitHub un repositori nou i buit `lliuraments`, clona'l i obre-hi OpenCode (apartat 17).
2. Si encara no tens el servidor IETI configurat, executa'n l'script (apartat 10): és global i només cal fer-ho un cop. Crea el `.gitignore` amb el prompt de l'apartat 17 i després, amb l'agent **`build`**, executa aquest prompt a OpenCode dins del projecte:
   ```text
   Crea un arxiu opencode.json en aquest projecte amb "$schema": "https://opencode.ai/config.json", "default_agent": "build" i una regla a "permissions" que demani confirmació abans de fer git push: { "action": "shell", "resource": "git push *", "effect": "ask" }.
   No hi afegeixis res més: el model i el servidor IETI ja són a la meva configuració global d'OpenCode.
   ```

   Obre l'`opencode.json` i comprova que només hi ha `$schema`, `default_agent` i `permissions` (apartat 11).

3. Amb l'agent **`plan`**, executa aquest prompt a OpenCode dins del projecte (`lliuraments`):
   ```text
   Vull fer "Lliuraments": una web estàtica (HTML, CSS i JavaScript, sense backend ni login) que mostra les pràctiques d'un grup i quins alumnes les han lliurat, si ho han fet tard i quines falten. Les dades són a data/lliuraments.json.
   Escriu PLAN.md amb: objectiu, estructura de carpetes, model de dades i una llista de funcionalitats petites ordenades. No implementis res.
   ```

4. Revisa `PLAN.md` i corregeix el que no t'agradi. Després, amb l'agent **`build`**, executa aquest prompt a OpenCode dins del projecte:
   ```text
   Crea data/lliuraments.json amb dades inventades: 3 pràctiques (id, title, dueDate), 5 alumnes (id, name, group) i una llista de lliuraments (studentId, practicaId, date). Els id són números enters (1, 2, 3…) i les dates tenen el format AAAA-MM-DD. Inclou algun lliurament fora de termini i alguna pràctica no lliurada.
   ```

5. Demana a l'agent el commit, l'etiqueta `t1` i el push (apartat 17). Abans del push, OpenCode t'ha de demanar confirmació: és la regla de `permissions` del pas 2.

**Lliurable:** enllaç a l'etiqueta `t1` del repositori `lliuraments`, amb `opencode.json`, `.gitignore`, `PLAN.md` i `data/lliuraments.json`.
