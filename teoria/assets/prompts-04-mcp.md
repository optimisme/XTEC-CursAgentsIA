# Prompts · Sessió 04 · MCPs: GitHub, Playwright i MCP propi

Prompts de [04 - MCPs GitHub, Playwright i MCP propi](../04%20-%20MCPs%20GitHub,%20Playwright%20i%20MCP%20propi.md), en ordre i preparats per copiar i enganxar.

**Com fer-los servir**

- Els blocs `text` van a **OpenCode**, obert dins la carpeta del repositori (`ia-04-mcp` per a la pràctica, `lliuraments` per a la tasca). Els blocs `bash` van al **terminal**.
- Enganxa **un prompt cada vegada**, en ordre, i fes la comprovació abans de passar al següent.
- Els prompts són en català, però demanen en **anglès** el codi, els noms de fitxers i funcions i el contingut dels fitxers que es creen. Els noms que ja surten als prompts (`submit_task_report`, `opencode.json`, `"done"`…) no es tradueixen.
- Després de canviar `opencode.json` o els agents, surt d'OpenCode i torna-hi a entrar.

---

## Pràctica · Repositori `ia-04-mcp`

### Pas 0 · `.gitignore`

El mateix de la sessió 01.

```text
Crea un .gitignore per a aquest projecte que ignori .secrets/, keys.env, *.env, node_modules/ i .DS_Store. Després fes-ne commit amb el missatge "chore: add .gitignore" i fes push.
```

Guarda el token de GitHub **fora del projecte**, a `~/.secrets/github_token` (només el valor, una sola línia). A macOS, amb el token copiat:

```bash
mkdir -p ~/.secrets && chmod 700 ~/.secrets
pbpaste > ~/.secrets/github_token && chmod 600 ~/.secrets/github_token
```

A Linux (escriu l'ordre, Enter, enganxa el token i Enter):

```bash
mkdir -p ~/.secrets && chmod 700 ~/.secrets
read -rs TOKEN && printf '%s' "$TOKEN" > ~/.secrets/github_token && unset TOKEN
chmod 600 ~/.secrets/github_token
```

A Windows (PowerShell), amb el token copiat:

```powershell
New-Item -ItemType Directory -Force "$HOME\.secrets" | Out-Null
[IO.File]::WriteAllText("$HOME\.secrets\github_token", (Get-Clipboard).Trim())
```

### Pas 1 · MCPs globals de GitHub i Playwright

S'instal·len a la configuració global d'OpenCode: serviran per a tots els projectes.

```text
Afegeix els MCPs de GitHub i de Playwright a la configuració global d'OpenCode (~/.config/opencode/opencode.json), perquè estiguin disponibles a tots els projectes, seguint la documentació oficial:
https://github.com/github/github-mcp-server
https://github.com/microsoft/playwright-mcp
Si el fitxer ja existeix, conserva'n la resta de configuració. No toquis l'opencode.json d'aquest projecte.
Per a l'MCP de GitHub, llegeix el token amb {file:~/.secrets/github_token} i no escriguis mai el token a cap fitxer de configuració.
Afegeix a l'AGENTS.md d'aquest projecte (crea'l si no existeix) aquesta secció, exactament en anglès:
# MCPs
- GitHub MCP: configured globally; the token is read from ~/.secrets/github_token. Never write the token in any file.
- Playwright MCP: available to inspect, debug and interact with websites.
```

OpenCode et demanarà permís per escriure fora del projecte: accepta-ho només per a aquest fitxer.

**Comprova-ho:** reinicia OpenCode i executa `opencode mcp list` al terminal: `github` i `playwright` connectats. El token no surt a cap fitxer de configuració.

### Pas 2 · Metadades del repositori

```text
Fes servir l'MCP de GitHub per obtenir les metadades del repositori git al qual pertany aquesta carpeta.
```

### Pas 3 · Sis issues

Abans, crea `webs/` i copia-hi [`todo-app.html`](todo-app.html).

```text
Fes servir l'MCP de GitHub per crear sis issues separades al repositori actual sobre la pàgina @webs/todo-app.html, una per cada bug d'aquesta llista.
Escriu títols i descripcions en català, amb els passos per reproduir-lo, el comportament actual i l'esperat.
No modifiquis el codi ni creïs cap pull request.
1. Les tasques desades no es recuperen en tornar a obrir la pàgina.
2. Els filtres «Pendents» i «Completades» mostren les tasques invertides.
3. En esborrar una tasca, desapareixen totes les altres.
4. El comptador de tasques pendents mostra un valor incorrecte.
5. Es poden afegir tasques buides tot i mostrar-se un avís.
6. El botó «Esborra completades» no funciona.
```

**Comprova-ho:** hi ha sis issues obertes a GitHub.

### Pas 4 · Playwright

En un altre terminal, des de `ia-04-mcp` (port 3000):

```bash
npx serve webs
```

```text
Fes servir l'MCP de Playwright per obrir http://localhost:3000/todo-app.html. Afegeix tres tasques, esborra'n una i explica què passa amb les altres. Fes una captura de pantalla i digues si es reprodueix el bug «En esborrar una tasca, desapareixen totes les altres».
```

### Pas 5 · MCP d'escriptori `computer-use`

Abans, revisa els permisos del teu sistema (secció 5 de la lliçó, «Requisits i permisos»). A macOS, dona permís d'**Accessibilitat** i de **Gravació de pantalla** (i, si vols, de **Monitoratge de l'entrada**) a l'aplicació des d'on executes OpenCode. A Linux, instal·la les eines de la teva sessió (X11 o Wayland) i AT-SPI. A Windows no cal res més. No toquis el ratolí ni el teclat mentre treballa; `ctrl+alt+escape` l'atura.

