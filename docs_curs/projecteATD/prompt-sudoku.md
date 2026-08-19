# Objectiu

Vull implementar un **joc de Sudoku en HTML, CSS i JavaScript** fent servir un **agent petit, amb poc context i un índex d’intel·ligència baix**.

Per facilitar-ne el desenvolupament, necessito dividir el procés en tres fases i generar **tres prompts independents**:

1. un prompt per configurar l’**arnès de desenvolupament**;
2. un prompt per generar la **planificació de tasques**;
3. un prompt per executar la **implementació completa** seguint aquestes tasques.

Els prompts han de ser clars, directes i especialment pensats perquè un model petit pugui treballar amb poc context.

Genera els següents arxius:

* `prompts/prompt-sudoku-1-arnes.md`
* `prompts/prompt-sudoku-2-tasques.md`
* `prompts/prompt-sudoku-3-implementa.md`

No implementis el Sudoku. Genera només aquests tres prompts.

---

# 1. Prompt de configuració de l’arnès

`prompt-sudoku-1-arnes.md` ha de preparar l’arnès del projecte abans de començar el desenvolupament.

Ha de definir els **agents, subagents i skills** necessaris, sense implementar encara funcionalitats ni generar `tasks-sudoku.md`.

L’arnès ha d’estar especialment pensat perquè l’agent principal treballi amb poc context i delegui tasques simples a subagents especialitzats.

Com a mínim, ha d’existir:

* un agent principal/orquestrador;
* un subagent d’implementació;
* un subagent de tests;
* un subagent de revisió o validació.

L’agent principal ha de:

* consultar l’estat del projecte;
* seleccionar una sola tasca cada vegada;
* delegar-ne la implementació;
* delegar-ne la validació;
* evitar que diferents agents modifiquin simultàniament els mateixos fitxers;
* avançar només quan la tasca actual estigui completament validada.

L’agent que implementa una tasca **no ha de ser l’únic encarregat de validar-la**.

## Skills

Defineix com a mínim skills per a:

### Gestió de tasques

Ha de permetre:

* seleccionar la següent tasca;
* respectar prioritats i dependències;
* actualitzar-ne l’estat;
* evitar implementar funcionalitats de tasques futures.

### Execució de tasques petites

Ha de fomentar:

* una única responsabilitat per tasca;
* canvis petits i localitzats;
* evitar refactors innecessaris;
* treballar amb el mínim context possible.

### Tests i prevenció de regressions

Ha de definir que:

* cada funcionalitat nova ha de tenir proves;
* els tests existents no s’han de trencar;
* els tests anteriors formen part de la regressió;
* cap tasca es pot considerar completada si hi ha tests fallant.

### Validació amb navegador

Ha de permetre validar la interfície mitjançant l’eina o MCP de navegador disponible.

Les proves han de simular accions reals d’usuari.

### Disseny gràfic

Defineix una skill específica per mantenir una estètica inspirada en el **disseny tradicional japonès**, però aplicada a una interfície moderna, funcional i clara.

Ha de definir:

* paleta de colors;
* tipografia;
* jerarquia visual;
* tauler del Sudoku;
* botons;
* focus;
* selecció;
* errors;
* estats interactius;
* responsive;
* accessibilitat.

La paleta pot inspirar-se en colors tradicionals japonesos com:

* `sumi`;
* `washi`;
* `ai`;
* `shu` o `aka`.

Evita una estètica excessivament decorativa.

---

# 2. Prompt de definició de tasques

`prompt-sudoku-2-tasques.md` ha de generar tota la planificació del desenvolupament en un únic arxiu:

`tasks-sudoku.md`

No ha d’implementar encara cap funcionalitat.

El projecte ha de ser una aplicació web senzilla basada principalment en:

* HTML;
* CSS;
* JavaScript.

Prioritza una arquitectura fàcil d’entendre, amb poques dependències i adequada perquè un agent petit pugui modificar-la sense necessitat de carregar gaire context.

La planificació ha de separar, quan sigui possible:

* estructura del projecte;
* estat del joc;
* lògica del Sudoku;
* validació;
* interfície;
* interacció;
* tests;
* accessibilitat;
* disseny visual.

