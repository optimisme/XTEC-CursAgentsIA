<style> .images { max-width: 400px; border: 1px solid grey; padding: 4px; margin-bottom: 25px; } </style>

# MCPs a OpenCode

**MCP** vol dir **Model Context Protocol**. És un protocol que permet connectar un agent d’IA amb eines, serveis o dades externes d’una manera estàndard.

Un MCP no és simplement una comanda. És un **servidor d’eines** que OpenCode pot carregar i oferir al model com si fossin tools disponibles.

* **MCPs locals**: Funcionen com un servidor intern sobre el nostre sistema o per comunicar-se amb serveis externs.

* **MCPs remots**: Connecten directament amb serveis externs que compleixen els protocols MCPs.

---

## Per a què serveix un MCP?

Un MCP serveix per connectar OpenCode amb funcionalitats externes com:

| MCP            | Ús                                            |
| -------------- | --------------------------------------------- |
| GitHub         | Consultar issues, pull requests o repositoris |
| Base de dades  | Consultar dades d’un projecte                 |
| Sistema intern | Connectar amb eines pròpies d’una empresa     |
| API externa    | Donar accés controlat a un servei remot       |

La idea és que l’agent no només pugui llegir o editar fitxers, sinó també **interactuar amb sistemes externs**.

---

## Configuració dels MCPs?

Els MCPs es configuren dins l’arxiu *"opencode.json"* dins l'atribut *"mcp"*:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {}
}
```

---

## MCPs locals

Els MCPs locals s'executen dins la pròpia màquina, si formen part del projecte i s'han d'arrencar amb OpenCode, cal definir-los:

```bash
# .opencode/mcp/<nom-mcp-local>/
projecte/
└── .opencode/
    └── mcp/
        └── my-local-mcp/
```

Exemple de configuració a *"opencode.json"*:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-local-mcp": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-command"],
      "enabled": true
    }
  }
}
```

En aquest cas, OpenCode executa la comanda indicada a `command` per iniciar el servidor MCP. 

---

## Exemple de MCP local del projecte

En aquest projecte hi ha un MCP local anomenat `safe-edit`. Serveix per modificar fitxers de manera controlada: llegir línies concretes, aplicar canvis petits i verificar el resultat després de cada edició.

La configuració a `opencode.json` és:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "safe-edit": {
      "type": "local",
      "command": ["node", ".opencode/mcp/safe-edit/server.js"],
      "enabled": true
    }
  }
}
```

Aquest servidor exposa eines com:

| Tool | Ús |
| --- | --- |
| `safe_read_lines` | Llegir un rang de línies abans d’editar |
| `safe_apply_patch` | Aplicar un canvi amb un diff verificable |
| `safe_replace_lines` | Substituir només un rang concret de línies |
| `safe_verify_file` | Verificar el fitxer o una secció després d’editar |

Un flux habitual seria:

1. Llegir les línies afectades.
2. Aplicar un canvi petit.
3. Verificar el fragment modificat.

Per exemple, es pot demanar a OpenCode:

```text
Use the safe-edit MCP to update app.js. First read the target lines with safe_read_lines, apply only the needed change, then verify the changed section with safe_verify_file.
```

El paquet `@modelcontextprotocol/server-everything` també pot servir com a MCP genèric de demostració, però `safe-edit` és més útil en aquest curs perquè està vinculat a una pràctica real del projecte.

### Opcions d’un MCP local

| Camp          | Obligatori | Funció                              |
| ------------- | ---------: | ----------------------------------- |
| `type`        |         Sí | Ha de ser `"local"`                 |
| `command`     |         Sí | Comanda per iniciar el servidor MCP |
| `environment` |         No | Variables d’entorn                  |
| `enabled`     |         No | Activa o desactiva el servidor      |
| `timeout`     |         No | Temps màxim per obtenir les eines   |

---
> **Nota:** El `timeout` per defecte és de 5000 ms.

---

## MCP remot

Un MCP remot és un servidor que ja està funcionant en una URL.

Exemple:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-remote-mcp": {
      "type": "remote",
      "url": "https://my-mcp-server.com",
      "enabled": true,
      "oauth": false,
      "headers": {
        "Authorization": "Bearer {env:MY_API_KEY}"
      }
    }
  }
}
```

### Opcions d’un MCP remot

| Camp      | Obligatori | Funció                            |
| --------- | ---------: | --------------------------------- |
| `type`    |         Sí | Ha de ser `"remote"`              |
| `url`     |         Sí | URL del servidor MCP              |
| `enabled` |         No | Activa o desactiva el servidor    |
| `headers` |         No | Capçaleres HTTP                   |
| `oauth`   |         No | Configuració OAuth                |
| `timeout` |         No | Temps màxim per obtenir les eines |

### MCP remot amb OAuth

Alguns MCPs remots necessiten autenticació OAuth.

Exemple:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-oauth-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

En el cas d'autenticar-se amb OAuth, OpenCode inicia el flux OAuth al fer servir el servidor. També es pot iniciar aquest flux manualment amb:

```bash
opencode mcp auth my-oauth-server
```

Per tancar la sessió OAuth:

```bash
opencode mcp logout my-oauth-server
```

---

## Variables d’entorn

És millor no posar claus directament dins `opencode.json`.

Millor:

```jsonc
{
  "headers": {
    "Authorization": "Bearer {env:GITHUB_TOKEN}"
  }
}
```

Així la clau es pot definir fora:

```bash
export GITHUB_TOKEN="..."
```

La configuració d’OpenCode permet substituir variables d’entorn amb la sintaxi `{env:VARIABLE_NAME}`.

---

## Comandes útils per gestionar MCPs

OpenCode inclou comandes CLI per gestionar MCPs. 

| Comanda                     | Funció                                    |
| --------------------------- | ----------------------------------------- |
| `opencode mcp add`          | Afegeix un MCP de forma guiada            |
| `opencode mcp list`         | Mostra els MCPs configurats               |
| `opencode mcp ls`           | Versió curta de `list`                    |
| `opencode mcp auth`         | Autentica un MCP amb OAuth                |
| `opencode mcp auth list`    | Mostra l’estat d’autenticació             |
| `opencode mcp logout`       | Elimina credencials OAuth                 |
| `opencode mcp debug <name>` | Diagnostica problemes de connexió o OAuth |

---

## Ús d’un MCP dins d’OpenCode

Les MCPs actives i/o configurades surten a la barra d'estat de OpenCode:

<center>
<img src="./assets/04-mcp-status.png" class="images">
</center>

No hi ha un símbol especial per cridar un MCP.

Es fa amb llenguatge natural, igual que amb les tools:

```text
Use the github MCP to list open issues.
```

En aquest projecte hi ha un servidor per modificar arxius de manera segura quan es fan servir models petits:

```bash
# .opencode/mcp/<nom-mcp-local>/
projecte/
└── .opencode/
    └── mcp/
        └── safe-edit
```

A més, l'arxiu *"agents.md"* conté la secció específica **"Safe editing"** per informar de com ha de fer servir l'MCP *"safe-edit"*.
