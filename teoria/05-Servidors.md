<style> .images { max-width: 400px; border: 1px solid grey; padding: 4px; margin-bottom: 25px; } </style>

# Servidors locals

Un servidor local de models permet executar un model d'IA a la nostra pròpia màquina o en un servidor controlat per nosaltres, en lloc d'utilitzar només APIs externes com OpenAI, Anthropic, Google o OpenCode Zen.

La idea general és:

```text
OpenCode
  -> opencode.json
  -> provider OpenAI-compatible
  -> servidor local vLLM / Ollama / llama.cpp
  -> model descarregat localment
```

OpenCode no necessita saber com s'executa internament el model. Només necessita una URL compatible, un nom de model i una configuració dins `opencode.json`.

---

## Per què usar servidors locals?

Executar models locals pot ser útil per:

* reduir dependència de serveis externs;
* treballar amb dades que no volem enviar a tercers;
* provar models oberts de Hugging Face;
* controlar costos;
* experimentar amb quantització, context i rendiment;
* donar servei a diversos usuaris dins d'un centre o una xarxa local.

També té inconvenients:

* cal una GPU adequada si es vol bon rendiment;
* els models ocupen molt espai de disc;
* la configuració és més tècnica;
* no tots els models suporten bé tools, reasoning o context llarg;
* els errors de memòria GPU poden ser difícils d'interpretar.

---

## Opcions habituals

| Servidor | Ús principal | Avantatges | Limitacions |
| -------- | ------------ | ---------- | ----------- |
| **vLLM** | Servir models en GPU | Ràpid, escalable, bo per servidors i concurrència | Configuració més tècnica |
| **Ollama** | Executar models de manera senzilla | Molt fàcil d'instal·lar i provar | Menys flexible i més lent |
| **llama.cpp** | Executar models en format GGUF, fins i tot amb CPU | Lleuger, configurable i portable | Depen molt de la configuració |
| **LM Studio** | Interfície gràfica per provar models | Fàcil per a proves manuals | Menys adequat com a servidor |

En els exemples de servidors locals d'aquest curs es fa servir sobretot **vLLM amb Docker**, per simplicitat de desplegament.

---

## Configuració d'OpenCode

OpenCode es configura amb l'arxiu `opencode.json` a l'arrel del projecte.

En aquest curs hi ha dues configuracions separades:

| Carpeta | Ús |
| --- | --- |
| `projecteOpenCode` | Configuració normal per treballar amb models grans o proveïdors externs. Manté les eines estàndard d'OpenCode, subagents, skills i MCPs de validació. |
| `projecteOpenCodeLocal` | Configuració reduïda per a models locals petits. Té menys eines, menys instruccions i proveïdors locals vLLM. |

Els camps més importants són:

| Camp         | Funció |
| ------------ | --- |
| `model`      | Model que OpenCode utilitza per defecte |
| `provider`   | Llista de proveïdors disponibles |
| `baseURL`    | URL de l'API del servidor o proveïdor |
| `apiKey`     | Clau d'accés; en local sovint pot ser `"local"` |
| `models`     | Models que apareixeran dins OpenCode |
| `max_tokens` | Màxim de tokens de sortida configurat per al model |
| `tool_call`  | Indica que el model pot fer crides a eines |
| `reasoning`  | Indica que el model pot treballar amb mode de raonament |

El projecte normal no defineix proveïdors locals dins `opencode.json`. Està pensat perquè l'usuari triï o autentiqui el model gran que vulgui fer servir amb OpenCode. La configuració local de vLLM queda reservada per a `projecteOpenCodeLocal`, que es descriu al final d'aquest document.

Exemple de la part de configuració que sí queda al projecte normal:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "goal",
  "permission": {
    "read": "allow",
    "grep": "allow",
    "glob": "allow",
    "webfetch": "allow",
    "websearch": "allow",
    "bash": "allow",
    "edit": "allow",
    "task": "allow",
    "todowrite": "allow",
    "lsp": "allow",
    "skill": "allow"
  },
  "mcp": {
    "html-check": {
      "type": "local",
      "command": ["node", ".opencode/mcp/html-check/server.js"],
      "enabled": true
    },
    "java-check": {
      "type": "local",
      "command": ["node", ".opencode/mcp/java-check/server.js"],
      "enabled": true
    }
  }
}
```

---

## vLLM

**vLLM** és un motor d'inferència per servir models de llenguatge. Un servidor vLLM normalment s'aixeca amb una ordre de l'estil:

```bash
vllm serve Qwen/Qwen3-8B-AWQ \
  --served-model-name qwen3-8b-local \
  --host 0.0.0.0 \
  --port 8000
