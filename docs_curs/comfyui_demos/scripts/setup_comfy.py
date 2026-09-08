#!/usr/bin/env python3
"""Shared installer. Standard library only; launched by the .sh/.ps1 scripts."""
from __future__ import annotations

import argparse
import hashlib
import http.client
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = Path(__file__).resolve().parent
DEFAULT_ROOT = Path.home() / "comfy" / "ComfyUI"
REPOSITORY = "https://github.com/Comfy-Org/ComfyUI.git"


def run(*args, cwd=None):
    subprocess.run([str(arg) for arg in args], cwd=cwd, check=True)


def python_at(root):
    return root / "venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def safe_target(root, relative):
    target = (root / relative).resolve()
    if not target.is_relative_to(root.resolve()) or target == root.resolve():
        raise ValueError(f"Ruta fora de la destinacio: {relative}")
    return target


def copy_with_backup(source, target):
    """Keep students' edits when reinstalling the supplied demos or nodes."""
    if target.exists():
        if source.read_bytes() == target.read_bytes():
            return
        backup = target.with_name(target.name + ".bak")
        number = 1
        while backup.exists():
            backup = target.with_name(target.name + f".bak.{number}")
            number += 1
        shutil.copy2(target, backup)
        print(f"Copia anterior: {backup}", flush=True)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_name(target.name + ".install-tmp")
    shutil.copy2(source, temporary)
    temporary.replace(target)


def windows_hardware():
    command = (
        "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); "
        "@{gpus=@(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name); "
        "cpus=@(Get-CimInstance Win32_Processor | Select-Object -ExpandProperty Name)} | ConvertTo-Json -Compress"
    )
    try:
        result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command],
                                capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30, check=True)
        return json.loads(result.stdout.lstrip("\ufeff"))
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError):
        return {"gpus": [], "cpus": []}


def windows_amd_supported(hardware):
    # AMD's ROCm 7.2.1 matrices, linked in README.md. Unlisted GPUs remain CPU in auto.
    gpu_pattern = r"Radeon\s+(?:RX\s+(?:9070(?:\s+XT)?|9060\s+XT|7900\s+XTX|7700)|AI\s+PRO\s+R9700|PRO\s+W7900(?:\s+Dual Slot)?)$"
    for name in hardware.get("gpus", []):
        if re.search(gpu_pattern, name.strip(), re.I):
            return True
    for name in hardware.get("cpus", []):
        if re.search(r"Ryzen\s+AI\s+(?:Max\+?\s+(?:395|390|385)|9\s+(?:HX\s+(?:375|370|475|470)|365|465))\b", name, re.I):
            return any("radeon" in gpu.lower() for gpu in hardware.get("gpus", []))
    return False


def backend_for(requested):
    requested = {"nvidia": "cuda", "amd": "rocm", "metal": "mps"}.get(requested, requested)
    if requested != "auto":
        print(f"Backend seleccionat manualment: {requested}", flush=True)
        return requested
    if platform.system() == "Darwin" and platform.machine() == "arm64":
        print("Backend automatic: Metal (Apple Silicon).", flush=True)
        return "mps"
    if shutil.which("nvidia-smi"):
        try:
            result = subprocess.run(["nvidia-smi", "-L"], capture_output=True, timeout=20)
            if result.returncode == 0 and b"GPU" in result.stdout:
                print("Backend automatic: CUDA (NVIDIA detectada amb nvidia-smi).", flush=True)
                return "cuda"
        except (OSError, subprocess.TimeoutExpired):
            pass
    # The kernel compute device is a stronger signal than an AMD display adapter.
    if platform.system() == "Linux" and Path("/dev/kfd").exists():
        if not os.access("/dev/kfd", os.R_OK | os.W_OK):
            raise ValueError("AMD detectada pero sense permisos sobre /dev/kfd. Configura els grups render/video i torna a iniciar sessio, o utilitza --backend cpu.")
        print("Backend automatic: ROCm (dispositiu de calcul AMD /dev/kfd).", flush=True)
        return "rocm"
    if platform.system() == "Windows":
        hardware = windows_hardware()
        if sys.getwindowsversion().build >= 22000 and windows_amd_supported(hardware):
            print("Backend automatic: ROCm (AMD compatible amb la recepta Windows 11).", flush=True)
            return "rocm"
        if any("radeon" in name.lower() or "amd" in name.lower() for name in hardware.get("gpus", [])):
            print("AMD detectada, pero Windows/GPU fora de la matriu ROCm 7.2.1: s'utilitzara CPU.", flush=True)
    print("Backend automatic: CPU (no s'ha detectat cap accelerador compatible disponible).", flush=True)
    return "cpu"


