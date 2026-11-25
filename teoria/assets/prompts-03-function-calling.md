# Prompts · Sessió 03 · Eina CMD amb function calling

Prompts de la Pràctica 1 de [03 - Function calling i models locals](../03%20-%20Function%20calling%20i%20models%20locals.md), en ordre i preparats per copiar i enganxar.

**Com fer-los servir**

- El repositori `ia-03-function-calling` comença **buit**: no es copia cap projecte. Tot el codi el genera OpenCode amb aquests prompts.
- Obre OpenCode dins `ia-03-function-calling` i enganxa **un prompt cada vegada**, en ordre.
- Els blocs `text` van a **OpenCode**. Els blocs `bash` i `powershell` van al **terminal**.
- Els prompts són en català, però demanen en **anglès** el codi, els noms de funcions, variables i fitxers, els comentaris i els logs: així el codi coincideix amb la teoria. Els noms que ja surten als prompts (`app.js`, `get_student_by_name`, `TOOL_DEFINITIONS`…) i els textos entre cometes no es tradueixen.
- Després de cada pas, **llegeix el codi generat** i fes la comprovació abans de passar al següent.

---

## Pas 0 · `.gitignore`

El mateix `.gitignore` de la sessió 01.

```text
Crea un .gitignore per a aquest projecte que ignori .secrets/, keys.env, *.env, node_modules/ i .DS_Store. Després fes-ne commit amb el missatge "chore: add .gitignore" i fes push.
```

---

## Pas 1 · Projecte

Crea `app/` amb `package.json`, `settings.env` i un `src/app.js` mínim. La resta de fitxers els creen els passos següents.

```text
Crea un projecte mínim de línia de comandes amb Node.js a la carpeta app/ d'aquest repositori.
- Node.js 20 o superior, mòduls ES, sense dependències i sense servidor web.
- No creïs agents, orquestradors, fitxers de tasques, revisors ni tests.
- Escriu en anglès el codi, els noms de funcions, variables i fitxers, els comentaris i els logs.
Crea només aquests fitxers:
- app/package.json:
{ "name": "function-calling-cli", "version": "1.0.0", "description": "Minimal function calling demo with student data",
  "main": "src/app.js", "type": "module", "scripts": { "start": "node ./src/app.js" } }
- app/settings.env amb exactament aquestes línies:
OPENAI_BASE_URL="https://agents.ieti.site/v1/chat/completions"
OPENAI_API_KEY=""
OPENAI_MODEL="active-model"
TEMPERATURE=0
MAX_TOKENS=800
- app/settings.env.example amb les mateixes variables i els mateixos valors (OPENAI_API_KEY es queda buida).
- app/src/app.js: defineix loadEnvSettings(), la crida i mostra "Function calling CLI demo".
  loadEnvSettings() llegeix app/settings.env (calcula la ruta a partir de import.meta.url, no del directori actual), ignora les línies buides i les que comencen per #, treu les cometes dels valors i desa cada VARIABLE=valor a process.env.
- app/README.md: com s'executa (cd app, npm start).
Encara no creïs src/llm.js, src/tools.js ni data/: els creen els passos següents.
Comprova que el .gitignore ignora app/settings.env (la regla *.env ja ho fa) però no app/settings.env.example.
```

**Comprova-ho** al terminal, des de `ia-03-function-calling`:

```bash
cd app
npm start
```

Ha de mostrar `Function calling CLI demo`.

---

## Pas 2 · Dades

Crea les dades inventades a `app/data/students.json`.

```text
Crea app/data/students.json amb dades inventades d'alumnes per a una demo educativa. Ha de ser JSON vàlid amb aquesta forma:
{
  "students": [ { "id": 1, "name": "Júlia", "group": "1r DAW", "familyContact": "familia.julia@example.com" } ],
  "tasks": [ { "studentId": 1, "title": "Lliurar pràctica HTML", "status": "pending" } ],
  "incidents": [ { "studentId": 2, "text": "Ha arribat tard a classe", "date": "2026-06-23T05:58:30.856Z" } ]
}
Alumnes: id 1 Júlia (1r DAW), id 2 Marc (1r DAW), id 3 Aina (2n DAW), cadascun amb el seu familyContact.
Tasques, amb títols en català i "status" igual a "pending" o "done": Júlia 2 pendents i 1 feta, Marc 1 pendent i 1 feta, Aina 1 feta.
Incidències: només la del Marc de l'exemple.
Crea només aquest fitxer. No canviïs cap altre fitxer.
```

