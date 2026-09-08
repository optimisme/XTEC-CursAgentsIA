# Instal·lació dels exemples ComfyUI

Distribueix **tota la carpeta `scripts` i la carpeta `demos`**, mantenint-les al
mateix nivell. Els quatre punts d'entrada comparteixen `setup_comfy.py`, el
manifest `models.json` i els nodes `comfyui_classroom` inclosos. No cal Node.js.

La destinació per defecte és `~/comfy/ComfyUI`, amb l'entorn Python a `venv`.
`install_comfy` descarrega ComfyUI de GitHub, prepara Python 3.12 amb uv i
instal·la PyTorch, ComfyUI i les dependències de Manager. Si ComfyUI ja existeix,
conserva el checkout; no fa `git pull` ni esborra models o workflows.

## Linux i macOS

Des de la carpeta que conté `scripts` i `demos`:

```bash
bash scripts/install_comfy.sh
bash scripts/install_demos.sh

cd ~/comfy/ComfyUI
source venv/bin/activate
python main.py --enable-manager
```

El bootstrap és compatible amb Bash 3.2+, Ubuntu, Debian, Fedora, Arch i macOS.
A Linux instal·la Git, curl i certificats amb apt, dnf o pacman si falten
(pot demanar `sudo`). A macOS fa servir Homebrew si està disponible; si falta
Git i no hi ha Homebrew, indica que cal completar `xcode-select --install`.
Python es gestiona amb uv, independentment de la versió Python del sistema.
Els paquets actuals d'aquesta instal·lació per a macOS requereixen **Apple Silicon**;
no es promet compatibilitat amb Macs Intel.

## Windows 10 i Windows 11

PowerShell 5.1 o superior, Windows x64:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\install_comfy.ps1
.\scripts\install_demos.ps1

cd $HOME\comfy\ComfyUI
.\venv\Scripts\Activate.ps1
python main.py --enable-manager
```

La política només canvia per a la sessió actual. Si falta Git, s'instal·la amb
WinGet; si WinGet no està disponible, el missatge indica com instal·lar Git.
PyTorch necessita el Microsoft Visual C++ Redistributable x64; si falta, el
bootstrap l'instal·la amb WinGet o indica el paquet necessari.

Obre `http://127.0.0.1:8188` quan el servidor estigui en marxa.

## NVIDIA, AMD, Metal i CPU

| Opció `--backend` | Instal·lació | Arrencada |
| --- | --- | --- |
| `auto` (per defecte) | NVIDIA si respon `nvidia-smi`; Metal en Apple Silicon; AMD a Linux si existeix `/dev/kfd`; AMD a Windows 11 si el maquinari figura a les matrius ROCm 7.2.1; CPU en els altres casos | L'script mostra el backend, el motiu i l'ordre adequada |
| `nvidia` / `cuda` | PyTorch CUDA 13.0, Linux/Windows; cal controlador NVIDIA compatible | `python main.py --enable-manager` |
| `amd` / `rocm`, Linux | PyTorch ROCm 7.2; cal una GPU, controlador i sistema compatibles amb ROCm, i accés a `/dev/kfd` i `/dev/dri` | `python main.py --enable-manager` |
| `amd` / `rocm`, Windows | Recepta estable AMD ROCm 7.2.1 amb Python 3.12; **Windows 11 x64** i GPU/controlador compatibles amb la matriu d'AMD | `python main.py --enable-manager` |
| `metal` / `mps` | PyTorch amb MPS, macOS Apple Silicon | `python main.py --enable-manager` |
| `cpu` | PyTorch CPU | `python main.py --enable-manager --cpu` |

Per exemple:

```bash
bash scripts/install_comfy.sh --backend amd
bash scripts/install_comfy.sh --backend cpu
```

```powershell
.\scripts\install_comfy.ps1 --backend amd
.\scripts\install_comfy.ps1 --backend nvidia
```

No cal passar `--backend`: la selecció és automàtica. A Windows consulta els noms
de GPU i CPU amb CIM i comprova les matrius Radeon/Ryzen ROCm 7.2.1. Si un model
no es reconeix o no figura a la matriu, selecciona CPU i ho explica; pots forçar
`--backend amd` després de comprovar-ne la compatibilitat. AMD Windows 10 utilitza
CPU. Els instal·ladors **no instal·len ni modifiquen controladors GPU**.
Que l'script funcioni en una distribució no implica que ROCm admeti totes les
seves versions o totes les targetes AMD. La configuració AMD de Windows segueix
la recepta 7.2.1 d'AMD, que especifica el controlador 26.2.2.

Pots seleccionar un altre índex de wheels PyTorch, per exemple per a un
controlador NVIDIA que requereixi una versió CUDA anterior:

```bash
bash scripts/install_comfy.sh --backend nvidia --torch-index-url https://download.pytorch.org/whl/cu128
```

L'índex ha de contenir `torch`, `torchvision` i `torchaudio` compatibles amb
Python 3.12 i el sistema. La instal·lació comprova el backend i executa una
operació petita a la GPU; retorna error si no funciona. Conserva les versions
PyTorch seleccionades com a restriccions per a les dependències posteriors.

## Exemples, imatges i descàrregues

`install_demos` instal·la les dependències dels nodes Classroom i copia:

