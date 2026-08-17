# Plan del Projecte — Validador d'Entregades de Pràctiques

## Objectiu

Desenvolupar una aplicació web amb servidor Node.js capaç de validar entregues de pràctiques de programació seguint criteris d'acceptació definits pel professor.

La validació s'executa mitjançant invocacions no interactives a OpenCode (agent runtime de revisió), que inspecciona el contingut dels repositoris GitHub de l'alumne i retorna resultats estructurats amb evidències i feedback.

El model d'IA utilitzat per a la revisió és configurable i resideix al projecte OpenCode runtime, no a la lògica de negoci del servidor.

## Requisits funcionals

- Gestió de pràctiques (crear, llegir, actualitzar, esborrar).
- Definició de múltiples criteris d'acceptació per pràctica.
- Recepció d'entregues per part de l'alumne (URL pública del repositori GitHub).
- Validació de la URL: només repositoris públics accessibles per HTTPS a `github.com`.
- Rebuig d'URLs Git arbitràries, hosts alternatius o esquemes diferents.
- Obtenció temporal del repositori (clonat).
- Projecte OpenCode runtime de revisió especialitzat.
- Configuració independent del provider, model, baseURL, límits i opcions.
- Invocació d'OpenCode des de Node.js de manera no interactiva.
- Agent runtime especialitzat en revisió d'entregues.
- Prompt específic i breu per criteri.
- Inspecció de fitxers per part de l'agent runtime (lectura només).
- Resposta estructurada amb `status`, `evidence` i `feedback`.
- Validació individual de cada criteri.
- Persistència de pràctiques, criteris, entregues i resultats.

## Requisits no funcionals

### Seguretat

- El repositori de l'alumne es tracta com a contingut no fiable.
- L'agent runtime té permisos de lectura (mínim necessari).
- No hi ha GitHub MCP al runtime.
- No s'executa codi del repositori sense un mecanisme explícit d'aïllament.
- Prevenció de prompt injection procedent del contingut del repositori.

### Gestió d'errors

- Timeouts a les crides a OpenCode.
- Gestió de processos OpenCode fallits.
- Respostes no estructurades o incorrectes rebutjades pel servidor.

### Mantenibilitat

- Desacoblament entre servidor Node.js i model d'IA.
- El canvi de provider/model es fa des de la configuració OpenCode runtime.

### Accessibilitat

- Interfície web que segueix les normes definides a `.opencode/skills/web-design.md`.

### Validació

- Validació individual de funcionalitats.
- Validació de regressions.
- Ús de Puppeteer MCP quan correspongui.

## Arquitectura

### Visió general

El sistema es compon de:

1. **Servidor Node.js** — gestiona pràctiques, criteris, entregues i invoca OpenCode.
2. **Interfície web** — formularis per al professor i l'alumne.
3. **Persistència** — base de dades local per a pràctiques, criteris, entregues i resultats.
4. **Servei d'invocació OpenCode** — responsable de cridar OpenCode de manera no interactiva.
5. **Projecte OpenCode runtime** — arnès especialitzat en revisió d'entregues.

### Flux conceptual

```
Servidor Node.js
  → repositori temporal
  → OpenCode (invocació no interactiva)
  → agent runtime de revisió
  → model configurat a OpenCode
  → resultat estructurat
```

### Separació de rols

- **OpenCode de desenvolupament** (`.opencode/`) — agents orchestrator, executor, validator i reviewer per desenvolupar l'aplicació.
- **OpenCode runtime de revisió** (projecte independent) — agent de revisió per validar entregues.

Aquests dos projectes OpenCode no s'han de confondre ni compartir configuració.

### Mecanisme de configuració externa

El servidor estableix `OPENCODE_CONFIG` o `OPENCODE_CONFIG_DIR` per apuntar a la configuració de l'arnès runtime mentre el directori de treball és el repositori clonat de l'alumne.

Això evita copiar la configuració a dins del repositori temporal.

### Contracte de resposta

Cada crida a OpenCode espera una resposta estructurada:

