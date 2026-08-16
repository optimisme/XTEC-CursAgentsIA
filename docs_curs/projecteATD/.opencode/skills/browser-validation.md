# Skill: Browser Validation

## Descripció
Validació de funcionalitats del joc Tetris utilitzant Puppeteer MCP.
Aquesta skill proporciona els patrons i mètodes per validar la pàgina HTML del joc mitjançant un navegador real.

## Eines disponibles
- `puppeteer_puppeteer_navigate` - Navegar a la pàgina del joc
- `puppeteer_puppeteer_screenshot` - Capturar pantalla del joc
- `puppeteer_puppeteer_evaluate` - Executar JavaScript al context del navegador
- `puppeteer_puppeteer_click` - Clicar elements del DOM
- `puppeteer_puppeteer_fill` - Omplir camps de formulari

## Patrons de validació

### Verificar elements del DOM
Utilitzar `page.evaluate()` per consultar l'estat de la pàgina:
```
page.evaluate(() => {
  const el = document.querySelector('#game-canvas');
  return el !== null;
})
```

### Comprovar errors de consola
Capturar errors JavaScript durant l'execució del joc.

### Simular interaccions
- Tecles: ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Space
- Clics en botons del DOM
- Verificar l'efecte de cada interacció

### Verificar estat del joc
Consultar variables globals del joc:
- `window.gameBoard`
- `window.currentPiece`
- `window.score`, `window.level`
- `window.gameOver`

## Criteris de verificació
- Elements HTML presents i amb IDs correctes
- Canvas amb dimensions correctes (240x400)
- Sense errors a la consola JavaScript
- Elements visibles amb els colors correctes
- Comportament correcte després de cada acció

## Resposta del validator
- `PASS` - Totes les verificacions superades
- `FAIL` - Especificar quina verificació ha fallat i per què
