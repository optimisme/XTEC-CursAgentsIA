Inspecciona aquest projecte i el seu arnès:

* estructura del projecte;
* agents i subagents disponibles;
* skills disponibles;
* MCPs i eines disponibles;
* `tasks-*.md`;
* `AGENTS.md`, si ja existeix.

Després **crea o actualitza `AGENTS.md`** perquè descrigui de manera breu i clara com s’ha de treballar en aquest projecte.

`AGENTS.md` ha d’estar especialment pensat per a **agents petits, amb poc context**, i ha de definir:

* objectiu general del projecte;
* estructura i fitxers principals;
* agents/subagents disponibles i quan utilitzar-los;
* skills que s’han de carregar segons el tipus de tasca;
* MCPs disponibles i per a què s’han d’utilitzar;
* ús de `tasks-*.md` com a font de veritat de l’estat del desenvolupament;
* selecció d’una sola tasca executable cada vegada;
* respecte de prioritats, dependències i criteris d’acceptació;
* obligació d’executar els tests específics i tots els tests de regressió abans de completar una tasca;
* validació amb navegador quan la tasca afecti la UI;
* prohibició d’implementar funcionalitats futures o fer refactors aliens a la tasca actual.

No copiïs dins d’`AGENTS.md` el contingut complet dels skills: **referencia’ls i indica quan s’han d’utilitzar**.

Si `AGENTS.md` ja existeix, conserva les instruccions correctes, elimina contradiccions o informació obsoleta i completa el que falti.

Mantén l’arxiu **curt, operatiu i sense explicacions teòriques innecessàries**.