```json
{
  "status": "PASS" | "FAIL" | "NEEDS_REVIEW",
  "evidence": [
    {
      "file": "ruta/al/fitxer.md",
      "location": "fragment o línia rellevant",
      "description": "descripció de l'evidència"
    }
  ],
  "feedback": "text concís per a l'alumne"
}
```

El servidor valida aquest contracte i rebutja respostes que no el compleixin.

### Gestió d'errors tècnics

Si un error tècnic impedeix completar la validació d'un criteri:

- No es considera PASS.
- El resultat s'emmagatzema amb un estat distint (`TECHNICAL_ERROR` o similar).
- El resultat global no es veu afectat com a funcional sinó com a error tècnic registrat.

## Estructura del projecte

```
├── .opencode/
│   ├── agents/          # Agents de desenvolupament (orchestrator, executor, validator, reviewer)
│   └── skills/          # Skills de desenvolupament (web-design, github-task-management, etc.)
│
├── src/
│   ├── server.js        # Punt d'entrada del servidor
│   ├── routes/          # Rutes HTTP
│   ├── services/        # Lògica de negoci (pràctiques, criteris, entregues, validació)
│   │   ├── practice.js
│   │   ├── criterion.js
│   │   ├── submission.js
│   │   └── validation.js  # Servei responsable d'invocar OpenCode
│   ├── models/          # Models de dades
│   └── lib/             # Utilitats (validació URLs, gestió temporal, etc.)
│
├── runtime-opencode/    # Projecte OpenCode runtime de revisió
│   ├── opencode.json    # Configuració (provider, model, baseURL, etc.)
│   ├── instructions.md  # Instruccions generals de revisió
│   ├── agents/
│   │   └── reviewer.json  # Definició de l'agent de revisió
│   └── skills/          # Skills específics de runtime (opcional)
│
├── tests/
├── package.json
└── PLAN.md
```

El directori `runtime-opencode/` és un projecte OpenCode complet i independent, separat de `.opencode/` (desenvolupament).

L'agent runtime de revisió no comparteix cap agent de desenvolupament ni cap permís.

## Flux principal

1. El **professor** defineix una pràctica amb criteris d'acceptació.
2. L'**alumne** entrega la pràctica indicant la URL del seu repositori GitHub.
3. El **servidor** valida l'URL i clona el repositori a un directori temporal.
4. Per a **cada criteri**, el servidor:
   a. Prepara el context mínim per al criteri.
   b. Invoque OpenCode de manera no interactiva amb el repositori temporal com a directori de treball.
   c. L'agent runtime inspecciona el repositori.
   d. OpenCode retorna una resposta estructurada.
   e. El servidor valida el contracte i persisteix el resultat.
5. El servidor calcula el resultat global i el retorna.
6. El directori temporal s'elimina.

## Flux de validació individual

1. Rebre el criteri a validar.
2. Construir el context mínim (identificador de pràctica, identificador del criteri, text del criteri).
3. Invocar OpenCode no interactivament amb:
   - `dir` = directori del repositori clonat.
   - `agent` = agent runtime de revisió (selecció explícita).
4. L'agent runtime inspecciona els fitxers del repositori.
5. OpenCode retorna una resposta estructurada.
6. El servidor valida el contracte de resposta.
7. Si el contracte no es compleix → error tècnic.
8. Si el contracte és vàlid → persistir resultat, evidències i feedback.

## Contracte de resposta

Cada crida a OpenCode ha de retornar una resposta estructurada amb el següent format:

```json
{
  "status": "PASS" | "FAIL" | "NEEDS_REVIEW",
  "evidence": [
    {
      "file": "ruta/del/fitxer.md",
      "location": "fragment rellevant",
      "description": "descripció de l'evidència"
    }
  ],
  "feedback": "text concís i útil per a l'alumne"
}
```

El servidor ha de validar aquest contracte i rebutjar o marcar com a error tècnic qualsevol resposta que no el compleixi.

No es depèn de text lliure ambigu per determinar el resultat.

## Resultat global de l'entrega

A partir dels resultats dels criteris:

