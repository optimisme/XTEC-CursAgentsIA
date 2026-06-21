# Gestio de models Docker

Aquest directori separa dues responsabilitats:

- `compose-*.yml`: defineixen com arrenca cada servei Docker.
- `models.json`: es el cataleg operatiu de models.
- `modelctl.sh`: es el gestor unic per listar, arrencar, parar, veure logs i gestionar caches.

`run_docker.sh` ha quedat retirat. Fes servir sempre `modelctl.sh`.

## Arquitectura

Els serveis continuen arrencant amb Docker Compose, pero els noms curts, contenidors,
fitxers compose i volums associats viuen a `models.json`. Aixi evitem mantenir la
mateixa informacio duplicada dins d'un script amb blocs `case`.

Els volums son globals i estables, independentment de si Docker Compose s'executa
amb `-p vllm` o directament des d'aquest directori:

| Volum | Us |
|---|---|
| `xtec-hf-cache` | Cache compartida de Hugging Face: pesos, tokenizers i snapshots |
| `xtec-vllm-cache` | Cache/runtime dels serveis vLLM |
| `xtec-gguf-cache` | Models GGUF i cache de llama.cpp |

Els compose declaren aquests volums com a externs. `modelctl.sh start ...` els crea
automaticament abans d'arrencar el servei si encara no existeixen.

## Comandes principals

Llista els models configurats:

```bash
./docker/modelctl.sh list
```

Arrenca un model sense parar altres serveis:

```bash
./docker/modelctl.sh start gemma4-31b-it-cuda-vram128-vllm-google-qat-w4a16
```

Reinicia un model aturant abans tots els contenidors configurats:

```bash
./docker/modelctl.sh restart gemma4-31b-it-cuda-vram128-vllm-google-qat-w4a16
```

Segueix els logs:

```bash
./docker/modelctl.sh logs gemma4-31b-it-cuda-vram128-vllm-google-qat-w4a16
```

El perfil arrencat exposa el model com `active-model` a
`http://127.0.0.1:8000/v1`.

Mostra contenidors:

```bash
./docker/modelctl.sh ps
```

Atura tots els models configurats:

```bash
./docker/modelctl.sh stop
```

## Gestio de caches

Llista els volums de cache configurats:

```bash
./docker/modelctl.sh cache ls
```

Mostra la mida de cada cache:

```bash
./docker/modelctl.sh cache du
```

Esborra un volum de cache. Aquesta operacio requereix `--force`:

```bash
./docker/modelctl.sh cache rm xtec-gguf-cache --force
```

Esborra totes les caches configurades:

```bash
./docker/modelctl.sh cache rm all --force
```

Docker no permet esborrar un volum que estigui muntat per un contenidor existent.
Atura primer els serveis amb `./docker/modelctl.sh stop` si cal.

## Afegir un model

1. Crea el fitxer `compose-{model}-{target}-{runtime}-{origin}-{quant}.yml`. Exemple: `compose-qwen36-35b-a3b-cuda-vram128-vllm-qwen-fp8.yml`.
2. Munta `xtec-hf-cache` i el runtime que pertoqui:
   - `xtec-vllm-cache` per vLLM.
   - `xtec-gguf-cache` per llama.cpp/GGUF.
3. Afegeix l'entrada corresponent a `models.json`.
4. Valida:

```bash
python3 -m json.tool docker/models.json >/tmp/models_valid.json
for f in docker/compose-*.yml; do docker compose -f "$f" config --quiet; done
./docker/modelctl.sh list
```