def install(args):
    root = args.comfy_dir
    backend = backend_for(args.backend)
    if backend == "mps" and (platform.system() != "Darwin" or platform.machine() != "arm64"):
        raise ValueError("Aquest instal·lador configura Metal en Macs Apple Silicon (arm64).")
    if platform.system() == "Darwin" and platform.machine() != "arm64":
        raise ValueError("Els paquets actuals de ComfyUI/PyTorch requereixen un Mac Apple Silicon; Intel macOS no es compatible amb aquesta instal·lacio.")
    if backend == "cuda" and platform.system() == "Darwin":
        raise ValueError("CUDA no esta disponible a macOS. Utilitza --backend metal o cpu.")
    if backend == "rocm":
        if platform.system() not in ("Linux", "Windows"):
            raise ValueError("ROCm requereix Linux o Windows 11; a macOS utilitza Metal.")
        if os.name == "nt" and (sys.getwindowsversion().build < 22000 or platform.machine().lower() not in ("amd64", "x86_64")):
            raise ValueError("AMD ROCm requereix Windows 11 x64. A Windows 10 utilitza --backend cpu.")
    if not shutil.which("git"):
        raise ValueError("Cal instal·lar Git i tornar a executar l'script.")
    if not root.exists() or not any(root.iterdir()):
        root.parent.mkdir(parents=True, exist_ok=True)
        run("git", "clone", "--progress", "--depth", "1", REPOSITORY, root)
    elif not (root / "main.py").is_file() or not (root / ".git").exists():
        raise ValueError(f"La carpeta {root} existeix pero no es una instal·lacio Git de ComfyUI.")
    else:
        print("ComfyUI ja existeix; es conserva el checkout actual.", flush=True)
    py = python_at(root)
    if not py.exists():
        if (root / "venv").exists():
            raise ValueError("venv existeix pero no te Python. Reanomena'l abans de repetir la instal·lacio.")
        run(args.uv, "venv", "--seed", "--python", sys.executable, root / "venv")
    run(py, "-m", "pip", "install", "--upgrade", "--progress-bar", "on", "pip", "wheel")
    index = args.torch_index_url or {
        "cuda": "https://download.pytorch.org/whl/cu130",
        "rocm": "https://download.pytorch.org/whl/rocm7.2",
        "cpu": "https://download.pytorch.org/whl/cpu",
        "mps": "https://pypi.org/simple",
    }[backend]
    if platform.system() == "Darwin":
        index = args.torch_index_url or "https://pypi.org/simple"
    print(f"Instal·lant PyTorch: {backend} ({index})", flush=True)
    if backend == "rocm" and os.name == "nt" and not args.torch_index_url:
        # Stable Windows recipe published by AMD; CPython 3.12, Windows 11 x64.
        base = "https://repo.radeon.com/rocm/windows/rocm-rel-7.2.1/"
        sdk = [f"{name}-7.2.1-py3-none-win_amd64.whl" for name in
               ("rocm_sdk_core", "rocm_sdk_devel", "rocm_sdk_libraries_custom")]
        sdk.append("rocm-7.2.1.tar.gz")
        run(py, "-m", "pip", "install", "--progress-bar", "on", *[base + name for name in sdk])
        wheels = [f"{name}-{version}%2Brocm7.2.1-cp312-cp312-win_amd64.whl"
                  for name, version in (("torch", "2.9.1"), ("torchaudio", "2.9.1"), ("torchvision", "0.24.1"))]
        run(py, "-m", "pip", "install", "--progress-bar", "on", *[base + name for name in wheels])
    else:
        # A switch from CUDA to CPU can otherwise keep the installed +cu build.
        previous_index = root / "venv" / "comfy-torch-index.txt"
        if previous_index.is_file() and previous_index.read_text(encoding="utf-8") != index:
            run(py, "-m", "pip", "uninstall", "-y", "torch", "torchvision", "torchaudio")
        run(py, "-m", "pip", "install", "--upgrade", "--progress-bar", "on", "torch", "torchvision", "torchaudio", "--index-url", index)
    (root / "venv" / "comfy-torch-index.txt").write_text("amd-windows-7.2.1" if backend == "rocm" and os.name == "nt" and not args.torch_index_url else index, encoding="utf-8")
    # Keep later dependency resolution from silently replacing the selected GPU build.
    versions = subprocess.check_output([str(py), "-c", "import importlib.metadata as m; print('\\n'.join(n+'=='+m.version(n) for n in ('torch','torchvision','torchaudio')))"] , text=True)
    constraints = root / "venv" / "comfy-torch-constraints.txt"
    constraints.write_text(versions, encoding="utf-8")
    manager = root / "manager_requirements.txt"
    if not manager.is_file():
        raise ValueError("Aquest checkout es massa antic: falta manager_requirements.txt. Actualitza ComfyUI.")
    run(py, "-m", "pip", "install", "--progress-bar", "on", "-c", constraints, "-r", root / "requirements.txt", "-r", manager)
    run(py, "-m", "pip", "check")
    check = "import torch; import importlib.metadata; print('Manager:', importlib.metadata.version('comfyui-manager')); "
    if backend in ("cuda", "rocm"):
        check += "assert torch.cuda.is_available(), 'La GPU no esta disponible: comprova els controladors i la versio de PyTorch'; "
        check += "assert " + ("torch.version.hip" if backend == "rocm" else "torch.version.cuda") + ", 'Build PyTorch incorrecte'; "
        check += "print('GPU:', torch.cuda.get_device_name(0)); print((torch.ones((32,32), device='cuda') @ torch.ones((32,32), device='cuda')).sum().item())"
    elif backend == "mps":
        check += "assert torch.backends.mps.is_available(), 'MPS no esta disponible en aquest Mac'; print((torch.ones((32,32), device='mps') @ torch.ones((32,32), device='mps')).sum().item())"
    else:
        check += "print('Mode CPU: afegeix --cpu a python main.py --enable-manager')"
    run(py, "-c", check)
    print(f"\nComfyUI i Manager instal·lats a {root}")
    print("Executa ara install_demos per instal·lar els exemples i els models.")
    if os.name == "nt":
        print(f'cd "{root}"\n.\\venv\\Scripts\\Activate.ps1')
    else:
        import shlex
        print(f"cd {shlex.quote(str(root))}\nsource venv/bin/activate")
    print("python main.py --enable-manager" + (" --cpu" if backend == "cpu" else ""))