```

El paràmetre més important per a OpenCode és:

```bash
--served-model-name qwen3-8b-local
```

Aquest és el nom que després s'ha de fer servir a `opencode.json`.

Per comprovar que vLLM respon:

```bash
curl http://127.0.0.1:8000/v1/models
```

Si retorna una llista de models, OpenCode ja pot intentar connectar-s'hi.

---

## vLLM amb Docker

En aquests exemples, vLLM s'executa amb Docker Compose. Això evita haver d'instal·lar manualment totes les dependències de Python, CUDA i vLLM a la màquina principal.

Un `docker-compose` de vLLM sol tenir aquestes parts:

| Part               | Funció |
| ------------------ | ------ |
| `image`            | Imatge Docker de vLLM |
| `container_name`   | Nom del contenidor |
| `environment`      | Variables d'entorn |
| `volumes`          | Cache de Hugging Face, cache de vLLM i secrets |
| `ports`            | Publica el port local, normalment `8000` |
| `healthcheck`      | Comprova si `/v1/models` respon |
| `deploy.resources` | Dona accés a la GPU NVIDIA |
| `command`          | Ordre `vllm serve ...` amb el model i paràmetres |

Fragment simplificat:

```yaml
services:
  qwen-vllm:
    image: vllm/vllm-openai:latest
    container_name: qwen3_8b_awq_vllm
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    command:
      - |
        exec vllm serve Qwen/Qwen3-8B-AWQ \
          --served-model-name qwen3-8b-local \
          --host 0.0.0.0 \
          --port 8000
```

Els fitxers del projecte són:

| Fitxer                                 | Model |
| -------------------------------------- | --- |
| `docker/docker-compose-gemma4-8b.yml`  | `google/gemma-4-E4B-it` |
| `docker/docker-compose-gemma4-8b-spark.yml` | `google/gemma-4-E4B-it`, optimitzat per NVIDIA Spark / GB10 |
| `docker/docker-compose-qwen3-8b.yml`   | `Qwen/Qwen3-8B-AWQ` |
| `docker/docker-compose-qwen3-14b.yml`  | `Qwen/Qwen3-14B-AWQ` |
| `docker/docker-compose-qwen35-9b.yml`  | `QuantTrio/Qwen3.5-9B-AWQ` |
| `docker/docker-compose-qwen36-27b.yml` | `Qwen/Qwen3.6-27B` |

El model de 27B està pensat per a màquines amb més VRAM. En una GPU petita, normalment no cabrà.

---

## Script per reiniciar models

El projecte inclou l'script:

```bash
docker/run_docker.sh
```

Serveix per arrencar, parar, reiniciar i consultar logs dels contenidors vLLM sense haver d'escriure cada vegada l'ordre completa de Docker Compose.

Exemples:

```bash
./docker/run_docker.sh
./docker/run_docker.sh gemma4-8b
./docker/run_docker.sh qwen3-8b restart
./docker/run_docker.sh qwen3-14b logs
./docker/run_docker.sh qwen3-8b stop
./docker/run_docker.sh qwen3-8b ps
```

Per defecte, l'script arrenca `gemma4-8b` i atura els altres contenidors coneguts abans d'iniciar el nou model.

Això és important perquè diversos models poden intentar usar el mateix port `8000` o la mateixa GPU. Amb aquest script només es pot executar un model.

L'script també permet veure fàcilment els logs del docker, i veure si funciona correctament (o ha fallat):

```bash
./docker/run_docker.sh gemma4-8b logs
```

La sortida és tipus:

```text
./run_docker.sh gemma4-8b logs
(APIServer pid=1) INFO 05-25 17:42:02 [utils.py:299] 
(APIServer pid=1) INFO 05-25 17:42:02 [utils.py:299]        █     █     █▄   ▄█
(APIServer pid=1) INFO 05-25 17:42:02 [utils.py:299]  ▄▄ ▄█ █     █     █ ▀▄▀ █  version 0.19.1
(APIServer pid=1) INFO 05-25 17:42:02 [utils.py:299]   █▄█▀ █     █     █     █  model   google/gemma-4-E4B-it
(APIServer pid=1) INFO 05-25 17:42:02 [utils.py:299]    ▀▀  ▀▀▀▀▀ ▀▀▀▀▀ ▀     ▀
(APIServer pid=1) INFO 05-25 17:42:02 [utils.py:299] 
(APIServer pid=1) INFO 05-25 17:42:02 [utils.py:233] non-default args:
```

---

## Hugging Face i tokens

Molts models es descarreguen des de **Hugging Face**. El nom del model té forma d'identificador:

```text
organització/model
```

Per exemple:

```text
Qwen/Qwen3-8B-AWQ
google/gemma-4-E4B-it
```

Alguns models són oberts i es poden descarregar directament. Altres són **gated models**: cal acceptar les condicions a Hugging Face i usar un token.

En aquest projecte, els `docker-compose` esperen un fitxer:

```text
docker/tokens.env
```

amb una variable d'entorn per al token de Hugging Face.

Exemple de format:

```bash
HUGGINGFACE=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Nota:** No s'ha de publicar mai un token real dins del repositori. Si un token s'ha compartit per error, cal revocar-lo i generar-ne un de nou.