- Si almenys un criteri és `FAIL` → resultat global: **FAIL**.
- Si no hi ha `FAIL` però almenys un criteri és `NEEDS_REVIEW` → resultat global: **NEEDS_REVIEW**.
- Només si tots els criteris són `PASS` → resultat global: **PASS**.
- Si un criteri produeix un error tècnic (no es va poder revisar) → no s'interpreta com a `PASS`. Aquest cas es registra i es pot indicar sense confondre'l amb el resultat funcional.

## Fases

### FASE-01: Configuració inicial del projecte

**Objectiu:** Crear l'estructura base del projecte Node.js i l'arnès OpenCode runtime.

**Resultat esperat:**
- Projecte Node.js amb `package.json` i estructura de carpetes definida.
- Servidor que respon a `/health`.
- Projecte OpenCode runtime amb `opencode.json`, `instructions.md` i agent `reviewer`.
- Separació clara entre `.opencode/` (desenvolupament) i `runtime-opencode/` (runtime).

**Dependències:** Cap.

**Completada quan:** El servidor inicia i respon a `/health`; l'arnès runtime existeix amb la seva estructura mínima.

### FASE-02: Gestió de pràctiques i criteris

**Objectiu:** Implementar la lògica de creació i gestió de pràctiques amb criteris d'acceptació.

**Resultat esperat:**
- Rutes CRUD per a pràctiques.
- Rutes CRUD per a criteris associats a una pràctica.
- Persistència de pràctiques i criteris (base de dades local).

**Dependències:** FASE-01.

**Completada quan:** Es poden crear, llegir, actualitzar i esborrar pràctiques amb els seus criteris.

### FASE-03: Recepció d'entregues

**Objectiu:** Permetre que l'alumne lliuri una pràctica indicant la URL del seu repositori.

**Resultat esperat:**
- Ruta per rebre entregues.
- Validació de URL: només HTTPS a `github.com`, repositori públic.
- Rebuig d'URLs Git arbitràries, hosts alternatius o esquemes diferents.
- Persistència de l'entrega associada a la pràctica i l'alumne.

**Dependències:** FASE-02.

**Completada quan:** Es poden registrar entregues i les URLs no vàlides es rebuten.

### FASE-04: Obtenir repositoris temporals

**Objectiu:** Clonar repositoris GitHub públics a directoris temporals i netejar-los després.

**Resultat esperat:**
- Funcionalitat per clonar un repositori públic per HTTPS.
- Creació i eliminació de directoris temporals.
- Gestió d'errors en cas de clonació fallida.

**Dependències:** FASE-03.

**Completada quan:** Es poden clonar repositoris públics i esborrar els directoris temporals després d'ús.

### FASE-05: Configuració de l'arnès OpenCode runtime

**Objectiu:** Definir i configurar l'arnès OpenCode per a la revisió d'entregues.

**Resultat esperat:**
- `runtime-opencode/opencode.json` amb configuració del provider/model.
- `runtime-opencode/instructions.md` amb instruccions generals de revisió.
- Agent `reviewer` definit a l'arnès runtime amb permisos restrictius.
- Contracte de resposta definit a les instruccions.

**Dependències:** FASE-01.

**Completada quan:** L'agent runtime existeix amb configuració, instruccions i agent definits.

### FASE-06: Invocació no interactiva d'OpenCode

**Objectiu:** Implementar el servei que invoque OpenCode de manera no interactiva.

**Resultat esperat:**
- Servei que cridi OpenCode amb arguments no interactius.
- Establiment del directori de treball al repositori clonat.
- Establiment de `OPENCODE_CONFIG` o equivalent apuntant a `runtime-opencode/`.
- Selecció explícita de l'agent runtime de revisió.
- Captura de sortida, errors i codi de sortida.
- Aplicació de timeouts.

**Dependències:** FASE-04, FASE-05.

**Completada quan:** El servidor pot cridar OpenCode de manera no interactiva amb un repositori temporal i rebre sortida.

### FASE-07: Construcció del prompt per criteri

**Objectiu:** Generar el context mínim per a cada criteri abans d'invocar OpenCode.

**Resultat esperat:**
- Funcionalitat que construeixi un prompt breu i específic per criteri.
- El prompt inclou: identificador de pràctica, identificador del criteri, text del criteri.
- No s'inclou informació que OpenCode pugui obtenir inspeccionant el repositori.
- Les instruccions generals de revisió resideixen a `runtime-opencode/instructions.md`.