**Comprova-ho:** obre `app/data/students.json` i mira que hi ha tres alumnes, tasques i incidències.

---

## Pas 3 · Funcions locals

Crea les funcions de `app/src/tools.js`. Encara no hi ha model.

```text
Crea app/src/tools.js amb aquestes funcions locals. Cadascuna rep un sol objecte amb els arguments i retorna un objecte que es pugui convertir a JSON. No llancen mai excepcions: si hi ha un error, retornen { error: "message" }.
Llegeix i escriu app/data/students.json amb readFileSync i writeFileSync. Calcula la ruta a partir de import.meta.url, no del directori actual. Llegeix el fitxer a cada crida.
- get_student_by_name({ name }): busca l'alumne pel nom, sense distingir majúscules i minúscules. Retorna l'alumne o { error: "student not found" }.
- get_pending_tasks({ studentId }): retorna { studentId, tasks } només amb les tasques "pending" de l'alumne.
- get_incidents({ studentId }): retorna { studentId, incidents } amb les incidències de l'alumne, la més nova primer.
- add_incident({ studentId, text }): afegeix { studentId, text, date } amb la data actual en format ISO, desa el fitxer i retorna la incidència creada.
- create_family_message({ studentId, reason, tone }): només retorna un esborrany { to, subject, body } en català, adreçat al familyContact de l'alumne. No envia mai res.
Valida els arguments a cada funció: studentId ha de ser l'id enter d'un alumne que existeixi; name, text i reason han de ser strings no buits; tone és opcional (per defecte "amable"). Si alguna cosa no és vàlida, retorna { error: "..." }.
Exporta totes les funcions i també TOOLS: un objecte que associa el nom de cada funció amb la seva funció.
Actualitza app/src/app.js (mantén loadEnvSettings) perquè cridi aquestes funcions directament, sense cap model, i mostri cada resultat:
get_student_by_name({ name: "Júlia" }), get_pending_tasks({ studentId: 1 }), get_incidents({ studentId: 2 }), create_family_message({ studentId: 1, reason: "tasques pendents" }) i get_pending_tasks({ studentId: 99 }) per veure un error.
No cridis add_incident aquí.
Escriu en anglès el codi, els noms de funcions, variables i fitxers, els comentaris i els logs.
```

**Comprova-ho** des de `ia-03-function-calling/app`:

```bash
npm start
```

Ha de mostrar el resultat de cada funció, i un `{ error: … }` per a l'alumne 99.

---

## Pas 4 · Definicions de les eines

Crea `TOOL_DEFINITIONS`, la descripció de les funcions que llegirà el model.

```text
A app/src/tools.js, afegeix i exporta TOOL_DEFINITIONS: un array amb una entrada per funció, amb aquest format:
{ type: "function", function: { name, description, parameters: { type: "object", additionalProperties: false, properties: { ... }, required: [ ... ] } } }
Paràmetres:
- get_student_by_name: name (string). Obligatori: name.
- get_pending_tasks: studentId (integer). Obligatori: studentId.
- get_incidents: studentId (integer). Obligatori: studentId.
- add_incident: studentId (integer), text (string). Obligatoris: studentId, text.
- create_family_message: studentId (integer), reason (string), tone (string, opcional). Obligatoris: studentId, reason.
Escriu les description en anglès i clares: han de dir quan s'ha de fer servir cada funció i que studentId s'obté amb get_student_by_name.
No canviïs les funcions locals ni app/src/app.js.
```

**Comprova-ho:** obre `app/src/tools.js` i mira que cada funció té la seva descripció JSON.

---

## Pas 5 · Missatge system

Crea `SYSTEM_MESSAGE` i l'array `messages` inicial.

```text
A app/src/app.js, mantén el codi que hi ha i afegeix una constant SYSTEM_MESSAGE = { role: "system", content: "..." } amb exactament aquest contingut, en anglès:
"You are an assistant for a teacher using a command-line student management demo. The user may write in Catalan, Spanish, or English. Always answer in the same language as the user. You cannot access school data directly. You can only request the available functions. Use function calling when you need student information, pending tasks, incidents, or family message drafts. Never invent student data. Never say that an email has been sent. Only prepare draft messages."
Afegeix també:
const messages = [ SYSTEM_MESSAGE, { role: "user", content: "Quines tasques pendents té la Júlia?" } ];
Mostra messages amb JSON.stringify(messages, null, 2). Encara no cridis cap model.
```