```text
Afegeix a l'opencode.json d'aquest projecte l'MCP computer-use, seguint https://github.com/zavora-ai/computer-use-mcp:
- MCP local a mcp.servers amb l'ordre ["npx", "-y", "@zavora-ai/computer-use-mcp"] i "disabled": false.
- A "environment", COMPUTER_USE_ALLOWED_APPS amb només la calculadora d'aquest sistema operatiu i COMPUTER_USE_FS_ROOTS amb ".".
- No toquis els altres MCPs.
Afegeix a la secció # MCPs d'AGENTS.md aquesta línia, exactament en anglès:
- computer-use MCP: desktop control, only for the apps listed in COMPUTER_USE_ALLOWED_APPS. Disable it ("disabled": true) when not in use.
```

**Comprova-ho:** reinicia OpenCode; `opencode mcp list` mostra `computer-use` connectat.

```text
Fes servir l'eina doctor de l'MCP computer-use i explica'm quins permisos o dependències falten en aquest ordinador i com activar-los.
```

```text
Fes servir l'MCP computer-use per obrir la calculadora del sistema.
Abans de cada clic, assegura't que la calculadora és la finestra activa i que és per damunt de les altres; si no ho és, activa-la i torna-ho a comprovar.
Calcula 128 × 37 fent clic als botons, no amb el teclat. Abans de fer clic per coordenades, mira a la descripció de l'eina si espera coordenades de pantalla o relatives a la finestra. Si les has tret d'una captura de la finestra i l'eina en vol de pantalla, suma-hi la posició de la finestra. Si pots, fes clic als botons pel seu nom (accessibilitat) en lloc de per coordenades.
Fes una captura del resultat, llegeix el número que mostra i comprova que és correcte. Després tanca la calculadora.
```

**Comprova-ho:** el resultat és 4736. Demana-li que obri el navegador: ha de dir que no té permís. Quan acabis, posa `"disabled": true` a `computer-use` i reinicia OpenCode.

### Pas 6 · MCP propi `task-contract`

```text
Crea un servidor MCP senzill amb Node.js anomenat task-contract a .agents/mcp/task-contract/, amb package.json, server.js, server.test.js i README.md.
- Mòduls ES ("type": "module"). Les úniques dependències permeses són l'SDK oficial @modelcontextprotocol/sdk i zod. Escriu en anglès el codi, els noms, els comentaris i el README.
- Ha d'exposar una sola eina, submit_task_report, amb:
  - taskId: string obligatori
  - status: "done", "failed" o "blocked"
  - changedFiles: array de strings
  - verification: array de strings
  - notes: string opcional
- Si l'entrada és vàlida, afegeix-la com una línia JSON a reports.jsonl i retorna un missatge d'èxit. Si no, retorna un error clar que digui quin camp falla.
- Calcula la ruta de reports.jsonl a partir de la carpeta de server.js (import.meta.url), no del directori actual: OpenCode arrenca l'MCP des d'una altra carpeta.
- Separa la validació en una funció exportada i prova-la a server.test.js amb node:test i node:assert (un informe vàlid i un d'invàlid). Afegeix a package.json l'script "test": "node --test".
- Executa npm --prefix .agents/mcp/task-contract install i npm --prefix .agents/mcp/task-contract test.
- Registra'l a opencode.json com a MCP local amb l'ordre ["node", ".agents/mcp/task-contract/server.js"], sense tocar els altres MCPs.
Crea només els fitxers de l'MCP; no modifiquis l'app.
```