**Dependències:** FASE-06.

**Completada quan:** Es pot generar un prompt per criteri amb la informació mínima necessària.

### FASE-08: Validació del contracte de resposta

**Objectiu:** Validar que la resposta d'OpenCode compleix el contracte estructurat.

**Resultat esperat:**
- Validació de `status`, `evidence` i `feedback`.
- Rebujat o marca com a error tècnic si no es compleix el contracte.
- Persistència del resultat, evidències i feedback si és vàlid.

**Dependències:** FASE-07.

**Completada quan:** Les respostes estructurades es validen i es persisteixen correctament.

### FASE-09: Resultat global i interfície web

**Objectiu:** Calcular el resultat global i exposar-ho a través de la interfície web.

**Resultat esperat:**
- Càlcul del resultat global segons les regles definides.
- Interfície web per al professor (definir pràctiques) i alumne (entregar).
- Mostrar resultats individuals i global.
- Interfície amb estètica moderna i accessible (web-design).

**Dependències:** FASE-06, FASE-07, FASE-08.

**Completada quan:** Es pot lliurar una pràctica completa i veure els resultats des de la interfície.

### FASE-10: Validació completa i neteja

**Objectiu:** Assegurar que tot el flux funciona conjuntament i la neteja de recursos temporals.

**Resultat esperat:**
- Flux complet: pràctica → criteris → entrega → clonat → revisió → resultat.
- Assegurar que no queden processos ni directoris temporals abandonats.
- Gestió correcta d'errors a tot el flux.

**Dependències:** FASE-09.

**Completada quan:** El flux complet funciona de manera end-to-end amb neteja correcta.

## Estratègia de validació

- Validació individual de cada component segons la fase corresponent.
- Proves de la invocació d'OpenCode (FASE-06, FASE-07).
- Proves del contracte estructurat (FASE-08).
- Proves d'errors i timeouts.
- Proves de contingut no fiable (repositoris amb prompt injection).
- Ús de Puppeteer MCP per validar la interfície web.
- Proves de regressió després de cada fase.
- Validació de fase abans de passar a la següent.
- Validació global final amb el flux complet end-to-end.

## Estratègia GitHub

- `PLAN.md` defineix el pla estable del projecte.
- **GitHub Issues** representaran les tasques ATD per a cada fase.
- **GitHub Project** gestionarà l'estat operacional de les tasques.
- Bugs i tasques de funció seguiran el mateix flux d'execució.
- L'estat de desenvolupament no es duplicarà dins de `PLAN.md`.

## Criteris globals de finalització

El projecte es considerarà acabat quan:

1. El servidor Node.js **invoca OpenCode i no el model directament** per fer les revisions.
2. L'arnès OpenCode runtime és independent dels agents de desenvolupament (separat a `runtime-opencode/`).
3. Cada criteri produeix una resposta estructurada validada pel servidor.
4. El canvi de provider o model es pot realitzar principalment des de la configuració OpenCode runtime sense modificar la lògica de negoci del servidor.
5. La configuració i els agents de l'arnès runtime es mantenen separats del repositori temporal de l'alumne encara que aquest sigui el directori de treball d'OpenCode.
6. El repositori de l'alumne es tracta com a contingut no fiable.
7. No queden processos ni directoris temporals abandonats després de la validació.
8. El resultat global es calcula correctament a partir dels resultats dels criteris.
9. La interfície web compleix les normes de web-design.

## Revisió final

Abans de considerar el projecte acabat, s'ha de verificar:

- Coherència arquitectònica.
- Separació clara entre OpenCode de desenvolupament i OpenCode runtime.
- Dependències entre fases correctes.
- Cobertura de tots els requisits funcionals i no funcionals.
- Absència de contradiccions al pla.
- Absència d'una integració directa servidor → model per a la validació.
- Possibilitat de transformar cada fase en tasques ATD petites a GitHub Issues.
- Verificabilitat dels resultats esperats per fase.
- Absència de tasques operacionals duplicades a `PLAN.md`.