**Comprova-ho** des de `ia-03-function-calling/app`:

```bash
npm start
```

Ha de mostrar l'array `messages` amb el missatge `system` i el de l'usuari.

---

## Pas 6 · Crida al model

Crea `callModel()` a `app/src/llm.js`. Encara no es fa servir: el pas 7 la crida per primera vegada.

```text
Crea app/src/llm.js, que exporti una funció async callModel(messages).
- Llegeix OPENAI_BASE_URL, OPENAI_API_KEY, OPENAI_MODEL, TEMPERATURE i MAX_TOKENS de process.env dins de callModel, no al principi del fitxer (app.js carrega settings.env després dels imports).
- Si falta OPENAI_BASE_URL o OPENAI_MODEL, llança un error clar.
- OPENAI_BASE_URL ja és la URL completa (acaba en /v1/chat/completions): envia-hi la petició POST i no hi afegeixis cap ruta.
- Capçaleres: Content-Type: application/json. Afegeix Authorization: Bearer <clau> només si OPENAI_API_KEY no és buida.
- Body: { model: OPENAI_MODEL, messages, tools: TOOL_DEFINITIONS, tool_choice: "auto", temperature: Number(TEMPERATURE), max_tokens: Number(MAX_TOKENS) }. Importa TOOL_DEFINITIONS de ./tools.js.
- Fes servir el fetch integrat de Node. Si la resposta no és ok, llança un error amb l'estat i el text de la resposta.
- Mostra "REQUEST SENT TO MODEL" amb el body i "MODEL RESPONSE" amb el missatge retornat, tots dos amb JSON.stringify(..., null, 2).
- Retorna data.choices[0].message.
Encara no canviïs app/src/app.js.
Escriu en anglès el codi, els noms de funcions, variables i fitxers, els comentaris i els logs.
```

---

## Abans del pas 7 · La teva clau a `settings.env`

Fins al pas 6 no es crida cap model. A partir del pas 7, sí.

L'eina necessita la teva clau del servidor IETI (`ieti_sk_…`), la mateixa de la sessió 01. L'script del servidor IETI la va guardar a la teva carpeta d'usuari. Mostra-la al terminal:

```bash
cat ~/.config/ieti-agents/agents_server_key
```

```powershell
Get-Content "$HOME\.config\ieti-agents\agents_server_key"
```

Si no hi és, la trobaràs a <https://agents.ieti.site>.

Obre `app/settings.env` amb l'editor i enganxa la clau entre les cometes de `OPENAI_API_KEY`:

```ini
OPENAI_API_KEY="ieti_sk_…"
```

- **Fes-ho tu, a l'editor.** No enganxis la clau al xat d'OpenCode.
- **Només a `settings.env`.** A `settings.env.example` la línia es queda com `OPENAI_API_KEY=""`.
- **Comprova que no es pujarà:** `git check-ignore -v app/settings.env` ha de mostrar la regla `*.env` del `.gitignore`.

---

## Pas 7 · Detectar i executar crides

**Abans d'aquest pas:** has de tenir la clau a `app/settings.env` (apartat anterior).

```text
Actualitza app/src/app.js:
- Esborra les crides directes temporals del pas 3 i la sortida de messages del pas 5. Mantén loadEnvSettings, SYSTEM_MESSAGE i messages.
- Crida callModel(messages) una sola vegada, amb top-level await.
- Si el missatge retornat té tool_calls, per a cada crida: mostra TOOL CALL DETECTED amb el nom i els arguments; converteix function.arguments amb JSON.parse (si falla, el resultat és { error: "invalid JSON arguments" }); executa TOOLS[name](args) (si el nom no és a TOOLS, el resultat és { error: "unknown function" }); mostra FUNCTION EXECUTED amb el resultat.
- Encara no tornis els resultats al model.
- Si no hi ha tool_calls, mostra message.content.
Escriu en anglès el codi, els noms de funcions, variables i fitxers, els comentaris i els logs.
```

**Comprova-ho** des de `ia-03-function-calling/app`:

```bash
npm start
```

Ha de mostrar `REQUEST SENT TO MODEL`, `MODEL RESPONSE` i `TOOL CALL DETECTED` amb `get_student_by_name`, i després el resultat de la funció.

---

## Pas 8 · Tancar el bucle

Completa el bucle: el resultat torna al model fins que respon amb text.

