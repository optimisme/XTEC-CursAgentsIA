# T7 · Projecte «Lliuraments»

> Enunciat de la tasca de la sessió 07. La teoria i la pràctica són a [07 - ATD i treball autònom](../teoria/07%20-%20ATD%20i%20treball%20aut%C3%B2nom.md): els apartats i les seccions que se citen aquí són d'aquests apunts.

**Objectiu:** que l'agent implementi la funcionalitat que vas descriure com a issue a la T4, ara escrita com a tasca en Markdown.

**Repositori:** `lliuraments`. Obre-hi OpenCode (`cd lliuraments` i `opencode`).

> 📋 Els prompts de la T7 són a [`assets/prompts-07-atd.md`](../teoria/assets/prompts-07-atd.md), apartat T7.

1. **La tasca.** Amb l'MCP de GitHub, demana a l'agent que llegeixi la issue de la T4 i redacti una tasca `tasks/TXX-nom.md` amb la plantilla de la secció 8. Numera-la amb el primer número que no faci servir `docs/tasks.json` (normalment, T04). `PLAN.md` ja existeix (és el pla de la T1): afegeix-hi al final una secció `## Tasques` amb la tasca i l'estat `1:[ready]`, sense tocar la resta. Revisa la tasca abans de continuar.
2. **La comanda.** Copia `/next-md-task` de la pràctica 2 a `.agents/commands/` i adapta-la amb un prompt:
   - als agents del projecte (sessió 02): `orchestrator`, `programmer` i `reviewer`; no hi ha *tester*, i és el `reviewer` qui executa `npm test`;
   - a `PLAN.md`: les tasques i el seu estat només són a la secció `## Tasques`;
   - la validació és `npm test` i els criteris d'acceptació. Si a la T4 vas donar Playwright al `reviewer`, també una comprovació de la web a `http://localhost:3000/webs/…`.

   Deixa `/next-task` (JSON) tal com està: els dos formats conviuen.
3. **Executa-la.** Surt d'OpenCode i torna-hi a entrar. Executa `/next-md-task` i segueix `PLAN.md` mentre treballa. Si la tasca falla, llegeix el motiu a la línia de sota, corregeix la tasca o el codi i torna-la a executar: ja torna a ser `[ready]`. Per veure el resultat, `npx serve .` en un altre terminal i obre `http://localhost:3000/webs/…`.
4. La comanda ja fa el commit de la tasca. Demana a l'agent l'etiqueta `t7` i el push (sessió 01, apartat 17).

**Lliurable:** enllaç a l'etiqueta `t7` de `lliuraments`, amb la secció `## Tasques` de `PLAN.md` amb la tasca a `[done]`, el fitxer `tasks/T*.md`, la comanda `/next-md-task` adaptada i el commit de la tasca.

**Ampliació (opcional):**

- Més tasques i el bucle: escriu-ne dues més, copia també `/run-tasks` i executa'l.
- Una tasca programada: `prompts/resum-diari.md` i `scripts/resum-diari.sh` (o `.ps1`) amb els prompts de la part C, i executa l'script un cop perquè es generi `STATUS.md`.
- Continuar més tard: demana a l'agent `DECISIONS.md` i `HANDOFF.md` (part D).
- Tanca la issue amb un comentari que enllaci el commit de la tasca.
