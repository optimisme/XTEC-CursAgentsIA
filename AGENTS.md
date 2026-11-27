# Curs «Programació amb agents IA» (XTEC)

Material d'un curs de vuit temes: apunts, diapositives i enunciats. No és un projecte de codi; la feina habitual és corregir i ampliar el material. Tot el contingut és en **català**.

## Estructura

| Carpeta | Què hi ha |
|---|---|
| `teoria/0X - Títol.md` | Apunts del tema X. `teoria/README.md` té el calendari i la taula de temes |
| `teoria/assets/prompts-0X-….md` | Prompts que l'alumnat copia a classe, numerats `TX.n` |
| `diapositives/0X - Títol.pptx` | Diapositives del tema X (mateix títol que els apunts) |
| `enunciats/0X - Tasca TX.md` | Enunciat de la tasca TX del projecte «Lliuraments» |

El número `0X` lliga les quatre peces. **Un canvi de contingut s'ha de reflectir a totes les que el repeteixen**: apunts, diapositiva (i les seves notes de l'orador), prompts i enunciat. Abans de donar un canvi per acabat, busca el mateix text a la resta.

## Regles de contingut

- **Ordre dels temes.** Una tasca o un prompt no pot fer servir res que encara no s'ha explicat. Exemple: `AGENTS.md`, agents, skills i commands són del tema 02; no poden aparèixer a la T1.
- **Servidor IETI.** L'script del servidor configura globalment el proveïdor `ieti-agents` i la clau. L'`opencode.json` d'un projecte d'alumne no redefineix el proveïdor ni conté claus.
- **Claus.** Mai al repositori: a `.secrets/` o `keys.env`, tots dos al `.gitignore`.
- **Dreceres.** Per canviar d'agent és «MAJ + TAB», i només a l'OpenCode de terminal. Mai «TAB» sol.
- **Fets d'OpenCode.** Comprova'ls a la documentació (opencode.ai/docs) o als apunts abans d'escriure'ls; no els donis de memòria.
- Els prompts i els exemples de codi dels apunts es copien literalment a classe: han de funcionar tal com estan escrits.

## Estil d'escriptura

- Frases curtes i directes, pensades per a docents de cicles formatius.
- Noms de fitxers, carpetes, claus i ordres entre accents greus.
- El contingut dels fitxers que genera l'alumnat (codi, arnès, claus JSON) és en anglès; les explicacions, en català.

## Diapositives

- Mida 9144000 × 5143500 EMU. Colors del tema: `accent1` blau, `accent2` verd, `accent3` ambre, `accent4` vermell, `accent5` gris.
- Quadres de codi: fons `152238`, Courier New, claus en `accent3`, valors en blanc, comentaris en `accent2`.
- Etiquetes i capçaleres de taula: color del tema en to pastel (alfa 14 %, o `lumMod 20000` + `lumOff 80000`), no el color ple.
- Poc text per diapositiva. Si un afegit no hi cap, fes una diapositiva nova abans que reduir la lletra de les altres.
- Les diapositives d'activitat (T1–T8) citen l'enunciat: «Enunciat: enunciats/0X - Tasca TX.md».

### Com editar els `.pptx` en aquesta màquina

- No hi ha `python-pptx`, `lxml`, `defusedxml` ni LibreOffice. S'edita l'XML dins del zip amb Python (`zipfile` + `re`) i es valida amb `xml.dom.minidom`.
- Una diapositiva nova s'ha de registrar a mà: `[Content_Types].xml`, `ppt/_rels/presentation.xml.rels`, `<p:sldIdLst>` de `ppt/presentation.xml` i el seu `slideN.xml.rels`.
- L'autor edita els decks alhora: **rellegeix el fitxer del disc abans de cada canvi** i fes-ne una còpia fora del repositori abans d'escriure.
- Previsualització: una còpia temporal amb la diapositiva moguda a la primera posició i `qlmanage -t -s 1800 -o . fitxer.pptx`. Es pot penjar; executa'l amb un temporitzador. No mostra les lletres del tema.
- No eliminis cap forma que no hagis de canviar (títol, número de diapositiva). Comprova-ho a la previsualització.

## Git

- Commits directes a `main`, amb missatge en anglès. Commit i push només quan es demani.
- Aquest `AGENTS.md` es publica. `CLAUDE.md` (enllaç simbòlic a `AGENTS.md`), `.agents/`, `.opencode/` i `opencode.json` de l'arrel són locals i el git els ignora, igual que `teoria/AGENTS.md`. Els de `teoria/.agents` i `teoria/assets/projecteTeach` són exemples del curs i sí que es publiquen.
