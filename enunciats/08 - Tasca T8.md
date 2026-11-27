# T8 · Projecte «Lliuraments»

> Enunciat de la tasca de la sessió 08. La teoria i la pràctica són a [08 - Servidors d'inferència](../teoria/08%20-%20Servidors%20d%27infer%C3%A8ncia.md): els apartats i les seccions que se citen aquí són d'aquests apunts.

**Objectiu:** saber quin model i quin servidor convenen al projecte, amb dades.

> **Repositori:** `lliuraments`. Obre-hi OpenCode (`cd lliuraments` i `opencode`).

> 📋 Els prompts de la T8 són a [`assets/prompts-08-inferencia.md`](../teoria/assets/prompts-08-inferencia.md), apartat T8.

1. Necessites dos proveïdors. El del proxy (`ieti-agents/active-model`) ja és a la configuració global des de la sessió 01: no el tornis a definir al projecte. Afegeix a l'`opencode.json` del projecte només el local (Ollama a `http://127.0.0.1:11434/v1`, o llama.cpp si tens GPU). Els `limit.context` i `limit.output` han de coincidir amb la configuració real de cada servidor; Ollama fa servir per defecte un context petit, que s'amplia arrencant-lo amb `OLLAMA_CONTEXT_LENGTH=32768`. Fes servir el mateix format de proveïdor que a la sessió 01 i, si tens OpenCode 2, `capabilities` (secció 17). **Sense accés al proxy**, compara dos models locals de mida diferent (per exemple, 4B i 30B A3B).
2. Crea una tasca petita a `docs/tasks.json` (per exemple: «Afegir el total de lliuraments tard a la capçalera») i executa-la amb `/next-task` **amb cada model**, partint del mateix commit (fes servir una branca per a cada prova). Si fas servir `git worktree`, recorda que la carpeta nova no té els arxius ignorats (`.secrets/`, `.rag/`, `node_modules/`): copia'ls o enllaça'ls i executa `npm install` abans de provar.
3. Anota a `docs/models.md`, per a cada model: servidor, paràmetres i quantització, context configurat, tokens consumits (`opencode stats --models`), temps aproximat, si els tests han passat a la primera i quants intents ha necessitat.
4. Conclusió en tres línies: quin model faries servir per a tasques complexes i quin per a tasques petites i repetitives, i per què.
5. Si tens accés al servidor del curs: mira als logs d'arrencada de vLLM quanta memòria ocupen els pesos (*Model loading took … GiB*) i quanta queda per a la KV cache (*Available KV cache memory*). Amb la fórmula de la secció 5, calcula quants tokens de context hi caben. `nvidia-smi` no serveix per a això: vLLM reserva d'entrada tota la fracció de `--gpu-memory-utilization`, i a DGX Spark sovint mostra N/A.
6. **Opcional · velocitat en equips petits.** Si tens un Mac amb Apple Silicon o un DGX Spark, prova **TensorFold**; si tens una gràfica de 12 GB o més i 64 GB de RAM (i uns 80 GB de disc lliure), prova **Strata**. Mesura els tok/s amb la seva eina (`tensorfold benchmark` o `strata bench run`), connecta-hi OpenCode i repeteix la tasca del pas 2. Afegeix-ho a `docs/models.md` amb una línia: les xifres que has obtingut s'assemblen a les publicades?

**Lliurable:** enllaç a l'etiqueta `t8` de `lliuraments` (commit, etiqueta i push, sessió 01, apartat 17), amb `docs/models.md`: la comparativa i la conclusió.
