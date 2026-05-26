<style> .images { max-width: 960px; width: 100%; border: 1px solid grey; padding: 4px; margin-bottom: 25px; } </style>

# Bones pràctiques

Aquest tema tanca el curs amb criteris pràctics per treballar amb agents de programació.

Un agent útil no depèn només d'un bon model. Depèn sobretot de com definim l'objectiu, quin context li donem, quines eines pot fer servir, com validem les seves sortides i quan decidim que ha acabat.

---

## 1. Principis generals

Un agent és més fiable quan el tractem com un sistema de treball, no com una caixa màgica.

Bones pràctiques:

* definir clarament què ha d'aconseguir;
* donar-li context suficient, però no soroll innecessari;
* limitar les eines disponibles a les que realment calen;
* validar les sortides abans d'executar-les;
* deixar rastre de què ha fet i per què;
* comprovar el resultat amb tests, logs, inspecció visual o revisió humana.

La qualitat d'un agent no es mesura només per si respon bé una vegada, sinó per si pot treballar de manera repetible dins d'un projecte real.

---

## 2. Preparar bé el context

El context és una de les parts més importants del treball amb agents.

No vol dir posar tot el projecte dins del prompt. Vol dir donar al model la informació adequada en el moment adequat.

Context útil:

* instruccions del sistema;
* `AGENTS.md`;
* fitxers rellevants;
* estructura del projecte;
* sortides de terminal;
* errors;
* resultats de tests;
* documentació tècnica;
* decisions preses anteriorment;
* historial recent de la conversa.

Context poc útil:

* fitxers sencers que no tenen relació amb la tasca;
* instruccions duplicades o contradictòries;
* exemples antics que ja no representen el projecte;
* massa historial quan només cal l'estat actual;
* documentació genèrica quan hi ha codi local que ho explica millor.

Una bona regla és: el model ha de veure el que una persona necessitaria veure per prendre una decisió raonable.

---

## 3. Memòria persistent i oblit controlat

La memòria persistent permet que un agent no comenci de zero a cada sessió.

Pot guardar:

* preferències de l'usuari;
* convencions del projecte;
* decisions d'arquitectura;
* errors recurrents;
* workflows que han funcionat;
* resums de tasques acabades;
* patrons detectats en diverses sessions.

Però recordar-ho tot no és una bona pràctica. Una memòria massa gran, antiga o poc curada pot empitjorar les respostes.

Bones pràctiques:

* guardar només informació reutilitzable;
* separar memòria d'usuari, projecte i organització;
* incloure dates o versions quan una dada pugui quedar obsoleta;
* revisar la memòria abans d'incorporar canvis importants;
* permetre esborrar o substituir records;
* no guardar secrets, credencials ni dades personals innecessàries;
* verificar el codi actual abans de confiar en un record antic.

Una estructura simple pot ser:

```text
memory/
  project.md
  user-preferences.md
  workflows.md
  recurring-errors.md
  session-summaries/
```

També es pot crear un procés de consolidació:

```text
sessions anteriors
  -> resumir aprenentatges
  -> detectar errors repetits
  -> proposar canvis a la memòria
  -> revisió humana
  -> actualitzar memòria persistent
```

Això és semblant al que algunes plataformes anomenen `dreaming`: revisar sessions passades per millorar la memòria futura. La idea important no és el nom, sinó el procés: convertir historial brut en coneixement útil.

---

## 4. Definir objectius i criteris de finalització

L'objectiu és allò que l'agent ha d'aconseguir.

No és el mateix dir:

```text
Millora aquesta app.
```

que dir:

```text
Afegeix scroll vertical a la conversa, limita l'historial visible a 25 missatges i valida que la pàgina continua carregant al port 3000.
```

El segon objectiu és millor perquè inclou criteris observables.

Un bon objectiu pot indicar:

* què s'ha de canviar;
* què no s'ha de tocar;
* quin comportament s'espera;
* com s'ha de validar;
* quan es pot considerar acabat.

