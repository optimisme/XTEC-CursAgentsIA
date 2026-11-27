# T3 · Projecte «Lliuraments»

> Enunciat de la tasca de la sessió 03. La teoria i la pràctica són a [03 - Function calling i models locals](../teoria/03%20-%20Function%20calling%20i%20models%20locals.md): els apartats i les seccions que se citen aquí són d'aquests apunts.

**Objectiu:** que l'eina CMD de la pràctica respongui una pregunta sobre les dades del projecte «Lliuraments».

**Repositori:** `lliuraments`. Obre-hi OpenCode (`cd lliuraments` i `opencode`). Fes-ho amb l'agent **`build`**, directament, sense `/next-task`: aquesta tasca no passa per l'arnès de la T2.

> 📋 Els prompts de la T3 són a [prompts-03-function-calling.md](../teoria/assets/prompts-03-function-calling.md), apartat T3.

1. **Copia l'eina de la pràctica** a la carpeta `cli/` del projecte. Al terminal, des de `lliuraments` (les dues carpetes són de costat):

   ```bash
   cp -R ../ia-03-function-calling/app cli
   ```

   A PowerShell: `Copy-Item -Recurse ..\ia-03-function-calling\app cli`. La còpia inclou `cli/settings.env`, amb la teva clau: comprova amb `git check-ignore -v cli/settings.env` que queda ignorat.

2. **Canvia les funcions** amb un sol prompt. El bucle i la crida al model no es toquen:

   ```text
   La carpeta cli/ és una eina de línia de comandes amb function calling copiada d'un altre projecte. Adapta-la a aquest projecte:
   - Esborra cli/data/ i les funcions d'alumnes, tasques i incidències de cli/src/tools.js.
   - Afegeix-hi una sola funció, get_student_summary({ name }): llegeix data/lliuraments.json de l'arrel del repositori (ruta a partir de import.meta.url, a cada crida), busca l'alumne pel nom sense distingir majúscules i minúscules i retorna { student: { id, name, group }, delivered, late, pending }: quantes pràctiques ha lliurat dins del termini, quantes tard i quantes no ha lliurat. Si name no és un string no buit o l'alumne no existeix, retorna { error: "..." }. No llança mai excepcions.
   - Actualitza TOOLS i TOOL_DEFINITIONS perquè només continguin aquesta funció, amb una description clara en anglès.
   - Canvia SYSTEM_MESSAGE de cli/src/app.js per aquest text: "You are an assistant for a teacher using a command-line tool about assignment deliveries. Always answer in the same language as the user. You cannot access the data directly. You can only request the available functions. Never invent data."
   - No canviïs cli/src/llm.js ni el bucle de cli/src/app.js.
   Escriu en anglès el codi, els noms i els comentaris.
   ```

3. **Prova-ho** amb el nom d'un alumne del teu `data/lliuraments.json`:

   ```bash
   cd cli
   npm start -- "Quantes pràctiques té pendents la Júlia?"
   ```

   Desa a `docs/cli-exemple.md` la pregunta, la resposta i el model que has fet servir.

4. Demana a l'agent el commit, l'etiqueta `t3` i el push (sessió 01, apartat 17).

**Lliurable:** enllaç a l'etiqueta `t3` de `lliuraments`, amb `cli/` funcionant i `docs/cli-exemple.md`.

**Ampliació (opcional):** afegeix-hi `get_practices()` i `get_pending_students({ practicaId })`, un test per funció a `tests/`, i prova l'eina amb Ollama canviant `cli/settings.env` (part B).