---

## Models i formats

No tots els servidors locals fan servir el mateix format de model.

| Servidor      | Formats habituals | Comentari |
| ------------- | --- | --- |
| **vLLM**      | Models Hugging Face, AWQ, alguns GPTQ. | Ideal per servir models grans en GPU |
| **Ollama**    | Empaquetats per Ollama, sovint basats en GGUF | Molt senzill per instal·lar |
| **llama.cpp** | GGUF | Molt portable, pot funcionar amb CPU o GPU |
| **MLX**       | Models convertits a format MLX | Optimitzat per Apple Silicon |

---

## Quantització

La **quantització** redueix la memòria necessària per executar un model. A canvi, pot reduir una mica la qualitat o limitar algunes capacitats.

| Tipus | Ús | Avantatge | Cost |
| --- | --- | --- | --- |
| `BF16` / `FP16` | Models sense quantitzar o gairebé sense quantitzar | Més qualitat | Molta VRAM |
| `AWQ` | Models quantitzats per GPU | Bon equilibri entre qualitat i memòria | Pot requerir configuració específica |
| `bitsandbytes` | Càrrega quantitzada flexible | Ajuda quan el model no cap complet | Pot ser més lent |
| `GGUF Q4/Q5/Q8` | llama.cpp i Ollama | Molt portable | Qualitat variable segons quantització |
| `kv-cache-dtype fp8` | Cache de context en vLLM | Redueix memòria amb contexts llarg | Pot afectar la qualitat |
| `MLX` / `MLX quantized` | Apple Silicon | Optimitzat per Mac | Específic d'Apple |

Com a regla pràctica:

* Més paràmetres solen donar més capacitat, però demanen més VRAM;
* Més context consumeix més memòria;
* Més usuaris o més seqüències simultànies consumeixen més memòria;
* La quantització permet encabir models més grans en GPUs més petites.

---

## Paràmetres importants de vLLM

| Paràmetre | Funció |
| --- | --- |
| `--served-model-name` | Nom que exposa el servidor |
| `--max-model-len` | Longitud màxima de context |
| `--gpu-memory-utilization` | Percentatge de VRAM que vLLM pot usar |
| `--quantization` | Tipus de quantització |
| `--kv-cache-dtype` | Format de la cache de context |
| `--max-num-seqs` | Nombre de seqüències simultànies |
| `--max-num-batched-tokens` | Tokens màxims processats en batch |
| `--enable-auto-tool-choice` | Permet tool calling automàtic |
| `--tool-call-parser` | Parser de crides a tools |
| `--reasoning-parser` | Parser per models amb raonament |
| `--trust-remote-code` | Permet codi personalitzat del model |

Cal ajustar aquests paràmetres segons la GPU i el model. Si el servidor falla per memòria, normalment cal baixar:

* `--max-model-len`;
* `--gpu-memory-utilization`;
* `--max-num-seqs`;
* `--max-num-batched-tokens`;
* o usar un model més petit o més quantitzat.

> **Nota:** En servidors locals convé prioritzar estabilitat. Un context de 32K pot ser útil, però cal ajustar la sortida màxima al client segons el model i la VRAM disponible.

### Optimització per concurrència

Les configuracions Docker actuals activen dues opcions importants per millorar el comportament amb OpenCode i diversos usuaris o subagents:

```bash
--max-num-batched-tokens 2048
--enable-prefix-caching
```

`--max-num-batched-tokens 2048` deixa que vLLM agrupi més tokens dins d'un mateix batch. Això ajuda quan hi ha més d'una petició en marxa, perquè el servidor pot aprofitar millor la GPU en lloc de processar les peticions de manera massa serialitzada.