Un agent ha de finalitzar quan:

* l'objectiu està resolt;
* les comprovacions raonables han passat;
* falta una decisió humana;
* hi ha un bloqueig real;
* continuar afegiria risc sense aportar valor.

---

## 5. Treballar amb tasques petites

Les tasques grans augmenten el risc de perdre context, barrejar canvis i validar malament.

És millor dividir-les en passos.

Exemple massa gran:

```text
Refés tota l'aplicació, afegeix IA local, millora el disseny i documenta-ho.
```

Exemple més controlable:

```text
1. Crea el servidor.
2. Afegeix la pàgina web.
3. Connecta el model local.
4. Implementa function calling.
5. Valida el flux.
6. Documenta l'exemple.
```

Aquesta divisió permet comprovar cada part abans de continuar.

---

## 6. Gestionar tasques del projecte

Si el projecte té gestió de tasques, ha d'estar fora de la configuració privada de l'eina.

No tots els projectes necessiten aquesta capa. En una configuració reduïda per a models locals petits, com `projecteOpenCodeLocal`, pot ser soroll innecessari. En canvi, en un projecte gran o de llarga durada, com `projecteOpenCode`, ajuda a mantenir continuïtat entre sessions.

Per exemple:

```text
tasks/pending.md
tasks/done.md
```

Un workflow senzill pot ser:

```text
Abans de començar:
  llegir tasks/pending.md

En acabar:
  actualitzar tasks/done.md
  actualitzar tasks/pending.md
```

Això és millor que deixar les decisions només a l'historial d'un xat, perquè queda documentat dins del projecte.

---

## 7. Definir workflows a AGENTS.md

`AGENTS.md` és un bon lloc per documentar com ha de treballar l'agent dins del projecte.

Pot incloure:

* com instal·lar dependències;
* com executar tests;
* com arrencar el servidor;
* quines carpetes no s'han de tocar;
* com es validen els canvis;
* quin estil de codi es fa servir;
* quin procés cal seguir abans de fer canvis grans.

Exemple:

```md
Before architectural changes, read docs/architecture.md and docs/decisions.md.

Before starting work, check tasks/pending.md.

After finishing work, update tasks/done.md and tasks/pending.md.

Run npm test before reporting the task as complete.
```

Aquestes instruccions fan que diferents sessions d'agent treballin amb criteris consistents.

---

## 8. Separar context, skills, agents, commands i tools

És fàcil barrejar conceptes.

Una separació pràctica és:

| Element | Funció |
| --- | --- |
| `AGENTS.md` | Context base i normes del projecte |
| Skill | Coneixement reutilitzable sobre una tasca o tecnologia |
| Agent | Perfil de comportament, rol i permisos |
| Command | Prompt reutilitzable per a una acció freqüent |
| Tool | Acció executable amb arguments i resultat |

No tot ha de ser una tool. I no tot ha d'anar a `AGENTS.md`.

Si és coneixement estable del projecte, pot anar a documentació o `AGENTS.md`.

Si és una acció executable, ha de ser una tool.

Si és una manera repetible de demanar una feina, pot ser un command.

---

## 9. Dissenyar tools robustes

Una tool és una frontera entre el model i el món real.

Per això ha de ser clara i segura.

Una bona tool hauria de tenir:

* nom explícit;
* descripció curta;
* paràmetres tipats;
* valors requerits ben definits;
* validació d'entrada;
* errors llegibles;
* resultat estructurat;
* permisos limitats.

Exemple de mala definició:

```text
run(command)
```

És massa oberta.

Exemple més segur:

```text
run_tests(packageName, testPattern)
```

És més limitada, més fàcil de validar i més fàcil d'explicar al model.

---

## 10. Validar les sortides del model

El model pot equivocar-se encara que el prompt sigui bo.

Per això no hem d'executar directament qualsevol sortida.

Cal validar:

* que el JSON és vàlid;
* que els tipus són correctes;
* que els camps obligatoris existeixen;
* que els valors estan dins de rang;
* que els paths existeixen;
* que els colors, coordenades o identificadors són acceptables;
* que una ordre no és destructiva;
* que una tool existeix realment.

