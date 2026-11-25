# Prompts · Sessió 05 · Serveis de Google per a agents

Prompts de [05 - Serveis de Google per a agents](../05%20-%20Serveis%20de%20Google%20per%20a%20agents.md), en ordre i preparats per copiar i enganxar.

**Com fer-los servir**

- Els blocs `text` van a **OpenCode**, obert dins la carpeta del repositori on treballes. Els blocs `bash` i `powershell` van al **terminal**.
- Enganxa **un prompt cada vegada** i revisa el resultat abans del següent.
- Abans de començar, fes els passos de la consola de Google de la lliçó (seccions 1 i 3): els prompts necessiten les credencials a `.secrets/`, la carpeta compartida i el full `Lliuraments`.
- Requisits: Node.js 24.22 o superior (`node --version`) i `uv` (`uvx --version`). Vegeu la secció 0 de la lliçó.

---

## Pràctica · Repositori `lliuraments`

La pràctica es fa directament al repositori del projecte: el resultat dels passos 1 i 2 és la tasca T5.

### Pas 1 · MCP de Google Sheets

Canvia `<ID_DE_LA_CARPETA>` per l'identificador de la carpeta compartida (l'última part de la URL de Drive).

```text
Afegeix a l'opencode.json d'aquest projecte l'MCP comunitari de Google Sheets mcp-google-sheets (https://github.com/xing5/mcp-google-sheets) amb un compte de servei, seguint-ne la documentació. Arrenca'l amb uvx mcp-google-sheets@latest. Registra'l a mcp.servers amb la clau google-sheets.
Posa a environment:
- SERVICE_ACCOUNT_PATH: la ruta absoluta de .secrets/google-service-account.json (fes servir pwd per obtenir-la; l'MCP no accepta rutes relatives).
- DRIVE_FOLDER_ID: <ID_DE_LA_CARPETA>. És només l'identificador, no la URL sencera.
- ENABLED_TOOLS: get_sheet_data,update_cells,list_spreadsheets,list_sheets
Si opencode.json ja existeix, conserva'n la resta de configuració.
Afegeix a AGENTS.md (crea'l si no existeix) la secció # MCPs, si encara no hi és, i dins seu aquesta línia, exactament en anglès:
- Google Sheets MCP: edits spreadsheets in the shared Drive folder with the service account at .secrets/google-service-account.json. Do not create spreadsheets; the user creates them.
```

Reinicia OpenCode. **Comprova-ho:** `opencode mcp list` mostra `google-sheets` connectat.

### Pas 2 · Resum per alumne al full «Lliuraments»

```text
Fes servir l'MCP de Google Sheets amb el full "Lliuraments" de la carpeta compartida.
Llegeix data/lliuraments.json i escriu-hi una fila per alumne amb: nom, pràctiques lliurades dins del termini, lliurades tard i pendents.
La fila 1 és la capçalera: Alumne, Lliurades, Tard, Pendents. Els alumnes van a partir de la fila 2.
```

**Comprova-ho:** tria un alumne i compara els seus tres números amb `data/lliuraments.json`.

Els passos 3 a 6 (Gmail) són una demostració del professor; fer-los és opcional.

### Pas 3 · Autoritzar Gmail (terminal)

Des de `lliuraments`. S'obre el navegador per autoritzar l'accés, només de lectura.

```bash
export GMAIL_OAUTH_PATH="$PWD/.secrets/google-client-secret.json"
export GMAIL_CREDENTIALS_PATH="$PWD/.secrets/gmail-credentials.json"
npx -y @klodr/gmail-mcp auth --scopes=gmail.readonly
```

A Windows (PowerShell):

```powershell
$env:GMAIL_OAUTH_PATH = "$PWD\.secrets\google-client-secret.json"
$env:GMAIL_CREDENTIALS_PATH = "$PWD\.secrets\gmail-credentials.json"
npx -y @klodr/gmail-mcp auth --scopes=gmail.readonly
```

### Pas 4 · MCP de Gmail

```text
Afegeix a l'opencode.json d'aquest projecte l'MCP de Gmail @klodr/gmail-mcp (https://github.com/klodr/gmail-mcp), seguint-ne la documentació. Arrenca'l amb npx -y @klodr/gmail-mcp. Registra'l a mcp.servers amb la clau gmail.
Posa a environment les rutes absolutes (fes servir pwd; l'MCP no accepta rutes relatives):
- GMAIL_OAUTH_PATH: .secrets/google-client-secret.json
- GMAIL_CREDENTIALS_PATH: .secrets/gmail-credentials.json
No executis l'autorització: ja l'he feta al terminal. Conserva la resta de configuració d'opencode.json.
Afegeix a la secció # MCPs d'AGENTS.md aquesta línia, exactament en anglès:
- Gmail MCP: read-only access to my inbox (gmail.readonly scope). Never try to send, modify or delete emails.
```

Reinicia OpenCode. **Comprova-ho:** `opencode mcp list` mostra `gmail` connectat.

### Pas 5 · Resum del correu

```text
Fes servir l'MCP de Gmail per resumir els 10 correus més importants dels dos últims dies. Mostra'n l'assumpte.
```

**Comprova-ho:** demana-li que marqui un correu com a llegit. Ha de respondre que no té cap eina per fer-ho.

### Pas 6 · Comanda `/gmail-important`

Crea `.agents/commands/gmail-important.md` amb el contingut de la lliçó (secció 5), o demana-ho a l'agent:

```text
Crea l'arxiu .agents/commands/gmail-important.md amb exactament aquest contingut:
---
description: Show the 10 most important recent Gmail messages
agent: build
---
# /gmail-important — Top 10 most important Gmail messages

Use the Gmail MCP. It has read-only access.
Find the 10 most important recent emails in my inbox. Rank them, in this order, by:
1. Marked as important or starred.
2. Requiring an action, reply, decision or follow-up.
3. Sent by people rather than automated services.
4. More recent first.
Return only a numbered list with subject, sender and received date.
Do not modify, archive, mark as read, delete or reply to any email.
```

Si no hi ha l'enllaç `.opencode` → `.agents`, crea'l (sessió 02, secció 9). Reinicia OpenCode i executa `/gmail-important`.

---

## Tasca T5 · Projecte «Lliuraments»

La T5 és el resultat dels passos 1 i 2 de la pràctica. Comparteix el full «Lliuraments» amb el professor (només lectura), comprova amb `git status` que `.secrets/` no hi apareix i tanca la tasca:

```text
Fes un commit de tots els canvis, crea l'etiqueta t5 i fes push de la branca main i de les etiquetes.
```

### Ampliació (opcional) · Notes ponderades

Crea tu un segon full, «Notes», a la carpeta compartida.

```text
Fes servir l'MCP de Google Sheets amb el full "Notes" de la carpeta compartida.
Afegeix-hi dades d'exemple per a un grup de 5 alumnes amb les notes "Ex, Pr1, Pr2, Obs" i una columna "Total" amb la mitjana ponderada, calculada amb una fórmula del full.
A la fila 1 posa les capçaleres i a la fila 2 els pesos de cada nota: 40%, 20%, 20%, 20%. Els alumnes van a partir de la fila 3.
```

**Comprova-ho:** els totals són fórmules i fan servir els pesos de la fila 2.
