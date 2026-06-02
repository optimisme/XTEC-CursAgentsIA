# Nomenclatura IAs

Definicions a conèixer:

---

## Programació amb IA

| Terme | Significat |
| --- | --- | --- |
| **Vibe coding** | Programar amb IA fiant-se del resultat que ha deixat el model. |
| **Agentinc Engineering** | Spervisar la feina dels agents, entenent el resultat. |


## Conceptes d'agents

| Terme | Significat | Exemple al curs |
| --- | --- | --- |
| **Agent** | Sistema que usa un model, context i eines per avançar cap a un objectiu. | OpenCode modificant codi i executant tests. |
| **Subagent** | Agent secundari especialitzat en una part de la tasca. | Un subagent revisor o explorador. |
| **Objectiu** | Resultat que l'agent ha d'aconseguir. | "Afegeix localStorage i valida que funciona." |
| **Criteri de finalització** | Condició que indica quan la tasca està acabada. | Tests verds, app carregant o revisió completada. |
| **Context** | Informació que el model té disponible en aquell moment. | Missatge de l'usuari, fitxers, errors i instruccions. |
| **Context engineering** | Disseny del context perquè l'agent treballi millor. | Donar-li només els fitxers i regles rellevants. |
| **Harness** | Entorn que envolta l'agent: eines, permisos, logs i validacions. | `AGENTS.md`, tools, MCPs i tests del projecte. |
| **Memòria** | Informació persistent que pot orientar sessions futures. | Preferències, decisions i errors recurrents. |
| **RAG** | Recuperar documents i posar fragments rellevants al context. | Cercar documentació abans de respondre. |
| **Planificació** | Decidir els passos abans d'actuar. | Llegir codi, editar, provar i resumir. |
| **Observació** | Resultat que rep l'agent després d'una acció. | Sortida d'un test o error de terminal. |
| **Correcció** | Ajustar el pla quan apareix informació nova. | Arreglar el codi després d'un test fallit. |

---

## Peces d'OpenCode

| Terme | Significat | Exemple al curs |
| --- | --- | --- |
| **OpenCode** | Eina per treballar amb agents de programació. | Sessió de terminal dins d'un projecte. |
| **Mode Build** | Mode pensat per aplicar canvis reals. | Editar fitxers i executar ordres. |
| **Mode Plan** | Mode pensat per analitzar abans de modificar. | Proposar una estratègia sense escriure fitxers. |
| **Shell** | Execució directa de comandes dins la sessió. | `! npm test`. |
| **Command** | Instrucció reutilitzable invocada amb `/`. | `/review` o una comanda pròpia. |
| **Skill** | Instruccions especialitzades per a una tasca. | Una skill de frontend o de revisió. |
| **Tool** | Capacitat que permet fer una acció concreta. | Llegir fitxers, executar bash o cridar una API. |
| **Custom tool** | Tool creada per al projecte. | Una funció que valida o transforma dades. |
| **MCP** | Protocol per connectar agents amb eines o serveis externs. | Un servidor MCP de memòria o validació. |
| **AGENTS.md** | Fitxer amb instruccions del projecte per als agents. | Com instal·lar, provar i respectar normes locals. |
| **opencode.json** | Configuració d'OpenCode dins del projecte. | Models, providers, agents i MCPs. |
| **Sessió** | Conversa o fil de treball amb un agent. | Una tasca oberta dins d'OpenCode. |

---

## Models i servidors

| Terme | Significat | Exemple al curs |
| --- | --- | --- |
| **Model** | Xarxa neuronal que genera text o decisions. | Gemma, Qwen o Qwopus. |
| **LLM** | Model de llenguatge gran. | Un model capaç de respondre i programar. |
| **Token** | Fragment de text que el model llegeix o genera. | Paraules, parts de paraula o signes. |
| **Prompt** | Text d'entrada que rep el model. | Pregunta, instrucció o context. |
| **System prompt** | Instrucció de prioritat alta per guiar el model. | Regles de comportament i format. |
| **Provider** | Servei que ofereix accés a models. | OpenAI, Anthropic, Zen, Ollama o vLLM. |
| **Servidor local** | Procés que exposa un model des de la pròpia màquina. | vLLM escoltant al port `8000`. |
| **API OpenAI-compatible** | API que imita el format de l'API d'OpenAI. | `/v1/models` i `/v1/chat/completions`. |
| **Model servit** | Nom real del model carregat al servidor. | `google/gemma-4-31B-it`. |
| **Nom curt** | Nom pràctic que fem servir al curs. | `gemma4-31b-spark`. |
| **`active-model`** | Àlies comú exposat pels compose del curs. | OpenCode sempre crida el mateix nom. |
| **`served-model-name`** | Nom que el servidor publica cap als clients. | `--served-model-name active-model`. |
| **Context length** | Màxim de tokens que el model pot processar. | `--max-model-len 32768`. |
| **Output limit** | Màxim de tokens que pot generar la resposta. | Límit configurat a `opencode.json`. |
| **Concurrència** | Quantes peticions o seqüències pot atendre alhora. | `--max-num-seqs 4`. |
| **KV cache** | Memòria interna per reutilitzar context durant la generació. | `--kv-cache-dtype fp8`. |
| **Prefix caching** | Reutilitzar parts repetides del prompt. | Instruccions i eines iguals entre peticions. |