def progress(label, done, total):
    percent = 100 * done / total if total else 100
    message = f"{label}: {percent:5.1f}% | {done / 2**20:,.1f}/{total / 2**20:,.1f} MiB"
    if sys.stderr.isatty():
        print("\r" + message + " " * 8, end="", file=sys.stderr, flush=True)
    else:
        print(message, file=sys.stderr, flush=True)


def verified(path, item):
    if not path.is_file() or path.stat().st_size != item["size"]:
        return False
    print(f"Verificant {path.name}...", flush=True)
    digest = hashlib.sha256() if item.get("sha256") else hashlib.sha1()
    if not item.get("sha256"):
        digest.update(f"blob {item['size']}\0".encode())
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest() == (item.get("sha256") or item["git_blob_sha1"])


def download(item, root, *, base_url="https://huggingface.co", attempts=5):
    target = safe_target(root, item["target"])
    if verified(target, item):
        print(f"Ja disponible: {target.name}", flush=True)
        return
    if target.exists():
        raise ValueError(f"El fitxer existent no coincideix amb el hash esperat: {target}. Reanomena'l i torna-ho a provar.")
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(target.name + ".part")
    url = f"{base_url}/{item['repo']}/resolve/{item['revision']}/{urllib.parse.quote(item['source'], safe='/')}"
    # A pinned revision makes a Range request safe across repeated runs.
    for attempt in range(attempts):
        try:
            offset = part.stat().st_size if part.exists() else 0
            if offset > item["size"]:
                part.unlink()
                offset = 0
            if offset < item["size"]:
                headers = {"User-Agent": "comfyui-classroom-installer/1", "Accept-Encoding": "identity"}
                if offset:
                    headers["Range"] = f"bytes={offset}-"
                request = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(request, timeout=60) as response:
                    if response.status == 206:
                        content_range = response.headers.get("Content-Range", "")
                        match = re.fullmatch(r"bytes (\d+)-(\d+)/(\d+)", content_range)
                        if not match or int(match[1]) != offset or int(match[3]) != item["size"]:
                            raise ValueError(f"Resposta Range incorrecta per a {target.name}")
                    elif response.status == 200:
                        offset = 0  # Server ignores Range: restart, never append a full response.
                    else:
                        raise ValueError(f"Resposta HTTP inesperada: {response.status}")
                    last = time.monotonic()
                    done = offset
                    progress(target.name, done, item["size"])
                    with part.open("ab" if offset else "wb") as stream:
                        while chunk := response.read(1024 * 1024):
                            stream.write(chunk)
                            done += len(chunk)
                            if done > item["size"]:
                                raise ValueError(f"La descarrega excedeix la mida esperada: {target.name}")
                            now = time.monotonic()
                            if now - last >= (0.25 if sys.stderr.isatty() else 5):
                                progress(target.name, done, item["size"])
                                last = now
                    progress(target.name, done, item["size"])
                    if sys.stderr.isatty():
                        print(file=sys.stderr)
                if done != item["size"]:
                    raise OSError(f"Descarrega incompleta: {done}/{item['size']} bytes")
            if not verified(part, item):
                part.unlink()  # Only discard our own corrupt partial download.
                raise OSError(f"Hash incorrecte: {target.name}; es repetira la descarrega")
            part.replace(target)
            return
        except (OSError, urllib.error.URLError, http.client.HTTPException) as error:
            if isinstance(error, urllib.error.HTTPError) and error.code in (401, 403, 404):
                raise RuntimeError(f"HTTP {error.code}: no es pot accedir a {url}") from error
            if attempt + 1 == attempts:
                raise RuntimeError(f"No s'ha pogut descarregar {target.name}. Torna a executar l'script per reprendre.") from error
            print(f"\nIntent {attempt + 1}/{attempts}: {error}. Reintentant...", flush=True)
            time.sleep(min(2 ** attempt, 15))