## Tasques

Divideix el projecte en **tasques petites i ordenades per prioritat i dependències**.

Evita tasques grans que impliquin diverses funcionalitats independents.

Cada tasca ha d’indicar com a mínim:

* identificador;
* estat;
* prioritat;
* objectiu;
* dependències;
* criteris d’acceptació;
* tests necessaris.

Utilitza aquests estats:

* `[backlog]:N`
* `[ready]:N`
* `[in progress]:N`
* `[in review]:N`
* `[done]`

On `N` és la prioritat i els números més petits indiquen tasques que s’han de desenvolupar abans.

Només les tasques sense dependències pendents poden quedar `[ready]`.

## Funcionalitats a planificar

La planificació ha de cobrir progressivament, com a mínim:

* tauler de Sudoku 9×9;
* diferenciació visual dels blocs 3×3;
* càrrega d’una partida;
* cel·les inicials no editables;
* introducció i eliminació de números;
* navegació amb ratolí i teclat;
* validació de files;
* validació de columnes;
* validació de blocs;
* detecció de conflictes;
* detecció de partida completada;
* reinici de partida;
* diferents Sudokus o nivells;
* disseny responsive;
* accessibilitat;
* aplicació de la skill gràfica japonesa.

Funcionalitats més complexes com generació automàtica de Sudokus, notes de candidats, undo/redo o persistència poden deixar-se com a millores posteriors si compliquen massa la primera versió.

## Tests i regressions

Les proves han de formar part de la planificació des del principi.

Prioritza tests de JavaScript per a la lògica i tests de navegador per a la interacció i la UI.

Els tests han de ser **acumulatius**:

* cada nova funcionalitat ha de tenir els seus tests;
* una nova tasca també ha de continuar passant tots els tests implementats anteriorment;
* qualsevol regressió impedeix completar la tasca.

Agrupa les tasques en fases si això ajuda a mantenir una seqüència clara de desenvolupament.

---

# 3. Prompt d’implementació

`prompt-sudoku-3-implementa.md` ha de desenvolupar el projecte a partir de `tasks-sudoku.md`.

Ha de seguir un **bucle de desenvolupament simple i repetible**, adequat per a agents petits.

Per cada iteració:

1. llegir `tasks-sudoku.md`;
2. seleccionar la tasca `[ready]` amb més prioritat;
3. comprovar-ne les dependències;
4. marcar-la `[in progress]`;
5. delegar la implementació a un subagent;
6. limitar els canvis exclusivament a la tasca actual;
7. crear o actualitzar els tests necessaris;
8. executar els tests de la funcionalitat;
9. executar tots els tests de regressió;
10. marcar la tasca `[in review]`;
11. fer-la revisar per un agent diferent de l’implementador;
12. validar-ne els criteris d’acceptació;
13. si afecta la UI, validar-la també amb navegador;
14. corregir qualsevol error detectat;
15. repetir els tests;
16. marcar-la `[done]` només quan totes les validacions siguin correctes;
17. actualitzar les tasques que ara puguin passar a `[ready]`;
18. continuar amb la següent tasca.

No s’han d’implementar funcionalitats de tasques futures.

No s’han de fer refactors generals si no són necessaris per completar la tasca actual.

No s’ha de marcar una tasca `[done]` simplement perquè la implementació sembli correcta.

Una tasca només està completada si:

* compleix els criteris d’acceptació;
* passen els seus tests;
* passen tots els tests previs;
* no introdueix regressions;
* ha estat revisada per un agent diferent de l’implementador.

---

# Criteris generals

Els tres prompts han d’estar optimitzats per treballar amb **models petits i poc context**.

Prioritza sempre:

* instruccions simples;
* tasques atòmiques;
* poca informació necessària per cada execució;
* una sola tasca activa;
* canvis petits;
* responsabilitats clares entre agents;
* tests freqüents;
* regressions acumulatives;
* validació abans d’avançar.

Evita prompts excessivament llargs, explicacions teòriques i instruccions redundants.

El resultat final d’aquesta execució han de ser exclusivament els tres prompts indicats.