---

## Nomenclatura dels models

| Sigla o marca | Significat | Exemple al curs |
| --- | --- | --- |
| **B** | Milers de milions de paràmetres del model. | `31B`, `14B`, `8B`, `4B`. |
| **A4B** | En un MoE, uns 4B paràmetres actius per token. | `gemma-4-26B-A4B-it`. |
| **E4B** | Variant Gemma amb escala efectiva de 4B. | `gemma-4-E4B-it`. |
| **MoE** | *Mixture of Experts*: només s'activen alguns experts per token. | Model amb molts paràmetres totals però menys paràmetres actius. |
| **MOQ / MoQ** | Al curs, ho usem com a abreviatura de quantització mixta si cal parlar-ne. | Barrejar precisions o tècniques per reduir memòria. |
| **BF16** | Format numèric de 16 bits, sense quantització agressiva. | Models Spark grans en BF16. |
| **FP8** | Format de 8 bits per reduir memòria. | KV cache en `fp8`. |
| **AWQ** | Quantització pensada per executar models grans amb menys memòria. | `Qwen3-8B-AWQ`. |
| **BnB** | BitsAndBytes, càrrega quantitzada flexible. | `gemma4-8b` local. |
| **GGUF** | Format habitual de llama.cpp. | Models locals lleugers o CPU. |
| **Gated model** | Model que requereix acceptar condicions abans de descarregar-lo. | Alguns models de Hugging Face. |
| **Checkpoint** | Fitxers de pesos del model. | Un repositori de Hugging Face. |
| **Fine-tune** | Model ajustat a partir d'un altre model base. | Un model orientat a coding. |
| **Coder** | Model o variant entrenada per programació. | `Qwopus3.5-4B-Coder`. |
| **Instruct / it** | Model ajustat per seguir instruccions. | `gemma-4-31B-it`. |
| **Reasoning** | Capacitat o mode per resoldre problemes pas a pas. | Parser `gemma4` o `qwen3`. |
| **Tool calling** | Capacitat del model de retornar crides a eines. | `tool_calls` amb nom i arguments. |
| **Parser** | Peça que interpreta sortides especials del model. | `--tool-call-parser qwen3_coder`. |
| **Chat template** | Plantilla que dona format al prompt del model. | `tool_chat_template_gemma4.jinja`. |

---

## Frases curtes per recordar

| Frase | Idea |
| --- | --- |
| Un model respon; un agent treballa. | L'agent combina model, context i eines. |
| Més context no sempre és millor context. | El context ha de ser rellevant i verificable. |
| Una tool és una acció controlada. | Cal validar què entra i què surt. |
| Un MCP és un servidor d'eines. | Connecta agents amb capacitats externes. |
| Un subagent redueix soroll, però afegeix coordinació. | Va bé quan la tasca és gran o especialitzada. |
| La memòria orienta, no verifica. | El codi actual sempre mana. |
| La quantització estalvia memòria, però pot afectar qualitat. | Cal provar el model real amb la tasca real. |
| `active-model` és un àlies, no el model original. | El model real és el que carrega vLLM. |
| Tool calling no elimina la validació. | El servidor encara ha de comprovar arguments. |
| Un bon criteri de finalització evita iteracions infinites. | L'agent ha de saber quan parar. |

## Equivalències amb Codex i Claude

Les eines de Codex (OpenAI) i Clause (Anthropic) canvien algunes de les configuracions respecte OpenCode:

| Concepte       | OpenCode                             | Claude Code                       | Codex |
|----------------|--------------------------------------|-----------------------------------|---|
| Instruccions   | `AGENTS.md` (des de `opencode.json`) | `CLAUDE.md` o `.claude/CLAUDE.md` | `AGENTS.md` |
| Configuració   | `opencode.json`                      | `.claude/settings.json`           | `.codex/config.toml` |
| MCPs           | dins `opencode.json`                 | `.mcp.json` o `claude mcp add`    | `mcp_servers.*` dins `config.toml` |
| Skills         | `.opencode/skills/`                  | `.claude/skills/`                 | skills de Codex |
| Commands       | `.opencode/commands/`                | `.claude/commands/`.              | commands/skills segons entorn Codex |
| Subagents      | `.opencode/agents/`                  | `.claude/agents/`                 | subagents de Codex |
| Automatització | `opencode run`                       | `claude -p`                       | `codex exec` |
| Custom tools   | `.opencode/tools/*.ts/js`            | millor MCP o script               | millor MCP o script |
