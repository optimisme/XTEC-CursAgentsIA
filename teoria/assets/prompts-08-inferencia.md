# Prompts · Sessió 08 · Servidors d'inferència

Prompts de [08 - Servidors d'inferència](../08%20-%20Servidors%20d'inferència.md), en ordre i preparats per copiar i enganxar.

**Com fer-los servir**

- Els blocs `text` van a **OpenCode**, obert dins la carpeta `lliuraments`. Els blocs `bash` van al **terminal**.
- Enganxa **un prompt cada vegada** i revisa el resultat abans del següent.
- La part 2 de la lliçó (vLLM, Docker, proxy) és una demostració del professor: no té prompts. Aquí només hi ha la tasca T8.

---

## Tasca T8 · Projecte «Lliuraments»

Al repositori `lliuraments`.

### T8.2 · Model local (terminal)

Amb Ollama, descarrega un model i arrenca'l amb un context de 32k (atura abans el servei d'Ollama si ja està en marxa). Canvia `<MODEL_LOCAL>` per un model de [ollama.com/library](https://ollama.com/library) que hi càpiga a la teva màquina (secció 3 de la lliçó), millor un MoE com Qwen3.6 35B A3B si tens 32 GB o més:

```bash
ollama pull <MODEL_LOCAL>
OLLAMA_CONTEXT_LENGTH=32768 ollama serve
```

Sense accés al proxy del curs, descarrega també un model petit (per exemple `granite4.1:3b`, el de la sessió 03) i compara'ls tots dos.

### T8.3 · El proveïdor local a `opencode.json`

El proveïdor del proxy (`ieti-agents`) ja és a la configuració global des de la sessió 01: no el repeteixis al projecte. Canvia `<MODEL_LOCAL>` pel model que has descarregat.

```text
Afegeix a l'opencode.json d'aquest projecte un proveïdor compatible amb OpenAI que es digui local, amb el mateix format que el proveïdor ieti-agents de la meva configuració global d'OpenCode (~/.config/opencode/opencode.json). Si fas servir el format d'OpenCode 2 (providers), posa les capacitats a capabilities (tools, input, output i reasoning), no amb les claus antigues tool_call i reasoning.
- local: Ollama a http://127.0.0.1:11434/v1, model <MODEL_LOCAL>, limit.context 32768 i limit.output 8192. No necessita clau.
No afegeixis ni modifiquis el proveïdor ieti-agents: ja és a la configuració global. Conserva la resta de configuració d'opencode.json.
```

Reinicia OpenCode i comprova que a `/models` surten el model del proxy (`ieti-agents`) i el local.

### T8.4 · La tasca de prova

```text
Afegeix a docs/tasks.json una tasca nova, amb el següent número lliure i el mateix format que les altres: "Afegir el total de lliuraments tard a la capçalera de la web". Ha de tenir criteris d'acceptació i un test a npm test. No la implementis.
Fes un commit amb el missatge "chore: add model comparison task".
```

### T8.5 · Una branca per model (terminal)

```bash
git switch -c prova-curs
```

Tria el model del proxy (`ieti-agents/active-model`) a OpenCode (`/models`) i executa `/next-task`. Anota el temps aproximat i els intents. Després, des del mateix commit de partida:

```bash
git switch main
git switch -c prova-local
```

Tria el model `local` i torna a executar `/next-task`. Al final:

```bash
git switch main
opencode stats --days 1 --models
```

### T8.6 · `docs/models.md`

Canvia les dades entre `< >` per les que has anotat.

```text
Crea docs/models.md amb una taula comparativa dels models que he provat, amb aquestes columnes: model, servidor, paràmetres i quantització, context configurat, tokens consumits, temps aproximat, tests a la primera (sí/no) i intents.
Treu els tokens de la sortida d'opencode stats --days 1 --models i els paràmetres i el context d'opencode.json. Les altres dades són aquestes: <DADES_DE_CADA_PROVA>.
Acaba amb una secció ## Conclusió de tres línies: quin model faries servir per a tasques complexes, quin per a tasques petites i repetitives, i per què.
```

**Comprova-ho:** les xifres coincideixen amb el que has vist i la conclusió és teva. Corregeix-la a mà si cal.

### T8.7 · Opcional · KV cache al servidor del curs

Si tens accés als logs del servidor, copia les dues línies (*Model loading took … GiB* i *Available KV cache memory*) i el `config.json` del model:

```text
Amb aquestes dues línies del log de vLLM i el config.json del model, calcula quants tokens de context caben a la KV cache amb la fórmula KV per token = 2 × capes × caps KV × dimensió per cap × bytes per valor. Fes servir 1 byte per valor (KV cache fp8) i només les capes d'atenció completa. Mostra els passos i afegeix el resultat a docs/models.md en una secció ## KV cache.
<LÍNIES_DEL_LOG>
```

### T8.8 · Opcional · TensorFold o Strata

Fes servir **només una** de les dues opcions, segons la teva màquina.

**TensorFold** (Mac amb Apple Silicon o DGX Spark):

```bash
brew install ashhart/tensorfold/tensorfold
tensorfold pull mlx-community/Qwen3.5-2B-MLX-4bit@93760be4f1f69842a46bc13dbdc0f19e291392a3
tensorfold serve mlx-community/Qwen3.5-2B-MLX-4bit --name local-model --context 8192 --no-thinking
```

En un altre terminal, `tensorfold benchmark`. Amb més memòria, prova un model més gran de la llista de models qualificats del README.

**Strata** (gràfica de 12 GB o més, 64 GB de RAM i uns 80 GB de disc lliure):

```bash
curl -fsSL --connect-timeout 15 --max-time 120 \
  https://github.com/Niko1221/Strata/releases/latest/download/install.sh -o install.sh
sh install.sh
strata launch --plan --family qwen --model q2_0
strata launch --family qwen --model q2_0 --yes --no-tui
strata bench run
strata connect opencode
```

Revisa el que mostra `--plan` abans de descarregar res. `strata connect opencode` només mostra la configuració; no facis servir `--write`, que tocaria la configuració global.

Després, a OpenCode:

```text
Afegeix a l'opencode.json d'aquest projecte un tercer proveïdor compatible amb OpenAI, rapid, a http://127.0.0.1:8080/v1, amb el mateix format que els altres dos. Fes servir el nom del model, el context i les capacitats que surten a continuació. Conserva la resta de configuració.
<SORTIDA_DE_STRATA_CONNECT_O_NOM_DEL_MODEL_DE_TENSORFOLD>
```

Reinicia OpenCode, repeteix el pas T8.5 amb una branca `prova-rapid` i afegeix una fila a la taula de `docs/models.md` i una línia: les xifres que has obtingut s'assemblen a les publicades?

### T8.9 · Commit, etiqueta i push

```text
Fes un commit amb docs/models.md i opencode.json (sense .rag/ ni .secrets/) amb el missatge "docs: model comparison", crea l'etiqueta t8 i fes push de la branca main i de les etiquetes.
```
