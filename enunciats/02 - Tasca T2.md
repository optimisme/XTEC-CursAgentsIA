# T2 · Projecte «Lliuraments»

> Enunciat de la tasca de la sessió 02. La teoria i la pràctica són a [02 - Harness Engineering](../teoria/02%20-%20Harness%20Engineering.md): els apartats i les seccions que se citen aquí són d'aquests apunts.

**Objectiu:** arnès SDD al projecte i la primera funcionalitat implementada i validada.

> 📋 Els prompts de la T2, en ordre i ja adaptats, són a [prompts-02-harness.md](../teoria/assets/prompts-02-harness.md).

**Repositori:** `lliuraments`, el mateix de la T1. Obre-hi OpenCode (`cd lliuraments` i `opencode`), no al de la pràctica: tot el que demana la tasca es crea allà.

1. Crea la carpeta de l'arnès i l'enllaç (secció 9): `mkdir -p .agents && ln -s .agents .opencode`. A PowerShell: `New-Item -ItemType Directory -Force .agents; cmd /c mklink /D .opencode .agents`.
2. Crea-hi l'arnès de la pràctica (orchestrator, programmer, reviewer, `/next-task`, skills `code-review` i `project-design`, `AGENTS.md`) amb els prompts dels passos 1–6. Els passos 1–5 es fan servir sense canvis; el pas 6, ja adaptat a «Lliuraments» (`webs/lliuraments.js` i `tests/lliuraments.test.mjs`), és a [prompts-02-harness.md](../teoria/assets/prompts-02-harness.md), apartat T2.6.
3. Crea les tasques amb un prompt a partir de `PLAN.md`, el pla que vas escriure a la T1.

   Executa aquest prompt a OpenCode dins del projecte (`lliuraments`):
   ```text
   Llegeix PLAN.md i crea docs/tasks.json amb el mateix format que la pràctica (id, title, status, acceptance). Crea només aquestes tres tasques, totes amb status "pending":
   T01 Mostra la llista de pràctiques ordenada per data límit. Funció sortByDueDate(practices).
   T02 Per a cada pràctica, una taula d'alumnes amb l'estat: delivered, late o pending. Funció isLate(date, dueDate).
   T03 Un resum per alumne: quantes pràctiques té lliurades, tard i pendents. Funció summary(student, deliveries).
   La lògica va a webs/lliuraments.js com a funcions pures, amb tests a tests/lliuraments.test.mjs. Cada tasca ha d'incloure el criteri "npm test passes and includes a test for <its function>".
   Escriu els títols i els criteris en anglès.
   Ara no implementis l'app.
   ```

4. Surt d'OpenCode, torna-hi a entrar i executa `/next-task` **una vegada**: implementa i valida la T01. Si falla, llegeix l'informe del reviewer i decideix si cal corregir la tasca o l'arnès. Per veure la web, executa `npx serve .` en un altre terminal, des de `lliuraments`, i obre `http://localhost:3000/webs/…`: la pàgina llegeix `data/lliuraments.json`, i això no funciona obrint l'HTML amb doble clic (`file://`).
5. Demana a l'agent el commit, l'etiqueta `t2` i el push (sessió 01, apartat 17).

**Lliurable:** enllaç a l'etiqueta `t2` de `lliuraments`, amb l'arnès a `.agents/`, `AGENTS.md`, `docs/tasks.json` amb la T01 `done` i `npm test` en verd.

**Ampliació (opcional):** executa `/next-task` dues vegades més per fer la T02 i la T03.
