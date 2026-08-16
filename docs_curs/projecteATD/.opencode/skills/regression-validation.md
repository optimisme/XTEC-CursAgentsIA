# Skill: Regression Validation

## Descripció
Comprovació de funcionalitats relacionades després de cada canvi per detectar regressions.
Aquesta skill assegura que les millores en una zona del joc no trenquen funcions existents.

## Quan s'aplica
Després de completar cada tasca amb estat `[x]`, abans de passar a la següent tasca.

## Validacions de regressió per Fase

### Després de Fase 1 (HTML base)
- Verificar que el canvas existeix i és visible
- Verificar que la pàgina carrega sense errors
- Verificar que el CSS bàsic es aplica

### Després de Fase 2 (Dades)
- Verificar que el canvas segueix sent visible
- Verificar que les estructures de dades existeixen
- Verificar que no hi ha errors de referència

### Després de Fase 3 (Renderitzat)
- Verificar que el canvas dibuixa correctament
- Verificar que la peça actual es mostra
- Verificar que el tauler es dibuixa
- Verificar que la peça següent es mostra

### Després de Fase 4 (Controls)
- Verificar que el renderitzat encara funciona
- Verificar que cada control individual funciona
- Verificar que les col·lisions no trenquen el render

### Després de Fase 5 (Mecàniques)
- Verificar que els controls encara funcionen
- Verificar que el renderitzat no té errors
- Verificar que les línies s'eliminen correctament

### Després de Fase 6 (Game Over)
- Verificar que el joc es reinicia correctament
- Verificar que tots els controls funcionen post-reinici
- Verificar que l'estat es reinicia completament

## Resposta
- `PASS` - Cap regressió detectada
- `FAIL` - Especificar quina funcionalitat afectada i com
