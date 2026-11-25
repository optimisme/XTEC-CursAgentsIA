# Prompts · Sessió 06 · RAGs i serveis de dades

Prompts de [06 - RAGs i serveis de dades](../06%20-%20RAGs%20i%20serveis%20de%20dades.md), en ordre i preparats per copiar i enganxar.

**Com fer-los servir**

- Els blocs `text` van a **OpenCode**, obert dins la carpeta del repositori on treballes. Els blocs `bash` van al **terminal**.
- Enganxa **un prompt cada vegada** i revisa el resultat abans del següent.
- Requisit: Node.js 24.22 o superior (`node --version`).

---

## Pràctica · Repositori `lliuraments`

Com a la sessió 05, la pràctica es fa directament al repositori del projecte. La tasca T6 n'és el darrer pas.

### Pas 1 · Configurar el RAG local

```text
Configura en aquest projecte un RAG local basat en mcp-local-rag i LanceDB.
- Crea (o mantén si existeix) la carpeta documents/ per als fitxers que s'han d'indexar.
- Crea .rag/ per a la base de dades i la cache dels models.
- Configura l'MCP de manera local al projecte, a opencode.json, amb la clau local-rag i l'ordre npx -y mcp-local-rag (sense instal·lar res).
- Posa a environment aquestes variables amb rutes absolutes (fes servir pwd per obtenir-les; l'MCP no accepta rutes relatives):
  BASE_DIR: la carpeta documents/
  DB_PATH: la carpeta .rag/lancedb
  CACHE_DIR: la carpeta .rag/models
- Si opencode.json ja existeix, integra-hi la configuració sense sobreescriure ni eliminar altres MCPs.
- Afegeix .rag/ al .gitignore.
Al final mostra els fitxers creats o modificats i el contingut de la configuració de local-rag.
```

Reinicia OpenCode. **Comprova-ho:** `opencode mcp list` mostra `local-rag` connectat.

### Pas 2 · Indexar

Copia els documents de la pràctica (`assets/DOC_ET_02_NOFC_V20.pdf` i `assets/DOC_ET_01_PEC_V13.docx.pdf`) a `documents/`.

```text
Sincronitza el RAG local amb tots els documents de la carpeta documents/ i espera que acabi. Després digues quants documents i fragments s'han indexat.
```

**Comprova-ho** al terminal, des de `lliuraments`:

```bash
npx mcp-local-rag --db-path ./.rag/lancedb list --base-dir ./documents
```

### Pas 3 · Consultar

```text
Amb la informació del RAG local, què es considera una falta greu?
```

```text
Amb la informació del RAG local, a partir de quants minuts es considera un retard a classe?
```

### Pas 4 · `AGENTS.md`

```text
Afegeix a AGENTS.md (crea'l si no existeix) aquesta secció, exactament en anglès:
# Local RAG
The `local-rag` MCP contains the authoritative project documentation.
For any question about the contents, rules, procedures, policies, agreements or information in the documents, always query `local-rag` before answering.
Use `query_documents` proactively, without requiring the user to mention the RAG.
If the first search is insufficient, search again with related terms and use `read_chunk_neighbors` when more surrounding context is needed.
Do not answer document-specific questions from general model knowledge when the answer can be obtained from the local RAG.
If the answer is not in the documents, say so instead of guessing.
Si AGENTS.md ja té una secció # MCPs, afegeix-hi també aquesta línia, sense tocar les altres:
- local-rag MCP: contains the authoritative project documentation. See the Local RAG section.
```

Prova-ho sense esmentar el RAG:

```text
Què cal fer si un alumne es posa malalt dins del centre?
```

### Pas 5 · Mantenir l'índex

```text
Elimina del RAG el document documents/DOC_ET_01_PEC_V13.docx.pdf
```

```text
Torna a indexar documents/DOC_ET_01_PEC_V13.docx.pdf perquè ha estat modificat.
```

```text
Sincronitza el RAG local amb la carpeta documents/ i digues quins fitxers s'han afegit, actualitzat o eliminat de l'índex.
```

### Pas 6 · Com saber si funciona bé

Canvia les preguntes per unes de les quals sàpigues la resposta.

```text
Respon aquestes preguntes amb el RAG local. Per a cada una, cita el document i el fragment que has fet servir. Si la resposta no és als documents, digues-ho.
1. …
2. …
3. …
```

---

## Tasca T6 · Projecte «Lliuraments»

El darrer pas de la pràctica, al mateix repositori `lliuraments`.

### T6.1 · La normativa, amb la font citada

```text
Consulta el RAG local i escriu docs/normativa.md amb el que diu la normativa del centre sobre els retards i les faltes de puntualitat de l'alumnat. Cita literalment cada regla i indica de quin document i de quin apartat surt. Si la normativa no en diu res, escriu-ho: no t'inventis cap regla.
```

**Comprova-ho:** obre el document original i busca-hi les cites de `docs/normativa.md`.

### T6.2 · Commit, etiqueta i push

```text
Fes un commit de tots els canvis, crea l'etiqueta t6 i fes push de la branca main i de les etiquetes.
```

### Ampliació (opcional) · Penalitzacions

Afegeix a `documents/` una normativa de lliuraments (termini, penalització per dies de retard i quan ja no s'accepta un lliurament) i torna a sincronitzar el RAG. Després:

```text
Afegeix a docs/tasks.json aquesta tasca, amb el següent id lliure i status "pending", sense tocar les altres:
title: "Show the penalty of every late delivery according to the school rules in the local RAG."
acceptance:
- "docs/normativa.md quotes the rule and names the source document"
- "The penalty logic is a pure function in webs/lliuraments.js"
- "npm test passes and includes tests for on-time, late and not-accepted deliveries"
- "The web shows the penalty next to every late delivery"
No la implementis.
```

I executa `/next-task`.
