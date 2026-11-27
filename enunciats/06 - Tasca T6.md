# T6 · Projecte «Lliuraments»

> Enunciat de la tasca de la sessió 06. La teoria i la pràctica són a [06 - RAGs i serveis de dades](../teoria/06%20-%20RAGs%20i%20serveis%20de%20dades.md): els apartats i les seccions que se citen aquí són d'aquests apunts.

**Objectiu:** que l'agent consulti la normativa del centre i en citi la font.

La T6 **és el darrer pas de la pràctica**: el RAG ja és configurat i indexat al repositori `lliuraments`.

> 📋 El prompt de la T6 és a [`assets/prompts-06-rag.md`](../teoria/assets/prompts-06-rag.md), apartat T6.

1. Executa aquest prompt a OpenCode dins del projecte:

   ```text
   Consulta el RAG local i escriu docs/normativa.md amb el que diu la normativa del centre sobre els retards i les faltes de puntualitat de l'alumnat. Cita literalment cada regla i indica de quin document i de quin apartat surt. Si la normativa no en diu res, escriu-ho: no t'inventis cap regla.
   ```

2. Obre el document original i comprova que les cites de `docs/normativa.md` hi són.
3. Demana a l'agent el commit, l'etiqueta `t6` i el push (sessió 01, apartat 17). `.rag/` no s'hi puja; `documents/` només si els documents no són confidencials.

**Lliurable:** enllaç a l'etiqueta `t6` de `lliuraments`, amb la secció *Local RAG* i la línia de `# MCPs` a `AGENTS.md`, i `docs/normativa.md` amb la font citada.

**Ampliació (opcional):** afegeix a `documents/` una normativa de lliuraments (la del teu centre o una de curta escrita per tu: termini, penalització per dies de retard i quan ja no s'accepta un lliurament), torna a sincronitzar el RAG i afegeix aquesta tasca a `docs/tasks.json` per executar-la amb `/next-task`. Si l'`id` ja existeix, fes servir el següent lliure.

```json
{
  "id": "T04",
  "title": "Show the penalty of every late delivery according to the school rules in the local RAG.",
  "status": "pending",
  "acceptance": [
    "docs/normativa.md quotes the rule and names the source document",
    "The penalty logic is a pure function in webs/lliuraments.js",
    "npm test passes and includes tests for on-time, late and not-accepted deliveries",
    "The web shows the penalty next to every late delivery"
  ]
}
```