```text
Actualitza app/src/app.js per completar el bucle de function calling:
1. Agafa el missatge de l'usuari de la línia de comandes: process.argv.slice(2).join(" "). Si és buit, mostra com s'utilitza el programa (npm start -- "question") i surt. Fes-lo servir en lloc de la pregunta fixa de messages.
2. Crida callModel(messages).
3. Si la resposta té tool_calls: afegeix a messages el missatge assistant una sola vegada, tal com ha arribat. Executa cada crida com al pas 7 i, per a cadascuna, afegeix { role: "tool", tool_call_id: <id d'aquesta crida>, content: JSON.stringify(result) }. Després torna al punt 2.
4. La primera resposta sense tool_calls és la resposta final: mostra-la i acaba.
Permet com a màxim 5 crides al model; si s'arriba al límit, mostra un error i acaba.
Mostra aquests logs: USER MESSAGE, REQUEST SENT TO MODEL, MODEL RESPONSE, TOOL CALL DETECTED, FUNCTION EXECUTED, TOOL RESULT SENT BACK TO MODEL, FINAL MODEL RESPONSE.
Fes el codi senzill: un sol bucle a app.js i cap fitxer nou.
Escriu en anglès el codi, els noms de funcions, variables i fitxers, els comentaris i els logs.
```

**Comprova-ho** des de `ia-03-function-calling/app`, una pregunta per execució:

```bash
npm start -- "Quines tasques pendents té la Júlia?"
```

```bash
npm start -- "Quines tasques pendents tenen la Júlia i el Marc?"
```

```bash
npm start -- "Prepara un missatge amable per a la família de la Júlia perquè té tasques pendents"
```

```bash
npm start -- "Registra una incidència del Marc: no ha portat el material de classe"
```

```bash
npm start -- "Quina és l'última incidència del Marc?"
```

Als logs, la primera pregunta fa dues voltes (`get_student_by_name` i després `get_pending_tasks`). La segona porta dues crides a cada resposta, una per alumne.

---

# Tasca T3 · Projecte «Lliuraments»

Al repositori `lliuraments`, amb l'agent `build` i sense `/next-task`.

## T3.1 · Copia l'eina de la pràctica (terminal)

Des de `lliuraments`, amb `ia-03-function-calling` a la carpeta del costat:

```bash
cp -R ../ia-03-function-calling/app cli
git check-ignore -v cli/settings.env
```

```powershell
Copy-Item -Recurse ..\ia-03-function-calling\app cli
git check-ignore -v cli/settings.env
```

**Comprova-ho:** `git check-ignore` mostra la regla `*.env`: la clau no es pujarà.

## T3.2 · Una funció sobre les dades del projecte

```text
La carpeta cli/ és una eina de línia de comandes amb function calling copiada d'un altre projecte. Adapta-la a aquest projecte:
- Esborra cli/data/ i les funcions d'alumnes, tasques i incidències de cli/src/tools.js.
- Afegeix-hi una sola funció, get_student_summary({ name }): llegeix data/lliuraments.json de l'arrel del repositori (ruta a partir de import.meta.url, a cada crida), busca l'alumne pel nom sense distingir majúscules i minúscules i retorna { student: { id, name, group }, delivered, late, pending }: quantes pràctiques ha lliurat dins del termini, quantes tard i quantes no ha lliurat. Si name no és un string no buit o l'alumne no existeix, retorna { error: "..." }. No llança mai excepcions.
- Actualitza TOOLS i TOOL_DEFINITIONS perquè només continguin aquesta funció, amb una description clara en anglès.
- Canvia SYSTEM_MESSAGE de cli/src/app.js per aquest text: "You are an assistant for a teacher using a command-line tool about assignment deliveries. Always answer in the same language as the user. You cannot access the data directly. You can only request the available functions. Never invent data."
- No canviïs cli/src/llm.js ni el bucle de cli/src/app.js.
Escriu en anglès el codi, els noms i els comentaris.
```

## T3.3 · Prova-ho (terminal)

Canvia el nom pel d'un alumne del teu `data/lliuraments.json`:

```bash
cd cli
npm start -- "Quantes pràctiques té pendents la Júlia?"
```

Desa a `docs/cli-exemple.md` la pregunta, la resposta i el model que has fet servir.

## T3.4 · Commit, etiqueta i push

```text
Fes un commit de tots els canvis, crea l'etiqueta t3 i fes push de la branca main i de les etiquetes.
```

**Ampliació (opcional):** afegeix `get_practices()` i `get_pending_students({ practicaId })`, un test per funció a `tests/`, i prova l'eina amb Ollama canviant `cli/settings.env`.
