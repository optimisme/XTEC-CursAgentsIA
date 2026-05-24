<style> .images { max-width: 400px; border: 1px solid grey; padding: 4px; margin-bottom: 25px; } </style>

# Custom tools

OpenCode permet crear **custom tools**: funcions pròpies que l’agent pot cridar durant una conversa, igual que pot cridar eines internes com `read`, `write` o `bash`.

Una custom tool no és només una comanda de terminal. És una **funció registrada dins d’OpenCode**, amb:

- una descripció
- uns arguments esperats
- una funció `execute()`
- un resultat de retorn

OpenCode decideix quan la pot fer servir segons el nom, la descripció i els arguments definits.

---

## On es defineixen?

Les custom tools es poden definir dins del projecte:

```bash
projecte/
└── .opencode/
    └── tools/
        └── code-stats.ts
````

O bé globalment per a tots els projectes:

```bash
~/.config/opencode/tools/
```

Les eines locals del projecte són les més recomanables quan depenen de l’estructura, scripts o dades d’un projecte concret.

---

## Estructura bàsica d’una custom tool

OpenCode espera que cada fitxer de `.opencode/tools/` exporti una eina vàlida.

La forma recomanada és aquesta:

```ts
export default tool({
  description: "...",
  args: {
    ...
  },
  async execute(args, context) {
    try {
      return "Tool result"
    } catch (error) {
      return `Tool error: ${String(error)}`
    }
  }
})
```

Els camps principals són:

| Símbol        | Funció                                          |
| ------------- | ----------------------------------------------- |
| `description` | Explica quan hauria d’utilitzar aquesta eina    |
| `args`        | Defineix quins paràmetres accepta la tool       |
| `execute()`   | Codi que s’executarà quan l’agent cridi la tool |
| `context`     | Informació de la sessió actual                  |

Use the search-notes tool to search the word "database" with case sensitive enabled.

Els arguments es defineixen amb `tool.schema`, que funciona com un esquema de validació. 

Exemple amb dos arguments:

```ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Search a word inside project notes",
  args: {
    word: tool.schema.string().describe("Word to search"),
    caseSensitive: tool.schema.boolean().describe("Use case-sensitive search"),
  },
  async execute(args, context) {
    try {
      return `Searching ${args.word} in ${context.worktree}`
    } catch (error) {
      return `Tool error: ${String(error)}`
    }
  }
})
```

Per exectuar la tool anterior amb els arguments:

```text
Use the search-notes tool to search the word "database" with case sensitive enabled.
```

### Arguments obligatoris

Es defineixen amb *".string().describe"*

```javascript
args: {
  extension: tool.schema.string().describe("File extension to count"),
}
```

### Arguments opcionals

Es defineixen amb *".string().optional().describe"*

```javascript
args: {
  extension: tool.schema.string().optional().describe("File extension to filter"),
}
```

---

## El context de la tool

La funció `execute()` pot rebre un segon paràmetre, `context`.

És informació extra que rebem sobre el projecte i ens pot ser útil al programar la eina.

```ts
async execute(args, context) {
    const root = context.worktree
    const currentDir = context.directory
    try {
        return `Project root: ${root}, current dir: ${currentDir}`
    } catch (error) {
        return `Tool error: ${String(error)}`
    }
}
```

Alguns camps útils són:

| Camp                | Significat                        |
| ------------------- | --------------------------------- |
| `context.directory` | Directori actual de la sessió     |
| `context.worktree`  | Arrel del repositori o worktree   |
| `context.agent`     | Agent que està executant la tool  |
| `context.sessionID` | Identificador de la sessió        |
| `context.messageID` | Identificador del missatge actual |

Normalment convé utilitzar `context.worktree` per construir rutes relatives al projecte.

---

## Més d’una tool en el mateix fitxer

També es poden exportar diverses eines des d’un mateix fitxer:

```ts
import { tool } from "@opencode-ai/plugin"

export const add = tool({
    description: "Add two numbers",
    args: {
        a: tool.schema.number().describe("First number"),
        b: tool.schema.number().describe("Second number"),
    },
    async execute(args) {
        try {
            return args.a + args.b
        } catch (error) {
            return `Tool error: ${String(error)}`
        }
    }
})

export const multiply = tool({
    description: "Multiply two numbers",
    args: {
        a: tool.schema.number().describe("First number"),
        b: tool.schema.number().describe("Second number"),
    },
    async execute(args) {
        try {
            return args.a * args.b
        } catch (error) {
            return `Tool error: ${String(error)}`
        }
    }
})
```

Si el fitxer es diu:

```bash
.opencode/tools/math.ts
```

OpenCode crearà eines amb noms com:

```text
math_add
math_multiply
```

Això pot ser útil quan tenim un conjunt petit de funcions relacionades.

---

## Executar codi en altres llenguatges

La definició de la tool ha de ser JavaScript o TypeScript, però la lògica real pot estar escrita en qualsevol llenguatge.

Per exemple:

```bash
.opencode/
└── tools/
    ├── add.py
    └── python-add.ts
```

`add.py`:

```python
import sys

a = int(sys.argv[1])
b = int(sys.argv[2])

print(a + b)
```

`python-add.ts`:

```ts
import { tool } from "@opencode-ai/plugin"
import path from "path"