- `demos/*.json` → `ComfyUI/user/default/workflows/`.
- `demos/images/*` → `ComfyUI/input/`, mantenint els noms dels nodes LoadImage.
- `scripts/comfyui_classroom` → `ComfyUI/custom_nodes/comfyui_classroom/`.

Si el fitxer de destinació és diferent, en guarda una còpia `.bak` numerada
abans de substituir-lo. Cal reiniciar el servidor després de la instal·lació.

| Models | Carpeta sota `ComfyUI/models` |
| --- | --- |
| `qwen_3_4b.safetensors` | `text_encoders/` |
| `z_image_turbo_bf16.safetensors` | `diffusion_models/` |
| `ae.safetensors` | `vae/` |
| `v1-5-pruned-emaonly-fp16.safetensors`, `512-inpainting-ema.safetensors` | `checkpoints/` |
| `control_v11p_sd15_canny.safetensors`, `control_v11p_sd15_openpose.safetensors` | `controlnet/` |
| Les dues veus `.onnx`, `.onnx.json` i `.MODEL_CARD` | `piper/` |
| Qwen3-1.7B: pesos, índex, tokenizer, configuració i llicència | `text_generation/Qwen3-1.7B/` |

Els 24 fitxers sumen **33,69 GB** (a més de Python i dependències). És convenient
disposar d'uns 50 GB lliures per a una instal·lació nova; l'espai necessari pot
augmentar amb els paquets GPU i les seves memòries cau. La RAM/VRAM necessària
depèn del workflow; instal·lar els models no garanteix que càpiguen en qualsevol
ordinador. La generació Qwen dels nodes Classroom funciona en CPU.

Cada descàrrega mostra percentatge i MiB. Els fitxers `.part` es reprenen amb
HTTP Range; si el servidor no ho admet, es reinicia aquella descàrrega. Hi ha
reintents per errors temporals i verificació SHA-256 (o hash Git per a fitxers
petits) abans de donar un fitxer per acabat. Els fitxers complets verificats
no es tornen a baixar. Un fitxer preexistent amb hash diferent es conserva i
provoca un error explícit. No executis dues instal·lacions simultànies sobre
la mateixa destinació.

El manifest fixa revisions i hashes de Hugging Face. Els ControlNet FP16 es
descarreguen del repositori de comfyanonymous i es desen sense el sufix `_fp16`,
perquè coincideixin amb els workflows. Els exemples utilitzen Z-Image **BF16**;
no es descarrega també NVFP4, que no apareix en cap workflow. El checkpoint
`512-inpainting-ema.safetensors` és **SD 2 Inpainting**, tot i que la llista
original l'etiquetava com a SD 1.5.

**«Reconstruction / Voice Weights» queda pendent d'identificar**: no és un nom
de model o fitxer concret, i no apareix als nodes dels exemples. No es baixa cap
model arbitrari per cobrir aquesta entrada. Les veus Piper sí que s'inclouen
completes; Qwen3-1.7B és el model de text, no Qwen3-TTS.

## Opcions i comprovació sense descàrregues

```bash
bash scripts/install_demos.sh --dry-run
bash scripts/install_comfy.sh --help
bash scripts/install_demos.sh --help
```

En PowerShell les opcions tenen els mateixos noms (`--dry-run`, `--backend`, etc.).
`--dry-run` de Python només valida i mostra el pla. Els bootstraps poden haver
de preparar uv/Python abans; per evitar-ho si ja tens Python 3.10 o superior:

```bash
python scripts/setup_comfy.py demos --dry-run
```

Tots dos instal·ladors admeten `--comfy-dir RUTA` (o la variable `COMFYUI_DIR`);
passa la mateixa ruta als dos. El segon també admet `--demos-dir RUTA` i
`--user IDENTIFICADOR` per a servidors configurats amb múltiples usuaris.
Les rutes es resolen respecte de la ubicació dels scripts, no del directori
des d'on s'executen, excepte les rutes relatives passades explícitament.

## Fonts

- [Instal·lació oficial de ComfyUI](https://docs.comfy.org/installation/manual_install)
- [ComfyUI i Manager](https://github.com/Comfy-Org/ComfyUI#comfyui-manager)
- [Instal·lador uv](https://docs.astral.sh/uv/getting-started/installation/)
- [AMD Windows: recepta PyTorch 7.2.1](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/install/installrad/windows/install-pytorch.html)
- [Compatibilitat AMD Windows](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/compatibility/compatibilityrad/windows/windows_compatibility.html)
- [Compatibilitat Ryzen Windows](https://rocm.docs.amd.com/projects/radeon-ryzen/en/latest/docs/compatibility/compatibilityryz/windows/windows_compatibility.html)
- [Z-Image](https://huggingface.co/Comfy-Org/z_image_turbo)
- [SD 1.5](https://huggingface.co/Comfy-Org/stable-diffusion-v1-5-archive)
- [SD 2 Inpainting](https://huggingface.co/webui/stable-diffusion-2-inpainting)
- [ControlNet FP16](https://huggingface.co/comfyanonymous/ControlNet-v1-1_fp16_safetensors)
- [Piper](https://huggingface.co/rhasspy/piper-voices)
- [Qwen3-1.7B](https://huggingface.co/Qwen/Qwen3-1.7B)

Els nodes Classroom s'han incorporat des de la instal·lació local original
`~/comfy_old/ComfyUI/custom_nodes/comfyui_classroom`; els estudiants no necessiten
tenir aquesta instal·lació. Els workflows JSON originals no s'han modificat.
