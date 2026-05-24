<style> .images { max-width: 400px; border: 1px solid grey; padding: 4px; margin-bottom: 25px; } </style>

# MCPs a OpenCode

**MCP** vol dir **Model Context Protocol**. És un protocol que permet connectar un agent d’IA amb eines, serveis o dades externes d’una manera estàndard.

Un MCP no és simplement una comanda. És un **servidor d’eines** que OpenCode pot carregar i oferir al model com si fossin tools disponibles.

* **MCPs locals**: Funcinen com un servidor intern sobre el nostre sistema o per comunicar-se amb serveis externs.

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

## Exemple de MCP local de prova

OpenCode mostra com a exemple el paquet `@modelcontextprotocol/server-everything`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mcp_everything": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-everything"]
    }
  }
}
```

Després es pot demanar a OpenCode:

```text
Use the mcp_everything tool to add the number 3 and 4
```

OpenCode indica que es pot fer referència al servidor MCP pel seu nom dins del prompt.

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

La configuració d’OpenCode permet substituir variables d’entorn amb la sintaxi `{env:VARIABLE_NAME}`. ([opencode.ai][2])

---

## Comandes útils per gestionar MCPs

OpenCode inclou comandes CLI per gestionar MCPs. ([opencode.ai][3])

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



No hi ha un símbol especial per cridar un MCP.

Es fa amb llenguatge natural, igual que amb les tools:

```text
Use the github MCP to list open issues.
```

<center>
<img src="./assets/04-mcp-status.png" class="images">
</center>