def demo_plan(demos_dir, items):
    workflows = sorted(demos_dir.glob("*.json"))
    if not workflows:
        raise ValueError(f"No hi ha workflows JSON a {demos_dir}")
    available_models = {Path(item["target"]).name for item in items}
    image_root = demos_dir / "images"
    for workflow in workflows:
        document = json.loads(workflow.read_text(encoding="utf-8"))
        for node in document.get("nodes", []):
            widgets = node.get("widgets_values", [])
            if node["type"] in {"UNETLoader", "CLIPLoader", "VAELoader", "CheckpointLoaderSimple", "ControlNetLoader"}:
                if not widgets or widgets[0] not in available_models:
                    raise ValueError(f"Model sense descarrega definida a {workflow.name}: {widgets}")
            if node["type"] == "LoadImage":
                image = safe_target(image_root, widgets[0])
                if not image.is_file():
                    raise ValueError(f"Falta la imatge {image} ({workflow.name})")
    return workflows


def demos(args):
    root = args.comfy_dir
    items = json.loads((HERE / "models.json").read_text(encoding="utf-8"))["files"]
    workflows = demo_plan(args.demos_dir, items)
    workflow_root = safe_target(root, f"user/{args.user}/workflows")
    total = sum(item["size"] for item in items)
    print(f"{len(workflows)} workflows, {len(items)} fitxers de models: {total / 1e9:.2f} GB.")
    print(f"Workflows: {workflow_root}\nImatges: {root / 'input'}")
    if args.dry_run:
        for item in items:
            print(f"{item['size'] / 1e9:6.3f} GB  {item['target']}")
        print("No es descarrega 'Reconstruction / Voice Weights': manca el nom o repositori i cap workflow l'utilitza.")
        return
    py = python_at(root)
    if not (root / "main.py").is_file() or not py.is_file():
        raise ValueError(f"Executa primer install_comfy: falta ComfyUI o venv a {root}")
    remaining = 0
    for item in items:
        target = safe_target(root, item["target"])
        if not target.is_file():
            partial = target.with_name(target.name + ".part")
            saved = min(partial.stat().st_size, item["size"]) if partial.is_file() else 0
            remaining += item["size"] - saved
    if shutil.disk_usage(root).free < remaining + 2 * 1024**3:
        raise ValueError(f"Calen aproximadament {remaining / 1e9 + 2.15:.1f} GB lliures per als models pendents i marge temporal.")
    source_nodes = HERE / "comfyui_classroom"
    for source in sorted(source_nodes.rglob("*")):
        if source.is_file() and "__pycache__" not in source.parts:
            copy_with_backup(source, safe_target(root, "custom_nodes/comfyui_classroom/" + source.relative_to(source_nodes).as_posix()))
    constraints = root / "venv" / "comfy-torch-constraints.txt"
    constraint_args = ["-c", constraints] if constraints.is_file() else []
    run(py, "-m", "pip", "install", "--progress-bar", "on", *constraint_args, "-r", source_nodes / "requirements.txt")
    run(py, "-m", "pip", "check")
    run(py, "-c", "from piper import PiperVoice, SynthesisConfig; from transformers import AutoModelForCausalLM; import imageio_ffmpeg; print('FFmpeg:', imageio_ffmpeg.get_ffmpeg_exe())")
    for workflow in workflows:
        copy_with_backup(workflow, workflow_root / workflow.name)
    for source in sorted((args.demos_dir / "images").rglob("*")):
        if source.is_file():
            copy_with_backup(source, safe_target(root, "input/" + source.relative_to(args.demos_dir / "images").as_posix()))
    for index, item in enumerate(items, 1):
        print(f"\n[{index}/{len(items)}] {item['target']}", flush=True)
        download(item, root)
    print("\nExemples, imatges, nodes Classroom i models instal·lats. Reinicia ComfyUI.")
    print("Reconstruction / Voice Weights: no instal·lats; falta identificar el repositori o els fitxers.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    first = sub.add_parser("install", help="Instal·lar ComfyUI, venv i Manager")
    first.add_argument("--uv", default="uv")
    first.add_argument("--backend", choices=["auto", "nvidia", "cuda", "cpu", "metal", "mps", "amd", "rocm"], default="auto")
    first.add_argument("--torch-index-url", help="Index PyTorch alternatiu per al maquinari/controlador")
    second = sub.add_parser("demos", help="Copiar exemples i descarregar models")
    second.add_argument("--demos-dir", type=Path, default=HERE.parent / "demos")
    second.add_argument("--user", default="default", help="Identificador d'usuari ComfyUI (default per defecte)")
    second.add_argument("--dry-run", action="store_true", help="Validar i mostrar el pla sense modificar ni descarregar res")
    for command in (first, second):
        command.add_argument("--comfy-dir", type=Path, default=Path(os.environ.get("COMFYUI_DIR", DEFAULT_ROOT)))
    args = parser.parse_args()
    args.comfy_dir = args.comfy_dir.expanduser().resolve()
    if args.command == "demos":
        if not re.fullmatch(r"[A-Za-z0-9_-]+", args.user):
            parser.error("--user ha de ser un identificador, sense separadors de carpeta")
        args.demos_dir = args.demos_dir.expanduser().resolve()
    try:
        (install if args.command == "install" else demos)(args)
    except KeyboardInterrupt:
        print("\nInterromput. Torna a executar l'script per reprendre les descarregues.", file=sys.stderr)
        return 130
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