`--enable-prefix-caching` permet reutilitzar parts repetides del prompt. En agents com OpenCode això és útil perquè moltes peticions comparteixen context: instruccions del sistema, configuració del projecte, eines disponibles o fragments inicials de conversa. Si el prefix es pot reaprofitar, baixa el cost de processar peticions semblants.

En una GPU de **16GB de VRAM**, una configuració conservadora pot ser:

```bash
--max-model-len 32768
--max-num-seqs 2
--max-num-batched-tokens 2048
--enable-prefix-caching
```

Això busca un equilibri: prou context per treballar amb projectes reals, dues seqüències simultànies per suportar concurrència bàsica, i un batch prou gran per evitar que el servidor es quedi infrautilitzat. Pujar aquests valors pot millorar la concurrència, però també pot provocar errors de VRAM.

### Variant NVIDIA Spark / GB10

La màquina NVIDIA Spark té més marge que una GPU de 16GB, per això té una configuració separada:

```bash
--dtype bfloat16
--gpu-memory-utilization 0.90
--max-num-seqs 4
--max-num-batched-tokens 4096
--enable-prefix-caching
```

La diferència principal és que Spark pot acceptar més seqüències simultànies i un batch de tokens més gran. Això permet atendre millor diversos usuaris d'OpenCode alhora.

També es manté una imatge Docker específica i una configuració pròpia:

```text
docker/docker-compose-gemma4-8b-spark.yml
```

No és només una còpia del compose de 16GB: està pensada per aprofitar millor el maquinari Spark, amb `bfloat16`, més utilització de GPU i més concurrència. Per això convé mantenir-la separada de `docker/docker-compose-gemma4-8b.yml`.

---

## Ollama

**Ollama** és una opció molt senzilla per executar models locals.

Exemple:

```bash
ollama pull llama3.1:8b
ollama run llama3.1:8b
```

Ollama també exposa una API local. En molts entorns es pot connectar amb clients OpenAI-compatible, però cal comprovar l'endpoint concret disponible.

Una configuració d'OpenCode podria seguir aquest patró:

```json
{
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama local",
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1",
        "apiKey": "local"
      },
      "models": {
        "llama3.1:8b": {
          "name": "Llama 3.1 8B"
        }
      }
    }
  }
}
```

Ollama és molt pràctic per començar, però dona menys control fi que vLLM sobre paràmetres com batches, parsers de tool calling o optimitzacions de servidor.

---

## llama.cpp

**llama.cpp** és un projecte molt eficient per executar models en format `GGUF`.

Pot funcionar amb CPU, GPU o una combinació de totes dues, segons com s'hagi compilat i segons el maquinari disponible.

Exemple conceptual:

```bash
llama-server \
  -m models/model-Q4_K_M.gguf \
  --host 0.0.0.0 \
  --port 8080
```

El seu punt fort és la portabilitat. El seu punt feble és que no tots els fluxos avançats d'agents, tool calling o reasoning funcionen igual que en servidors més orientats a API OpenAI-compatible.

---

## projecteOpenCodeLocal: configuració per a models petits

`projecteOpenCodeLocal` és la configuració pensada per treballar amb models locals més petits, com Gemma 8B servit amb vLLM. No és la configuració normal del projecte: és una variant reduïda perquè el model rebi menys soroll d'instruccions i eines.

La configuració lite redueix deliberadament el context de l'agent:

* `default_agent`: `"goal-lite"`;
* permisos denegats: `bash`, `edit`, `task`, `todowrite`, `lsp` i `skill`;
* instruccions carregades: només `AGENTS.md`;
* MCPs essencials: `safe-edit` i `html-check`.

Els proveïdors locals viuen en aquesta carpeta:

| Provider | Endpoint |
| --- | --- |
| `spark-vllm` | `http://127.0.0.1:8001/v1` |
| `vram16-vllm` | `http://127.0.0.1:8002/v1` |

El límit `"max_tokens": 4096` i el plugin `.opencode/plugins/limit-local-vllm-output.js` són proteccions per a models petits. Eviten que OpenCode demani respostes massa grans i deixi poc marge per al prompt d'entrada. Aquestes proteccions no formen part de `projecteOpenCode`.

`safe-edit` també pertany a aquesta variant: dona eines d'edició per línies perquè els models petits solen ser menys fiables amb edicions exactes basades en `oldString`.

La documentació humana de `projecteOpenCodeLocal` no s'inclou automàticament al context de l'agent: `opencode.json` només carrega `AGENTS.md` dins `instructions`.
