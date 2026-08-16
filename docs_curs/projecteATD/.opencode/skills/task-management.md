# Skill: Task Management

## Descripció
Lectura i gestió de `tasks/tasks-tetris.md` per a la planificació i seguiment del projecte Tetris.

## Funcionalitats
- Parsejar l'estructura del fitxer `tasks-tetris.md`
- Identificar fases, tasques i el seu estat actual
- Gestionar els estats de tasques: `[ ]`, `[p]`, `[x]`
- Comprendre les dependències entre tasques
- Respectar l'ordre seqüencial dins de cada fase

## Estructura del fitxer de tasques
El fitxer `tasks-tetris.md` conté:
- Capçalera amb l'objectiu final del projecte
- 8 fases amb tasques numerades (T1.1 a T8.3)
- Cada tasca té:
  - Descripció del "Què s'ha d'implementar"
  - Criteris de validació
  - Tests de Puppeteer recomanats
  - Dependències obligatòries

## Estats de tasques
- `[ ]` - Pendent (no iniciada)
- `[p]` - En procés (assignada a executor)
- `[x]` - Completada (validada correctament)

## Regles de gestió
- Només l'orchestrator pot canviar estats
- Les tasques es processen en ordre dins de cada fase
- Les dependències han d'estar completades abans d'iniciar una tasca
- El fitxer és la font d'autoritat del pla del projecte
