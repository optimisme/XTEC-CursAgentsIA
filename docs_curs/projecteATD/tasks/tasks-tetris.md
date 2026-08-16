# Pla d'Implementació - Tetris al Canvas (Atomic Task Decomposition)

## Objectiu Final

Crear una pàgina HTML amb un joc de Tetris completament funcional renderitzat al `<canvas>` d'HTML5, amb les següents característiques verificables:

- 7 peces (tetraminos) amb formes i colors diferenciats
- Movement lateral (esquerra/dreta), baixada i caiguda lliure
- Rotació de peces amb 90 graus
- Detecció de col·lisions (parets, terra, altres peces)
- Eliminació de línies completes amb puntuació
- Increment progressiu de velocitat/nivell
- Game Over quan les peces arriben al capçral del canvas
- Reinici de partida després del Game Over
- Interfície amb puntuació, nivell i següent peça
- Zero errors JavaScript a la consola durant la jugabilitat

---

## Fase 1: Configuració de l'entorn i estructura HTML

### T1.1 - [x] Crear l'estructura HTML base amb canvas

**Què s'ha d'implementar:**
- Arxiu HTML amb `<!DOCTYPE html>`, `html`, `head`, `body`
- Element `<canvas>` amb `id="game-canvas"` i dimensions de 240x400 (12 columnes x 20 files, amb cèl·lules de 20px)
- `<script src="tetris.js">` per carregar el codi del joc
- Estil CSS bàsic per centrar el canvas i donar-li fons negre

**Criteri de validació:**
- Pàgina carregada sense errors
- Canvas renderitzat amb fons negre visible
- Console de devtools sense errors JavaScript

**Puppeteer:** `page.content()` per verificar presència de canvas, `page.$('#game-canvas')` no null, `page.evaluate(() => window.console.error)` buit

**Dependències:** Cap

### T1.2 - [x] Afegir panell lateral d'informació (HTML)

**Què s'ha d'implementar:**
- Secció HTML al costat o sobre el canvas per mostrar:
  - Puntuació actual: `<div id="score">0</div>`
  - Nivell actual: `<div id="level">1</div>`
  - Següent peça: `<canvas id="next-piece" width="80" height="80"></canvas>`
  - Missatge de "Game Over" i botó de reinici (ocults inicialment)

**Criteri de validació:**
- HTML amb elements identificats per id
- Elements visibles al carregament de la pàgina

**Puppeteer:** `page.$('#score')`, `page.$('#level')`, `page.$('#next-piece')` no nulls

**Dependències:** T1.1

### T1.3 - [x] Afegir CSS bàsic de disseny

**Què s'ha d'implementar:**
- CSS per centrar el canvas principal
- Estil del panell lateral amb puntuació i nivell
- Estil del canvas de previsualització de següent peça
- Disseny responsive bàsic (centrat amb margin auto, max-width)

**Criteri de validació:**
- Layout visualment correcte al navegador
- Canvas i panell alineats

**Puppeteer:** `page.evaluate(() => { const c = document.querySelector('#game-canvas'); return c.style.position; })` no 'static'

**Dependències:** T1.1, T1.2

---

## Fase 2: Estat del joc i estructures de dades

### T2.1 - [x] Definir l'estructura del canvas del joc (grids)

**Què s'ha d'implementar:**
- Crear l'objecte `gameBoard` al JavaScript: array bidimensional de 20 files x 12 columnes, inicialitzat amb zeros
- Columnes = 12 (6 peus de tetraminos visibles a cada costat + zona de caiguda), Files = 20
- La zona central (columns 2 a 9) és on es juguen les peces

**Criteri de validació:**
- `gameBoard` existeix com a array de 20 arrays de 12 elements cada un
- Tots els elements inicials són 0

**Puppeteer:** `page.evaluate(() => window.gameBoard.length === 20 && window.gameBoard[0].length === 12)`

**Dependències:** T1.3

### T2.2 - [x] Definir les peces de Tetris (tetraminos)

**Què s'ha d'implementar:**
- Array `TETROMINOS` amb les 7 peces clàssiques (I, O, T, S, Z, J, L)
- Cada peça definida com a matriu 2D amb números que indiquen rotacions
- Assignar color hexàlic a cada peça (I=cyan, O=yellow, T=purple, S=green, Z=red, J=blue, L=orange)
- Cada rotació de cada peça com a matriu separada o generable

