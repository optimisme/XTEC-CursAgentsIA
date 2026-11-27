# T4 · Projecte «Lliuraments»

> Enunciat de la tasca de la sessió 04. La teoria i la pràctica són a [04 - MCPs GitHub, Playwright i MCP propi](../teoria/04%20-%20MCPs%20GitHub%2C%20Playwright%20i%20MCP%20propi.md): els apartats i les seccions que se citen aquí són d'aquests apunts.

**Objectiu:** connectar el projecte amb GitHub i veure la web amb un navegador real.

> 📋 Els prompts de la T4 són a [`assets/prompts-04-mcp.md`](../teoria/assets/prompts-04-mcp.md), apartat T4.

**Repositori:** `lliuraments`. Obre-hi OpenCode (`cd lliuraments` i `opencode`). El token de GitHub és a `~/.secrets/` i els MCPs de GitHub i Playwright ja són globals: no cal tornar-los a configurar.

1. **MCPs.** Comprova amb `opencode mcp list` que `github` i `playwright` surten connectats des de `lliuraments`, i afegeix la secció `# MCPs` a l'`AGENTS.md` del projecte (la mateixa de la pràctica).
2. **Una issue.** Amb l'MCP de GitHub, crea **una issue** amb una funcionalitat nova (títol, descripció i criteris d'acceptació). Per exemple: «Filtrar la taula per alumne». No la implementis: a la sessió 07 la convertirem en una tasca en Markdown i l'agent la implementarà.
3. **Playwright.** La web llegeix `data/lliuraments.json`, que és fora de `webs/`: serveix l'**arrel** del repositori, no només `webs/`. En un altre terminal, des de `lliuraments`: `npx serve .`. La pàgina és a `http://localhost:3000/webs/…` (el nom és el que fixa el `PLAN.md` de la T1). Amb l'MCP de Playwright, obre la web, comprova que es veu la llista de pràctiques i desa una captura a `docs/captures/`.
4. Demana a l'agent el commit, l'etiqueta `t4` i el push (sessió 01, apartat 17).

**Lliurable:** enllaç a l'etiqueta `t4` de `lliuraments`, amb la issue oberta a GitHub, la secció `# MCPs` a `AGENTS.md` i la captura de Playwright a `docs/captures/`.

**Ampliació (opcional):**

- Crea dues issues més (per exemple, «Marcar la pràctica més propera a vèncer» i «Exportar el resum per alumne a CSV»).
- Fes que el `reviewer` també validi la web amb Playwright. No pot engegar el servidor (només pot executar `npm test`): l'engegues tu abans de `/next-task`. A la seva capçalera, `permissions` ha de tenir una regla `allow` per a les accions `playwright_*`, després de la regla general que ho denega tot (guanya l'última que coincideix).
- Copia l'MCP `task-contract` de la pràctica (`cp -R ../ia-04-mcp/.agents/mcp/task-contract .agents/mcp/`, sense `node_modules` ni `reports.jsonl`), instal·la'l, registra'l a `opencode.json` i fes que el `reviewer` hi enviï l'informe de cada tasca (permís `task-contract_*`).
