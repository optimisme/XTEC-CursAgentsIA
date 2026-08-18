# Objectiu

Vull implementar la pàgina web descrita a continuació fent servir un **agent petit, amb poc context i un índex d’intel·ligència baix**.

Per fer-ho necessito **tres prompts**:

1. Un prompt que generi l’**arnès bàsic d’OpenCode** a l'arxiu "prompts/prompt-arnes.md", amb:

   * skills
   * `PLAN.md`
   * agents
   * `AGENTS.md`



2. Un prompt que generi la **llista de tasques** a l'arxiu "prompts/prompt-tasques.md" necessàries per desenvolupar el servidor web en un únic arxiu:

   * `tasks/tasks.md`

   Les tasques s’han de definir mitjançant **descomposició atòmica** a l'arxiu "prompts/prompt-implementa.md", en un format que permeti fer fàcilment el seguiment de:

   * les tasques pendents;
   * les tasques en curs;
   * les tasques completades.

   Cada tasca ha de superar els tests corresponents abans de considerar-se completada.

   En el cas de les funcionalitats web, hi ha disponible l’**MCP Playwright**, que s’ha de fer servir per validar-les. Els tests també s’han de reutilitzar per prevenir **regressions** quan s’implementin funcionalitats noves.

3. Un prompt per executar el **bucle agèntic d’implementació**, que desenvolupi l’aplicació a partir de les tasques definides a `tasks/tasks.md`, executant els tests de validació i de prevenció de regressions corresponents.

---

# Arquitectura del servidor

El servidor ha de funcionar amb:

* **Node.js**
* **Express**
* **SQLite**

Tot el servidor ha d’estar dins de la carpeta:

```text
server/
```

Els fitxers estàtics de la interfície web han d’estar dins de:

```text
server/public/
```

Els fitxers de **skills** i **agents** han de tenir les capçaleres correctes.

En el cas dels agents, la capçalera ha d’indicar el mode: 

* primary 
* subagent

---

# Funcionament de l’aplicació

## Usuari administrador

Hi ha un únic usuari administrador:

```text
admin
```

La seva contrasenya està definida a la variable d'entorn SERVER_ADMIN_PWD a l'arxiu:

```text
server/settings.env
```

---

## Gestió d’alumnes

L’usuari `admin` pot definir usuaris alumnes des d’un apartat **Alumnes**.

Cada alumne té:

* nom;
* correu electrònic;
* contrasenya.

El correu electrònic i la contrasenya es fan servir per accedir a l’espai personal de l’alumne.

La contrasenya **no s’ha de guardar en text pla**. A la base de dades només se n’ha de guardar el **hash MD5**.

Per a cada alumne, l’administrador pot accedir al llistat de les entregues que ha fet.

---

## Gestió de pràctiques

L’usuari `admin` pot definir pràctiques des d’un apartat **Pràctiques**.

Cada pràctica té:

* un títol;
* uns criteris d’acceptació;

Per a cada pràctica, l’administrador pot accedir al llistat d’entregues que ha rebut.

---

## Gestió de les entregues per part de l’administrador

L’usuari `admin` pot marcar les entregues com a **revisades**.

Per tant, hi ha dues maneres de consultar els llistats d’entregues:

1. Seleccionant un **alumne** per veure totes les seves entregues.
2. Seleccionant una **pràctica** per veure totes les entregues corresponents a aquella pràctica.

---

# Espai personal de l’alumne

L’alumne accedeix al seu espai personal mitjançant:

* el seu correu electrònic;
* la seva contrasenya.

L’espai personal té, com a mínim, els apartats següents.

## Entregues

A l’apartat **Entregues**, l’alumne pot veure la llista de les entregues que ha fet.

Per a cada entrega ha de poder veure:

* si ha estat acceptada per l'agent de opencode
* si ha estat revisada pel professor

L’alumne també pot **esborrar les entregues que encara no hagin estat revisades**.

---

## Enviar

A l’apartat **Enviar**, l’alumne pot fer una nova entrega.

Per fer-la:

1. Escull la pràctica a la qual correspon l’entrega.
2. Escriu o enganxa la URL del repositori de GitHub.

---

# Valoració automàtica de les entregues

Les entregues s’han de valorar mitjançant un **agent d’OpenCode amb un arnès específic per a aquesta tasca**.

L’agent valorador rebrà:

* les instruccions necessàries per fer la valoració;
* els criteris d’acceptació definits pel professor per a aquella pràctica;
* la URL del repositori de GitHub de l’entrega.

L’agent haurà de:

1. Descarregar el repositori de la pràctica en una carpeta temporal.
2. Analitzar-ne el contingut.
3. Fer la valoració segons els criteris d’acceptació.
4. Actualitzar a la base de dades l’estat de l’entrega segons el resultat de la valoració.
5. Esborrar finalment tots els fitxers temporals utilitzats.

L’**arnès d’OpenCode específic del valorador** s’ha de desenvolupar com a part del servidor.

# Pàgina principal (login comú)

La pàgina principal ha de mostrar el formulari de login que automàticament anirà a la pàgina d'alumne o professor un cop identificat. L'admin entra amb la paraula "admin" enlloc de amb un correu electrònic.

# Pàgines i endpoints

En generar els tres prompts, defineix també les **pàgines de la interfície i els endpoints HTTP necessaris per implementar-les**, mantenint una correspondència clara entre frontend i API.

Tingues en compte com a mínim aquestes pàgines:

- `/` — login comú per a administrador i alumnes;
- `/admin` — espai principal de l'administrador;
- `/admin/alumnes` — gestió d'alumnes;
- `/admin/practiques` — gestió de pràctiques;
- `/admin/entregues` — consulta i revisió d'entregues;
- `/alumne` — espai principal de l'alumne;
- `/alumne/entregues` — consulta de les seves entregues;
- `/alumne/enviar` — formulari per fer una nova entrega.

Defineix els endpoints REST necessaris per donar suport a aquestes pàgines, incloent com a mínim:

- autenticació, sessió i logout;
- CRUD d'alumnes;
- CRUD de pràctiques;
- consulta d'entregues per alumne;
- consulta d'entregues per pràctica;
- creació i eliminació d'entregues de l'alumne;
- marcatge d'una entrega com a revisada;
- consulta de l'estat i resultat de la valoració automàtica.

Els endpoints han de tenir una estructura coherent, per exemple sota `/api/...`, i s'han de definir explícitament als prompts generats perquè posteriorment es puguin convertir en tasques atòmiques i tests.

---

# Arxius que necessito

Dona’m **tres arxius**:

1. **Prompt per generar l’arnès**

   * skills;
   * `PLAN.md`;
   * agents;
   * `AGENTS.md`.

2. **Prompt per generar les tasques**

   * les tasques s’han de guardar a `tasks/tasks.md`;
   * s’ha de fer servir descomposició atòmica;
   * el format ha de permetre seguir fàcilment l’estat de cada tasca.

3. **Prompt per executar el bucle agèntic**

   * ha d’implementar la pàgina web a partir de les tasques definides a `tasks/tasks.md`;
   * ha d’executar els tests de validació corresponents;
   * ha d’executar els tests necessaris per prevenir regressions.