En una aplicació amb canvas, per exemple, no n'hi ha prou que el model retorni:

```json
{
  "shape": "circle",
  "fillColor": "verd",
  "x": 50
}
```

El servidor ha de normalitzar o rebutjar valors segons les regles de l'aplicació.

---

## 11. Function calling i structured outputs

El function calling serveix quan volem que el model triï una acció i en retorni els arguments.

Exemple:

```text
Usuari: dibuixa un cercle vermell al centre
Model: draw_circle({ "x": 400, "y": 300, "fillColor": "red" })
Servidor: valida i executa l'acció
```

Structured outputs serveix quan volem una resposta amb una estructura concreta, però no necessàriament executar una eina.

Exemple:

```json
{
  "title": "Informe",
  "summary": "Canvis principals",
  "risk": "low"
}
```

Bones pràctiques:

* descriure les funcions disponibles al prompt o al schema;
* fer servir noms de funcions clars;
* definir arguments amb tipus i descripció;
* demanar valors normalitzats;
* usar placeholders com `"random"` quan el model no tingui dades numèriques;
* validar sempre abans d'executar;
* mostrar la tool call i els arguments en mode depuració.

---

## 12. Treballar amb servidors i models locals

Quan es treballa amb models locals, convé separar configuració i codi.

Per exemple:

```text
settings.env
```

Pot contenir:

```text
MODEL_BASE_URL=http://localhost:8000/v1
MODEL_NAME=...
MODEL_API_KEY=...
PORT=3000
```

Bones pràctiques:

* no deixar URLs i models fixats dins del codi;
* documentar com arrencar vLLM, Ollama o llama.cpp;
* comprovar `/v1/models` abans de cridar `/v1/chat/completions`;
* deixar logs útils quan el model no respon;
* controlar ports ocupats;
* tenir present la memòria VRAM disponible;
* separar entorn de desenvolupament i producció.

Un `package.json` pot tenir scripts diferents per a preproducció i producció:

```json
{
  "scripts": {
    "dev": "node --watch ./server/app.js",
    "pm2start": "pm2 start ./server/app.js --name app",
    "pm2logs": "pm2 logs app"
  }
}
```

---

## 13. Seguretat i permisos

Un agent amb eines pot fer canvis reals.

Per això cal pensar en permisos.

Bones pràctiques:

* evitar eines massa genèriques;
* no donar accés d'escriptura si només cal lectura;
* revisar ordres destructives;
* no exposar secrets al prompt;
* no guardar claus en fitxers versionats;
* limitar accions de xarxa si no calen;
* demanar confirmació en canvis irreversibles.

La pregunta important és: què podria passar si el model interpreta malament la instrucció?

---

## 14. Observabilitat i depuració

Quan un agent falla, necessitem entendre on ha fallat.

És útil mostrar o guardar:

* prompt rellevant;
* model utilitzat;
* tool calls;
* arguments retornats;
* resposta de les tools;
* errors de validació;
* temps de resposta;
* logs del servidor.

En entorns d'aprenentatge, mostrar la funció i els arguments retornats pel model ajuda molt a entendre el function calling.

No cal mostrar la cadena de pensament interna del model. És millor mostrar traces observables: decisions externes, eines cridades, arguments, resultats i errors.

---

## 15. Documentació i traçabilitat

La documentació del projecte ha d'estar al projecte, no amagada dins d'una configuració local de l'eina.

Exemples:

```text
docs/architecture.md
docs/decisions.md
tasks/pending.md
tasks/done.md
README.md
AGENTS.md
```

`AGENTS.md` pot apuntar a aquests documents, però no hauria de substituir tota la documentació.

Exemple:

```md
Before changing authentication, read docs/authentication.md.
Before changing architecture, read docs/architecture.md and docs/decisions.md.
```

Això fa que l'agent trobi el coneixement important sense duplicar-lo.
