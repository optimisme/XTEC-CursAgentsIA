<style> .images { max-width: 400px; border: 1px solid grey; padding: 2px; } </style>

# Harness engineering

**Harness engineering** és dissenyar tot l’entorn que envolta l’agent perquè treballi bé. 

Inclou eines, permisos, context, validacions, logs, tests, límits i fluxos de treball. 

El *Harness engineering* impulsa el *context del projecte*, és a dir, inclou la informació que l’agent d’IA té disponible per respondre o actuar dins d’un projecte. 

Pel què fa al context, a OpenCode pot incloure:

* L’historial recent de la conversa.
* Instruccions del projecte, com agents.md.
* Fitxers que l’agent ha llegit o que li hem indicat amb @.
* Resultats de comandes executades en mode shell.
* Resums generats amb /compact.
* Informació rellevant del codi, estructura o configuració del projecte.

## agents.md

És un fitxer de context del projecte per als agents d’IA. La transcripció el descriu com una mena de “README per a la intel·ligència artificial”: serveix per explicar al model com és el projecte i quines decisions ha de respectar.

**Evita repetir sempre les mateixes instruccions** al prompt. 

Forma part del context, i per tant és millor que sigui compacte.

Ha de contenir:

* **Workflow**: Passos que ha de seguir l’agent abans, durant i després de fer una tasca.
* **Stack**: Tecnologies que fa servir el projecte i limitacions tècniques.
* **Architecture**: Organització del projecte i responsabilitat de cada fitxer.
* **OpenCode**: Agents, skills, commands i tools disponibles per ajudar l’agent.
* **Rules**: Normes generals que l’agent ha de respectar sempre.

Exemple:

```text
# Project Guidelines

## Workflow

Before architectural changes, read `docs/architecture.md` and `docs/decisions.md`.

Before starting work, check `tasks/pending.md`.

After finishing work, update `tasks/done.md` and `tasks/pending.md`.

## Stack

HTML, CSS and vanilla JavaScript only.

No frameworks, no npm dependencies, no build step.

Use `bun run dev` to start the development server. Do not use `node` unless explicitly requested.

## Architecture

- `index.html`: main structure.
- `styles.css`: visual styles.
- `app.js`: application logic.

## OpenCode

- Agents are in `.opencode/agents/`.
- Skills are in `.opencode/skills/`.
- Commands are in `.opencode/commands/`.
- Tools are in `.opencode/tools/`.

Available agents: `reviewer`, `frontend-designer`, `accessibility`, `responsive`, `performance`, `security`, `seo`.

Use the matching skill for each agent: `code-review`, `frontend-design`, `accessibility`, `responsive`, `performance`, `security`, `seo`.

Available command: `supercommit`.

Available tool: `search-students`.

## Rules

Keep the project simple. Do not add external dependencies. Ask before changing the architecture. Prefer small, focused changes.
```

## Elements del context

| Element | Què és | Exemple |
|---|---|---|
| **Skill** | Coneixement o instruccions | “Com revisar seguretat” |
| **Agent** | Perfil que fa una tasca | `security`, `reviewer`, `frontend-designer` |
| **Command** | Prompt reutilitzable | `/supercommit`, `/fix-tests` |
| **Tool** | Acció executable | llegir fitxers, executar `bash`, consultar una API |

# Skills (habilitats)

Una **skill** serveix per donar a l’agent més experiència en una tasca específica. Normalment és contingut en Markdown amb instruccions, criteris i bones pràctiques.

Per exemple, potser el model sap programar React, però no coneix bé les bones pràctiques d’una versió concreta o d’una llibreria determinada. Amb una skill li dones aquest context extra.

Cal posar les *skills* segons aquesta estructura:

```bash
# .opencode/skills/<nom-skill>/SKILL.md
projecte/
└── .opencode/
    └── skills/
        └── seo/
            └── SKILL.md
```

Teniu divversos exemples de skills en aquest mateix projecte.

## autoskills

Hi ha eines que permeten instal·lar automàticament les skills segons cada projecte:

```bash
npx autoskills@latest
```

# Agents

La transcripció diferencia entre **agents principals** i **subagents**.

## Agents principals

OpenCode té dos agents principals visibles:

| Agent     |  Funció                                  |
| --------- | ---------------------------------------- |
| **Plan**  | Per analitzar i planificar sense editar. |
| **Build** | Per desenvolupar i modificar fitxers.    |

* **Build** té accés a escriure al disc
* **Plan** serveix per explorar el projecte

> **Nota:** Hi ha altres agents interns, com `compact`, `title` i `resume`, però no són agents que l’usuari utilitzi directament. 

## Subagents

