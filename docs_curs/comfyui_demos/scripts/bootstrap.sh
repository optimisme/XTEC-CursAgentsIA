#!/usr/bin/env bash
# Bash 3.2+ (including the system Bash on macOS).
set -euo pipefail
script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
action="${1:?Falta install o demos}"
shift

# Help and a dry run need no bootstrap when a suitable Python already exists.
if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
    for arg in "$@"; do
        if [ "$arg" = "--help" ] || [ "$arg" = "-h" ] || { [ "$action" = demos ] && [ "$arg" = "--dry-run" ]; }; then
            exec python3 "$script_dir/setup_comfy.py" "$action" "$@"
        fi
    done
fi

as_admin() {
    if [ "$(id -u)" -eq 0 ]; then "$@"; else sudo "$@"; fi
}
if ! command -v curl >/dev/null 2>&1 || { [ "$action" = install ] && ! git --version >/dev/null 2>&1; }; then
    case "$(uname -s)" in
        Linux)
            if command -v apt-get >/dev/null 2>&1; then
                as_admin apt-get update
                as_admin apt-get install -y git curl ca-certificates
            elif command -v dnf >/dev/null 2>&1; then
                as_admin dnf install -y git curl ca-certificates
            elif command -v pacman >/dev/null 2>&1; then
                as_admin pacman -S --needed --noconfirm git curl ca-certificates
            else
                echo 'Instal·la git, curl i ca-certificates amb el gestor de paquets.' >&2
                exit 1
            fi
            ;;
        Darwin)
            if command -v brew >/dev/null 2>&1; then
                brew install git curl
            else
                echo 'Cal Git. Executa xcode-select --install, completa la instal·lacio i repeteix aquest script.' >&2
                exit 1
            fi
            ;;
        *) echo 'Aquest script admet Linux i macOS.' >&2; exit 1 ;;
    esac
fi
uv_bin="${HOME}/.local/share/comfyui-installer/bin/uv"
if command -v uv >/dev/null 2>&1; then
    uv_bin="$(command -v uv)"
elif [ ! -x "$uv_bin" ]; then
    temporary="$(mktemp -d)"
    trap 'rm -rf "$temporary"' EXIT
    echo 'Descarregant uv per preparar Python 3.12...'
    curl --fail --location --progress-bar --retry 3 https://astral.sh/uv/install.sh -o "$temporary/install-uv.sh"
    UV_UNMANAGED_INSTALL="$(dirname -- "$uv_bin")" sh "$temporary/install-uv.sh"
fi
"$uv_bin" python install 3.12
if [ "$action" = install ]; then
    "$uv_bin" run --no-project --no-config --python 3.12 --managed-python "$script_dir/setup_comfy.py" install --uv "$uv_bin" "$@"
else
    "$uv_bin" run --no-project --no-config --python 3.12 --managed-python "$script_dir/setup_comfy.py" demos "$@"
fi