export default tool({
  description: "Add two numbers using Python",

  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },

  async execute(args, context) {
    const script = path.join(context.worktree, ".opencode/tools/add.py")
    const result = await Bun.$`python3 ${script} ${args.a} ${args.b}`.text()
    return result.trim()
  }
})
```

Això permet usar Python, Bash, Rust, Java, PHP o qualsevol altre llenguatge, sempre que la tool de TypeScript/JavaScript faci de pont.

---

## Ús de "tools" des d’OpenCode

Al contrari que altres elements "harness" no hi ha un caràcter per activar directament l'ús d'una tool:

| Símbol | Serveix                                      |
| -----  | -------------------------------------------- |
| `/`    | Executar comandes `/help`, `/models`, ...    |
| `!`.   | Executar comanda shell `!ls -la`             |
| `@`.   | Referenciar fitxers o context                |
| text   | Cridar custom tools a través de text natural |

Des de dins d’OpenCode:

```text
Use the code-stats tool and summarize the result
```

O des de fora:

```bash
opencode run "Use the code-stats tool and summarize the result"
```

També es pot donar una instrucció més natural:

```text
Analyze the project statistics using the available custom tool
```

L’agent decidirà si ha de cridar la tool segons la descripció i el context.

---

## Important: errors a les tools

Les custom tools són codi executable. Si tenen errors de sintaxi, imports incorrectes o dependències que falten, poden fer fallar la càrrega d’OpenCode i provocar errors poc clars, com `UnknownError`.

Per això és recomanable:

* començar amb tools petites
* provar-les una per una
* evitar imports innecessaris
* retornar sempre text o dades simples
* capturar errors dins d’`execute()`
* no substituir eines internes com `bash`, `read` o `write` si no és intencionat

Exemple més segur:

```ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Return a safe test message",

  args: {},

  async execute(args, context) {
    try {
      return "Tool works correctly"
    } catch (error) {
      return `Tool error: ${String(error)}`
    }
  }
})
```

---

## Conflictes amb eines internes

Si una custom tool té el mateix nom que una eina interna, pot substituir-la.

Per exemple:

```bash
.opencode/tools/bash.ts
```

podria substituir el comportament de la tool interna `bash`.

Això pot ser útil per crear una versió restringida de `bash`, però normalment és millor evitar noms com:

```text
bash
read
write
grep
glob
edit
```

És més segur utilitzar noms específics del projecte:

```text
validate-schema
query-database
project-stats
deploy-preview
```

---

## Quan té sentit crear una custom tool?

No cal crear una tool per a qualsevol acció. Té sentit quan l’agent necessita una capacitat concreta, repetitiva i ben definida.

Exemples útils:

| Tool pròpia         | Ús                                             |
| ------------------- | ---------------------------------------------- |
| `database`          | Consultar una base de dades local del projecte |
| `validate-schema`   | Validar JSON, YAML o configuracions pròpies    |
| `deploy-preview`    | Crear un desplegament de prova                 |
| `issue-tracker`     | Consultar tasques d’un sistema extern          |
| `code-stats`        | Calcular estadístiques pròpies del projecte    |
| `check-assets`      | Validar imatges, noms d’arxius o recursos      |
| `generate-fixtures` | Crear dades de prova coherents                 |

Una bona custom tool hauria de fer una cosa clara i retornar un resultat fàcil d’interpretar.

---

## Custom command vs custom tool

És fàcil confondre **custom commands** i **custom tools**.

| Element        | Serveix per                                          |
| -------------- | ---------------------------------------------------- |
| Custom command | Instruccions reutilitzables a l’agent `/supercommit` |
| Custom tool    | Afegir una acció nova executable `query_database`    |

Una **command** és com una plantilla de prompt.

Una **tool** és com una funció que l’agent pot cridar.

Per exemple, `/supercommit` podria ser una command que diu:

```text
Analitza els canvis, agrupa'ls en commits i fes commit.
```

Però una tool podria fer una acció concreta:

```text
Consulta la base de dades del projecte i retorna els usuaris de prova.
```

En general:

* si vols donar **instruccions**, crea una command
* si vols afegir una **capacitat executable**, crea una tool
* si vols connectar diversos agents o aplicacions, considera un MCP

---

## Les custom tools d’OpenCode són compatibles amb Codex o Claude?

No directament.

Les custom tools d’OpenCode estan pensades per a OpenCode i fan servir el seu sistema de càrrega, la seva carpeta `.opencode/tools/` i el seu format de definició.

Per tant:

| Element                            | OpenCode |                   Codex |                                  Claude Code |
| ---------------------------------- | -------: | ----------------------: | -------------------------------------------: |
| `.opencode/tools/*.ts`             |       Sí |          No directament |                               No directament |
| `AGENTS.md`                        |       Sí |                      Sí | Parcialment / via compatibilitat segons eina |
| MCP                                |       Sí | Sí, segons configuració |                                           Sí |
| Scripts normals del projecte       |       Sí |                      Sí |                                           Sí |
| Custom commands pròpies d’OpenCode |       Sí |          No directament |                               No directament |

La manera més portable de compartir eines entre OpenCode, Codex i Claude no és crear una custom tool específica d’OpenCode, sinó crear:

1. un script normal del projecte
2. una CLI pròpia
3. o un servidor MCP

Per exemple:

```bash
tools/
└── validate-schema.js
```

Després cada agent pot cridar aquest script amb `bash`, o bé es pot embolcallar:

* com a custom tool d’OpenCode
* com a MCP
* com a skill
* com a instrucció dins `AGENTS.md`

---