Els **subagents** són agents secundaris especialitzats que poden treballar en una tasca concreta sense bloquejar necessàriament el fil principal.

| Subagent     | Ús                                        |
| ------------ | ----------------------------------------- |
| **Explore**  | Explorar una part concreta del projecte.  |
| **General**  | Investigar una qüestió més oberta.        |
| **Reviewer** | Revisar codi sense modificar-lo.          |
| **Security** | Revisar possibles problemes de seguretat. |

Per exemple, `Explore` pot buscar quines custom properties de CSS hi ha al projecte, mentre que `General` pot investigar com afegir tests d’integració sense trencar res. 

Es pot demanar a OpenCode que activi els subagents a través del prompt:

```text
Use the Security subagent to review possible security issues.
```

```text
Use the Explore subagent to find the project’s CSS variables.
```

## Agents propis

Podem crear agents propis dins del projecte. Per exemple, un agent de seguretat o un agent revisor de codi. Aquests agents poden tenir una descripció, un mode, un model concret, temperatura i permisos específics. 

Exemple:

```txt
.opencode/
└── agents/
    ├── reviewer.md
    └── security.md
```

La idea principal és **dividir el treball**. En comptes de tenir un únic agent fent-ho tot, pots encarregar tasques diferents a subagents diferents:

* un busca CSS
* un revisa rendiment
* un revisa seguretat
* un revisa canvis pendents
* l’agent principal espera els resultats i prepara un pla consolidat

Això permet executar investigacions en paral·lel i després fer que l’agent principal actuï com a orquestrador. 

La capçalera dels agents pròpis, pot incloure els permisos que té l'agent sobre l'eina de comandes *'bash'*:

```text
---
description: Review frontend and backend code for basic security issues.
mode: subagent
permission:
  edit: deny
  bash:
    "git status*": allow
    "git diff*": allow
    "grep*": allow
    "rg*": allow
    "*": ask
---
```

## Agents vs Skills

- La skill és el manual.
- L’agent és la "persona" que fa la feina.

| Element              | Què és                    | Per a què serveix                                              |
| -------------------- | ------------------------- | -------------------------------------------------------------- |
| **Skill `security`** | Coneixement especialitzat | Explica **com revisar seguretat**                              |
| **Agent `security`** | Treballador especialitzat | Fa la feina de **revisar seguretat** amb uns permisos concrets |

Per donar coneixement a l'agent sobre la skill, pot contenir una instrucció de l'estil:

```text
Read and apply the security skill located at @.opencode/skills/security/SKILL.md.
```

---
> **Nota:** Fixeu-vos que els noms dels agents i les skills no tenen que coincidir, sinó complementar-se:

**frontend-designer** vs *frontend-design*

```bash
.opencode/agents/frontend-designer.md
.opencode/skills/frontend-design/skill.md 
```

# Comandes

L'agent **"Build"** de OpenCode, té accés a la linia de comandes. Però OpenCode permet executar ordres directament, apuntant l'execució a l'historial de conversa.

És més recomanable fer:

```bash
! git status
```

Que no pas demanar al prompt:

```text
executa git status
```

## Comandes personalitzades

Les comandes que s'han d'executar diverses vegades, es poden definir en arxius *markdown* dins de **"commands"**.

Per exemple, enlloc d'anar demanant:

```text
review changes, group them into commits and then push
```

Millor definir una comanda:

```bash
# .opencode/skills/<nom-skill>/SKILL.md
projecte/
└── .opencode/
    └── commands/
        └── supercommit.md
```

Aleshores per executar la comanda, només cal:

```text
/supercommit
```

O també amb instruccions:

```text
/supercommit write commit messages in Catalan
```

Els arxius de comandes personalitzades cal que tinguin una petita descripció, i les instruccions:

```text
---
description: Short description of the command
---

Additional user context:
$ARGUMENTS

## Goal

Explain clearly what this command must achieve.

## Steps

1. First step.
2. Second step.
3. Third step.

## Rules

- Important restriction.
- Important security rule.
- What the agent must not do.

## Output

At the end, summarize:
- what was checked;
- what was changed;
- what still needs attention.
```

- Comandes personalitzades
- Comandes globals i comandes de projecte
- Ús de opencode run
- Ús de opencode serve
- OpenCode Web

## 'opencode run' (taskes automatitzades)

L'ús de comandes personalitzades permet automatizar OpenCode per fer tasques repetitives.

**run** és útil quan vols fer servir OpenCode com una eina de línia de comandes, no com un xat interactiu.

```bash
opencode run /supercommit
```

Executaria el supercommit com una instrucció intel·ligent.

Altres exemples d'eines personalitzades útils, que caldria personalitzar segons cada projecte:

| Comanda             | Ús                                               |
| ------------------- | ------------------------------------------------ |
| `/security`         | Busca problemes de seguretat                     |
| `/explain`          | Explica l’arquitectura del projecte              |
| `/tests`            | Analitza tests fallits i proposa solucions       |
| `/fix-tests`        | Intenta corregir tests fallits                   |
| `/docs`             | Genera o millora documentació                    |
| `/frontend-review`  | Revisa accessibilitat, responsive i UX           |
| `/clean`            | Busca fitxers sobrants, codi mort o dependències |
| `/teacher-exercise` | Genera un exercici docent a partir del projecte  |


# Tools (eines)

Les **tools** són les capacitats que permeten a l’agent fer accions reals sobre el projecte: llegir fitxers, escriure codi, executar comandes, cercar informació o cridar eines externes.

OpenCode ja incorpora eines internes com `read`, `write`, `bash`, `websearch`, `todowrite` o `question`. Aquestes eines permeten que l’agent actuï dins del projecte, no només que respongui text. 

Per exemple, `bash` permet executar ordres com `git status`, `npm test` o `bun run dev`; `todowrite` permet organitzar tasques complexes, i `question` permet que l’agent pregunti a l’usuari quan necessita una decisió.

## Eines integrades

Algunes eines habituals són:

| Tool | Ús |
|---|---|
| `read` | Llegir fitxers del projecte |
| `write` | Crear o substituir fitxers |
| `edit` | Modificar parts concretes d’un fitxer |
| `bash` | Executar comandes de terminal |
| `grep` / `glob` | Buscar text o fitxers |
| `todowrite` | Crear una llista interna de passos |
| `websearch` | Cercar informació externa |
| `question` | Fer preguntes a l’usuari durant una tasca |

La idea principal és que el model no “sap” automàticament què hi ha dins del projecte: ho descobreix usant eines.

Per exemple:

```text
Revisa els tests fallits i proposa una solució.
````

Això pot fer que l’agent utilitzi eines com:

```text
read       -> mirar fitxers
bash       -> executar tests
grep/glob  -> buscar funcions o classes
edit       -> modificar el codi
```

## Custom tools

OpenCode permet crear **custom tools**. Són funcions pròpies que l’agent pot cridar durant una conversa. Es defineixen amb TypeScript o JavaScript, però poden executar scripts escrits en altres llenguatges.

Estructura típica:

```bash
projecte/
└── .opencode/
    └── tools/
        └── search-student.ts
```

Exemple senzill:

```ts
import { tool } from "@opencode-ai/plugin"
import Database from "better-sqlite3"

export default tool({
  description: "Search students in the local SQLite database",
  args: {
    name: tool.schema.string().describe("Student name to search"),
  },

  async execute(args) {
    const db = new Database("data/school.db", { readonly: true })

    const rows = db
      .prepare(`
        SELECT id, name, email, group_name
        FROM students
        WHERE name LIKE ?
        LIMIT 10
      `)
      .all(`%${args.name}%`)

    db.close()

    return JSON.stringify(rows, null, 2)
  },
})
```

Per fer-la servir:

```text
Busca a la base de dades els alumnes que es diuen Marc.
```

O també:

```text
Fes servir la tool search-student per buscar alumnes amb el nom "Marc".
```

## Quan té sentit crear una tool pròpia?

No cal crear una tool per a qualsevol cosa. Té sentit quan l’agent ha de fer una acció molt concreta i repetitiva que no queda ben resolta amb `bash` o amb una comanda personalitzada.

Exemples útils:

| Tool pròpia        | Ús                                             |
| ------------------ | ---------------------------------------------- |
| `database`         | Consultar una base de dades local del projecte |
| `validate_schema`  | Validar JSON, YAML o configuracions pròpies    |
| `deploy_preview`   | Crear un desplegament de prova                 |
| `issue_tracker`    | Consultar tasques d’un sistema extern          |

## Custom command vs custom tool

És fàcil confondre **custom commands** i **custom tools**.

| Element            | Serveix per                                 | Exemple            |
| ------------------ | ------------------------------------------- | ------------------ |
| **Custom command** | Donar instruccions reutilitzables a l’agent | `/supercommit`     |
| **Custom tool**    | Afegir una acció nova executable            | `query_database()` |

Una **command** és com una plantilla de prompt.

Una **tool** és com una funció que l’agent pot cridar.

Per exemple, `/supercommit` podria ser una command que diu:

```text
Analitza els canvis, agrupa'ls en commits i fes commit.
```

Però una tool podria ser:

```text
Consulta la base de dades del projecte i retorna els usuaris de prova.
```