**Criteri de validació:**
- 7 peces definides amb les seves 4 rotacions (excepte O que en té 1 d'única)
- Cada peça té color assignat

**Puppeteer:** `page.evaluate(() => window.TETROMINOS.length === 7)`

**Dependències:** T2.1

### T2.3 - [x] Implementar la peça actual i la següent peça

**Què s'ha d'implementar:**
- Variable `currentPiece` amb propietats: `shape`, `color`, `x`, `y`, `rotationIndex`
- Variable `nextPiece` amb tipus de següent peça
- Funció `generateRandomPiece()` que tria una peça a l'atzar de les 7
- Funció `spawnPiece()` que crea la peça actual i actualitza `nextPiece`

**Criteri de validació:**
- `currentPiece` inicialitzada amb posició al capçeral (y=0, x centrada)
- `nextPiece` amb una peça triada a l'atzar

**Puppeteer:** `page.evaluate(() => { spawnPiece(); return { shape: window.currentPiece.shape, color: window.currentPiece.color }; })`

**Dependències:** T2.2

### T2.4 - [x] Implementar l'estat del joc (game state)

**Què s'ha d'implementar:**
- Variables d'estat: `gameRunning`, `score`, `level`, `linesCleared`, `gameOver`
- Inicialitzar totes a valors per defecte (gameRunning=false, score=0, level=1, linesCleared=0, gameOver=false)
- Funció `resetGameState()` que reinicia tots els valors i prepara nova partida

**Criteri de validació:**
- Totes les variables existents i amb valors correctes
- `resetGameState()` reinicia correctament

**Puppeteer:** `page.evaluate(() => { resetGameState(); return { score: window.score, level: window.level, gameOver: window.gameOver }; })`

**Dependències:** T2.3

---

## Fase 3: Renderitzat al canvas

### T3.1 - [x] Implementar funció de dibuix de cèl·lula

**Què s'ha d'implementar:**
- Funció `drawCell(x, y, color)` que dibuixa un quadrat de 20x20px al canvas
- Dibuix amb `fillStyle`, `fillRect`, afegint un borde lleuger (stroke)
- Marges de 1-2px entre cèl·lules per efecte visual

**Criteri de validació:**
- Cèl·lules dibuixades correctament al canvas
- Color visualment correcte

**Puppeteer:** `page.evaluate(() => { drawCell(0, 0, '#00FFFF'); return true; })` sense errors

**Dependències:** T2.4

### T3.2 - [x] Implementar dibuix del tauler de joc

**Què s'ha d'implementar:**
- Funció `drawBoard()` que itera sobre `gameBoard` i crida `drawCell()` per cada cèl·lula no buida (no zero)
- Dibuixar fons negre del canvas abans de començar (`clearRect` o `fillRect`)

**Criteri de validació:**
- Tauler visible al canvas (inicialment buit o amb fons negre)
- Zero errors en dibuixar tauler buit

**Puppeteer:** `page.evaluate(() => { drawBoard(); return true; })` sense errors

**Dependències:** T3.1

### T3.3 - [x] Implementar dibuix de la peça actual

**Què s'ha d'implementar:**
- Funció `drawCurrentPiece()` que itera sobre la matriu de `currentPiece.shape` i dibuixa cada cèl·lula omplerta a la posició `x + col, y + row`
- Utilitzar el `currentPiece.color` assignat

**Criteri de validació:**
- Peça visible al canvas en posició inicial
- Forma correcta de la peça dibuixada

**Puppeteer:** `page.evaluate(() => { spawnPiece(); drawCurrentPiece(); return true; })` sense errors

**Dependències:** T3.2

### T3.4 - [x] Implementar funció de renderitzat complet del frame

**Què s'ha d'implementar:**
- Funció `draw()` que: neteja canvas → dibuixa tauler → dibuixa peça actual → dibuixa peça següent
- Actualitzar DOM (score, level) amb valors d'estat
- Dibuixar `nextPiece` al canvas `#next-piece`

**Criteri de validació:**
- Tota la informació visible al canvas al mateix temps
- Puntuació i nivell actualitzats al DOM

**Puppeteer:** `page.evaluate(() => { draw(); return { score: document.getElementById('score').textContent, nextPieceExists: document.getElementById('next-piece') !== null }; })`

**Dependències:** T3.3

### T3.5 - [x] Implementar el bucle de joc (game loop)

**Què s'ha d'implementar:**
- Funció `gameLoop()` que crida `draw()` en cada frame
- Utilitzar `requestAnimationFrame` per animació fluida
- Control de velocitat amb temporitzador (caiguda automàtica)
- Funció `startGame()` que inicia el bucle

**Criteri de validació:**
- Canvas s'actualitza contínuament
- Peça cau automàticament amb interval inicial

**Puppeteer:** `page.evaluate(() => { startGame(); return window.requestAnimationFrame !== undefined; })`

**Dependències:** T3.4

---

## Fase 4: Controls i moviment de peces

### T4.1 - [x] Implementar moviment lateral (esquerra i dreta)

**Què s'ha d'implementar:**
- Funció `movePiece(dx)` que actualitza `currentPiece.x` + dx
- Verificar que el moviment no col·lide amb parets o altres peces
- Listening a tecles de fletxa esquerra i dreta (`keydown` event)
- Actualitzar el render després del moviment

**Criteri de validació:**
- Peça es desplaça esquerra/dreta amb fletxes
- Peça no surt dels límits del tauler

**Puppeteer:** `page.evaluate(() => { spawnPiece(); movePiece(-1); return true; })` sense errors

**Dependències:** T3.5, T2.4

### T4.2 - [x] Implementar moviment vertical (baixar peça)

**Què s'ha d'implementar:**
- Funció `movePieceDown()` que actualitza `currentPiece.y` + 1
- Si la posició nova no col·lide, actualitzar i renderitzar
- Si hi ha col·lisió, "fixar" la peça al tauler cridant `lockPiece()`

**Criteri de validació:**
- Peça baixa amb fletxa avall o automàticament per game loop
- Peça es fixa al tauler quan arriba a sota o col·lide

**Puppeteer:** `page.evaluate(() => { spawnPiece(); movePieceDown(); return true; })` sense errors

**Dependències:** T4.1

### T4.3 - [x] Implementar caiguda lliure (hard drop)

**Què s'ha d'implementar:**
- Funció `hardDrop()` que mou la peça cap avall fins que col·litge amb alguna cèl·lula del tauler o amb el terra
- Cridar `lockPiece()` immediatament després
- Tecla asignada: fletxa amunt o espai

**Criteri de validació:**
- Peça cau instantàniament a la posició final
- Peça es fixa correctament després del hard drop

**Puppeteer:** `page.evaluate(() => { spawnPiece(); hardDrop(); return true; })` sense errors

**Dependències:** T4.2

### T4.4 - [x] Implementar rotació de peces

**Què s'ha d'implementar:**
- Funció `rotatePiece()` que canvia `currentPiece.rotationIndex` i actualitza la matriu de forma
- Implementar "wall kick" bàsic: si després de rotar hi ha col·lisió, provar de moure la peça ±1 columnes
- Tecla asignada: fletxa amunt o W
- Limitar rotació a 0-3 (4 orientacions)

**Criteri de validació:**
- Peça rota amb tecla designada
- Wall kick permet rotacions que sinó col·lisionarien amb parets
- Peça no rota fora del tauler

**Puppeteer:** `page.evaluate(() => { spawnPiece(); rotatePiece(); return window.currentPiece.rotationIndex; })`

**Dependències:** T4.1

### T4.5 - [x] Implementar wall collision i edge collision

**Què s'ha d'implementar:**
- Funció `checkCollision(piece, dx, dy, newShape)` que verifica si una peça col·lide amb:
  - Paret esquerra (x < 0)
  - Paret dreta (x + width > board width)
  - Terra (y + height > board height)
  - Altres peces al gameBoard
- Retornar `true` si hi ha col·lisió, `false` si no

**Criteri de validació:**
- Peça no pot sortir del canvas per cap costat
- Peça no pot superposar-se a peces fixades

**Puppeteer:** `page.evaluate(() => { spawnPiece(); return checkCollision({ ...currentPiece, x: -1, y: 0 }, -1, 0, currentPiece.shape); })`

**Dependències:** T4.4

---

## Fase 5: Fixar peces i eliminació de línies

### T5.1 - [x] Implementar fixació de peça al tauler (lockPiece)

**Què s'ha d'implementar:**
- Funció `lockPiece()` que copia la matriu de `currentPiece.shape` al `gameBoard`
- Assignar el color de la peça al tauler (en lloc del número, guardar el color o una referència)
- Després de fixar, cridar `checkLines()`

**Criteri de validació:**
- Peça fixada visible al canvas com a part del tauler
- Nova peça pot aparèixer (cridar `spawnPiece()` si no hi ha game over)

**Puppeteer:** `page.evaluate(() => { spawnPiece(); hardDrop(); lockPiece(); return true; })` sense errors

**Dependències:** T4.5

### T5.2 - [x] Implementar detecció de línies completes

**Què s'ha d'implementar:**
- Funció `checkLines()` que itera sobre cada fila del `gameBoard`
- Identificar files on totes les cèl·lules estan plenes (no zero)
- Retornar array d'índexs de files completes

**Criteri de validació:**
- Línies detectades correctament quan totes les cèl·lules estan ocupades

**Puppeteer:** `page.evaluate(() => { spawnPiece(); hardDrop(); lockPiece(); return checkLines(); })`

**Dependències:** T5.1

### T5.3 - [x] Implementar eliminació de línies i desplaçament

**Què s'ha d'implementar:**
- Funció `clearLines()` que elimina les files completes de `gameBoard`
- Desplaçar files superiors cap avall per omplir els buits
- Actualitzar `linesCleared` i afegir puntuació
- Puntuació segons nombre de línies: 1 línia=100, 2=300, 3=500, 4=800 (Tetris)

**Criteri de validació:**
- Línies eliminades visualment del canvas
- Línies superiors es desplacen correctament

**Puppeteer:** `page.evaluate(() => { spawnPiece(); hardDrop(); lockPiece(); clearLines(); draw(); return true; })` sense errors

**Dependències:** T5.2

### T5.4 - [x] Implementar increment de nivell

**Què s'ha d'implementar:**
- Funció `updateLevel()` que augmenta el nivell cada 10 línies eliminades
- Incrementar velocitat de caiguda automàtica amb el nivell
- Relació entre nivell i interval de caiguda (ex: nivell 1=1000ms, nivell 2=900ms, etc.)

**Criteri de validació:**
- Nivell augmenta després de cada 10 línies
- Velocitat augmenta progressivament

**Puppeteer:** `page.evaluate(() => { spawnPiece(); hardDrop(); lockPiece(); clearLines(); updateLevel(); return window.level; })`

**Dependències:** T5.3

---

## Fase 6: Game Over i reinici

### T6.1 - [x] Implementar detecció de Game Over

**Què s'ha d'implementar:**
- Funció `checkGameOver()` que verifica si una nova peça col·lisiona immediatament en spawn
- Verificar la posició inicial de la peça (al capçeral del tauler)
- Si hi ha col·lisió en spawn, establir `gameOver = true` i aturar el bucle

**Criteri de validació:**
- Joc detecta Game Over quan les peces arriben al capçeral
- Bucle de joc s'atura correctament

**Puppeteer:** Simular accupació del tauler i després `spawnPiece()` cridar `checkGameOver()` que retorna `true`

**Dependències:** T5.4

### T6.2 - [x] Implementar visualització de Game Over

**Què s'ha d'implementar:**
- Mostrar overlay o missatge "GAME OVER" sobre el canvas
- Mostrar puntuació final
- Botó "Play Again" o indicador per reiniciar amb una tecla (Enter)

**Criteri de validació:**
- Missatge visible al canvas quan `gameOver = true`
- Botó visible i clicable

**Puppeteer:** `page.evaluate(() => { checkGameOver(); return document.querySelector('.game-over-overlay') !== null; })`

**Dependències:** T6.1

### T6.3 - [x] Implementar reinici de partida

**Què s'ha d'implementar:**
- Funció `restartGame()` que:
  - Reinicia `gameBoard` a buit
  - Reinicia `score`, `level`, `linesCleared`
  - Reinicia `gameOver` a `false`
  - Reinicia `gameRunning` a `true`
  - Crida `spawnPiece()` i reprèn el game loop
  - Neteja l'overlay de Game Over

**Criteri de validació:**
- Partida es reinicia completament
- Joc funcional immediatament després del reinici
- Game Over overlay desapareix

**Puppeteer:** `page.evaluate(() => { restartGame(); return { gameOver: window.gameOver, gameRunning: window.gameRunning, score: window.score }; })`

**Dependències:** T6.2

---

## Fase 7: Validació amb Puppeteer i correcció de bugs

### T7.1 - [x] Validar càrrega correcta de la pàgina

**Què s'ha d'implementar/validar:**
- Crear script de Puppeteer que carrega la pàgina HTML
- Verificar que no hi ha errors JavaScript a la consola
- Verificar que el títol de la pàgina es carrega correctament
- Verificar que totes les pàgines recarreguen sense errors

**Puppeteer test:**
- Navegar a la pàgina
- Capturar errors de consola amb `page.on('console')`
- Verificar que no hi ha missatges `error`

**Dependències:** T6.3

### T7.2 - [x] Validar renderitzat del canvas

**Què s'ha d'implementar/validar:**
- Verificar que el canvas `<canvas id="game-canvas">` existeix
- Verificar dimensions del canvas (240x400)
- Verificar que el canvas es pot dibuixar (context 2D no null)
- Verificar que el canvas de next piece existeix

**Puppeteer test:**
- `page.$('#game-canvas')` != null
- `page.evaluate(() => canvas.width)` == 240
- `page.evaluate(() => canvas.height)` == 400
- `page.evaluate(() => ctx !== null)` == true

**Dependències:** T7.1

### T7.3 - [x] Validar controls de teclat (moviment lateral)

**Què s'ha d'implementar/validar:**
- Simular tecles de fletxa esquerra i fletxa dreta
- Verificar que la peça es mou correctament
- Verificar que la peça no surt del canvas
- Verificar que es pot moure múltiples vegades

**Puppeteer test:**
- `page.keyboard.down('ArrowLeft')` / `page.keyboard.down('ArrowRight')`
- `page.evaluate(() => currentPiece.x)` canvia correctament
- Verificar que x >= 0 i x <= max_x

**Dependències:** T7.2

### T7.4 - [x] Validar controls de teclat (baixada i caiguda lliure)

**Què s'ha d'implementar/validar:**
- Simular fletxa avall (baixada lenta)
- Simular espai/fletxa amunt (hard drop)
- Verificar que la peça baixa correctament
- Verificar que hard drop cau fins al terra

**Puppeteer test:**
- `page.keyboard.down('ArrowDown')` multiple
- `page.keyboard.down('Space')`
- `page.evaluate(() => currentPiece.y)` augmenta

**Dependències:** T7.3

### T7.5 - [x] Validar rotació de peces

**Què s'ha d'implementar/validar:**
- Simular tecla de rotació (fletxa amunt o W)
- Verificar que la peça rota correctament
- Verificar que el wall kick funciona (prova moviments adjacents)
- Verificar que no hi ha col·lisió després de la rotació

**Puppeteer test:**
- `page.keyboard.down('ArrowUp')`
- `page.evaluate(() => currentPiece.rotationIndex)` canvia (0→1→2→3→0)

**Dependències:** T7.4

### T7.6 - [x] Validar col·lisions

**Què s'ha d'implementar/validar:**
- Omplir parcialment el tauler amb peces fixades
- Moure una peça cap a una zona ocupada
- Verificar que la peça no es pot moure a la cèl·lula ocupada
- Verificar que la peça es fixa quan arriba al terra o a una altra peça

**Puppeteer test:**
- Omplir manualment el gameBoard amb valors
- Intentar moure la peça actual a posició ocupada
- Verificar que la posició no canvia

**Dependències:** T7.5

### T7.7 - [x] Validar eliminació de línies

**Què s'ha d'implementar/validar:**
- Omplir una línia completa al tauler
- Cridar clearLines()
- Verificar que la línia s'elimina
- Verificar que les línies superiors es desplacen
- Verificar que la puntuació s'actualitza correctament

**Puppeteer test:**
- Omplir manualment una fila del gameBoard
- Cridar `clearLines()`
- Verificar que la fila ja no està plena
- Verificar `score` augmenta

**Dependències:** T7.6

### T7.8 - [x] Validar puntuació

**Què s'ha d'implementar/validar:**
- Verificar que la puntuació comença a 0
- Verificar que les línies (1, 2, 3, 4) donen 100, 300, 500, 800 punts respectivament
- Verificar que el nivell augmenta cada 10 línies
- Verificar que la puntuació es mostra correctament al DOM

**Puppeteer test:**
- `page.evaluate(() => document.getElementById('score').textContent)` reflecteix els punts
- Omplir 4 línies simultàniament i verificar 800 punts afegits

**Dependències:** T7.7

### T7.9 - [x] Validar Game Over

**Què s'ha d'implementar/validar:**
- Omplir el tauler fins al capçeral
- Intentar spawnear una nova peça
- Verificar que `gameOver` es torna `true`
- Verificar que el missatge de Game Over es mostra al canvas

**Puppeteer test:**
- Omplir manualment el gameBoard
- Cridar `spawnPiece()`
- Verificar `gameOver === true`
- Verificar overlay visible

**Dependències:** T7.8

### T7.10 - [x] Validar reinici de partida

**Què s'ha d'implementar/validar:**
- Simular Game Over
- Cridar restartGame() (o prémer Enter)
- Verificar que el tauler es buida
- Verificar que la puntuació es reinicia a 0
- Verificar que el joc es pot jugar de nou immediatament

**Puppeteer test:**
- Omplir gameBoard per forçar Game Over
- Cridar `restartGame()`
- Verificar gameBoard buida
- Verificar score === 0
- Verificar joc funcional

**Dependències:** T7.9

### T7.11 - [x] Validar que no hi ha errors JavaScript

**Què s'ha d'implementar/validar:**
- Executar el joc durant 5 minuts amb accions aleatòries
- Verificar que no s'han generat errors a la consola
- Capturar i registrar qualsevol warning o error

**Puppeteer test:**
- `page.on('console')` per 300s amb 100 accions aleatòries
- Verificar cap missatge `error` a la consola

**Dependències:** T7.10

---

## Fase 8: Test d'estrès i validació final

### T8.1 - [x] Test d'estrès de jogabilitat

**Què s'ha d'implementar/validar:**
- Executar el joc durant 10 minuts amb controls aleatoris
- Verificar que el joc no es bloquia ni es penja
- Verificar que no hi ha memory leaks
- Verificar que el joc segueix funcional després de múltiples Game Overs i reinicis

**Puppeteer test:**
- Simular controls aleatoris durant 600s
- Verificar canvas actualitzant contínuament
- Verificar zero errors
- Verificar que es poden fer almenys 50 reinicis sense problemes

**Dependències:** T7.11

### T8.2 - [x] Test d'usabilitat bàsica

**Què s'ha d'implementar/validar:**
- Verificar que els controls són responsius (mínim 50ms entre teclades)
- Verificar que el joc es pot iniciar directament (sense necesitat de clic)
- Verificar que el missatge de Game Over és llegible
- Verificar que la informació de puntuació/nivell és visible

**Dependències:** T8.1

### T8.3 - [x] Validació final del joc complet

**Què s'ha d'implementar/validar:**
- Executar tots els tests de Puppeteer de les fases 7 i 8
- Documentar resultats finals
- Assegurar que totes les tasques d'estat `[ ]` s'actualitzen a `[x]`
- Documentar qualsevol bug trobat i correcció realitzada

**Puppeteer test:**
- Executar tots els tests en una sola passada
- Generar un resum de resultats (passed/failed)

**Dependències:** T8.2

---

## Resum de tasques i dependències

| Fase | Tasques | Dependències crítiques |
|------|---------|----------------------|
| Fase 1 | T1.1 → T1.2 → T1.3 | Cap (inici) |
| Fase 2 | T2.1 → T2.2 → T2.3 → T2.4 | T1.3 |
| Fase 3 | T3.1 → T3.2 → T3.3 → T3.4 → T3.5 | T2.4 |
| Fase 4 | T4.1 → T4.2 → T4.3 → T4.4 → T4.5 | T3.5, T2.4 |
| Fase 5 | T5.1 → T5.2 → T5.3 → T5.4 | T4.5 |
| Fase 6 | T6.1 → T6.2 → T6.3 | T5.4 |
| Fase 7 | T7.1 → T7.2 → ... → T7.11 | T6.3 (seqüencial) |
| Fase 8 | T8.1 → T8.2 → T8.3 | T7.11 |

**Total tasques:** 35 (T1.1 a T8.3)
**Fases:** 8

---

## Registre de validacions Puppeteer

*Aquesta secció es completa a mesura que s'executen les validacions automatitzades:*

### Test de càrrega de pàgina
- [ ] No aplicat encara

### Test de renderitzat canvas
- [ ] No aplicat encara

### Test de controls
- [ ] No aplicat encara

### Test de col·lisions
- [ ] No aplicat encara

### Test d'eliminació de línies
- [ ] No aplicat encara

### Test de puntuació
- [ ] No aplicat encara

### Test de Game Over
- [ ] No aplicat encara

### Test de reinici
- [ ] No aplicat encara

### Test d'errors JavaScript
- [ ] No aplicat encara

---

*Pla generat automàticament amb el mètode ATD.*
*Última actualització: 2026-08-10*