**Comprova-ho:** `npm --prefix .agents/mcp/task-contract test` passa, i després de reiniciar OpenCode `opencode mcp list` mostra `task-contract` connectat.

### Pas 7 · Prova `task-contract`

```text
Fes servir l'eina submit_task_report de l'MCP task-contract per enviar un informe de prova: taskId "T00", status "done", changedFiles ["webs/todo-app.html"], verification ["manual check"]. Després envia'n un amb status "finished" i explica quin error retorna.
```

**Comprova-ho:** `.agents/mcp/task-contract/reports.jsonl` té una línia (la de `T00`) i el segon informe s'ha rebutjat per `status`.

---

# Tasca T4 · Projecte «Lliuraments»

Al repositori `lliuraments`. El token de GitHub i els MCPs de GitHub i Playwright ja són globals.

### T4.1 · Comprova els MCPs i documenta'ls

Al terminal, des de `lliuraments`: `opencode mcp list` ha de mostrar `github` i `playwright` connectats. Després, a OpenCode:

```text
Afegeix a l'AGENTS.md d'aquest projecte (crea'l si no existeix) aquesta secció, exactament en anglès:
# MCPs
- GitHub MCP: configured globally; the token is read from ~/.secrets/github_token. Never write the token in any file.
- Playwright MCP: available to inspect, debug and interact with websites.
```

### T4.2 · Una issue

```text
Fes servir l'MCP de GitHub per crear una issue al repositori actual amb aquesta funcionalitat nova: "Filtrar la taula per alumne".
Escriu el títol i la descripció en català, amb una llista de criteris d'acceptació que es puguin comprovar.
No modifiquis el codi ni creïs cap pull request.
```

**Comprova-ho:** la issue surt a la pestanya *Issues* de GitHub.

### T4.3 · Playwright

En un altre terminal, des de `lliuraments` (l'arrel, no `webs/`):

```bash
npx serve .
```

Canvia `<pàgina>` pel nom de la teva pàgina (el que fixa `PLAN.md`):

```text
Fes servir l'MCP de Playwright per obrir http://localhost:3000/webs/<pàgina>. Comprova que es veu la llista de pràctiques ordenada per data límit i desa una captura de pantalla a docs/captures/lliuraments.png.
```

### T4.4 · Commit, etiqueta i push

```text
Fes un commit de tots els canvis, crea l'etiqueta t4 i fes push de la branca main i de les etiquetes.
```

### Ampliació (opcional)

Dues issues més:

```text
Fes servir l'MCP de GitHub per crear dues issues més al repositori actual, amb títol, descripció i criteris d'acceptació en català: "Marcar la pràctica més propera a vèncer" i "Exportar el resum per alumne a CSV". No modifiquis el codi.
```

El `reviewer` amb Playwright i `task-contract`. Primer, al terminal, des de `lliuraments`:

```bash
mkdir -p .agents/mcp && cp -R ../ia-04-mcp/.agents/mcp/task-contract .agents/mcp/
rm -rf .agents/mcp/task-contract/node_modules .agents/mcp/task-contract/reports.jsonl
```

```text
Instal·la l'MCP de .agents/mcp/task-contract (npm --prefix .agents/mcp/task-contract install) i registra'l a l'opencode.json d'aquest projecte com a MCP local amb l'ordre ["node", ".agents/mcp/task-contract/server.js"], sense tocar la resta.
Actualitza .agents/agents/reviewer.md: a partir d'ara també valida la web amb l'MCP de Playwright a http://localhost:3000/webs/ (el servidor l'engego jo) i, en acabar cada tasca, envia l'informe amb l'eina submit_task_report de l'MCP task-contract. A permissions, afegeix regles allow per a les accions playwright_* i task-contract_*, després de la regla que ho denega tot.
Afegeix a la secció # MCPs d'AGENTS.md aquesta línia, exactament en anglès:
- task-contract MCP: the reviewer submits the final report of every task with submit_task_report.
```
