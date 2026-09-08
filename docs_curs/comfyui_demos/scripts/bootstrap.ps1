#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$action = $args[0]
$forwardArgs = @($args | Select-Object -Skip 1)
if ($action -notin @('install', 'demos')) { throw 'Falta install o demos.' }
if ($forwardArgs -contains '--help' -or $forwardArgs -contains '-h') {
    Write-Host 'install_comfy.ps1 [--backend auto|nvidia|amd|metal|cpu] [--torch-index-url URL] [--comfy-dir PATH]'
    Write-Host 'install_demos.ps1 [--dry-run] [--comfy-dir PATH] [--demos-dir PATH] [--user ID]'
    Write-Host 'Default directory: $HOME\comfy\ComfyUI. See scripts/README.md.'
    exit 0
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'Continue'

if ($action -eq 'install' -and -not (Test-Path -LiteralPath (Join-Path $env:WINDIR 'System32\vcruntime140.dll'))) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw 'Instal·la Microsoft Visual C++ Redistributable x64: https://aka.ms/vs/17/release/vc_redist.x64.exe'
    }
    & winget install --id Microsoft.VCRedist.2015+.x64 -e --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { throw 'No s''ha pogut instal·lar Visual C++ Redistributable x64.' }
}

if ($action -eq 'install' -and -not (Get-Command git -ErrorAction SilentlyContinue)) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw 'Instal·la Git per a Windows des de https://git-scm.com/download/win i torna a obrir PowerShell.'
    }
    & winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { throw 'No s''ha pogut instal·lar Git.' }
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:Path
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git instal·lat. Torna a obrir PowerShell i repeteix aquest script.'
    }
}
$uvDir = Join-Path $env:LOCALAPPDATA 'comfyui-installer\bin'
$uvBin = Join-Path $uvDir 'uv.exe'
$existingUv = Get-Command uv -ErrorAction SilentlyContinue
if ($existingUv) {
    $uvBin = $existingUv.Source
} elseif (-not (Test-Path -LiteralPath $uvBin)) {
    $temporary = Join-Path ([IO.Path]::GetTempPath()) ([Guid]::NewGuid().ToString() + '.ps1')
    $oldUvDirectory = $env:UV_UNMANAGED_INSTALL
    try {
        Write-Host 'Descarregant uv per preparar Python 3.12...'
        Invoke-WebRequest -UseBasicParsing 'https://astral.sh/uv/install.ps1' -OutFile $temporary
        $env:UV_UNMANAGED_INSTALL = $uvDir
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $temporary
        if ($LASTEXITCODE -ne 0) { throw 'No s''ha pogut instal·lar uv.' }
    } finally {
        $env:UV_UNMANAGED_INSTALL = $oldUvDirectory
        if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary }
    }
}
& $uvBin python install 3.12
if ($LASTEXITCODE -ne 0) { throw 'No s''ha pogut instal·lar Python 3.12.' }
$helper = Join-Path $PSScriptRoot 'setup_comfy.py'
if ($action -eq 'install') {
    & $uvBin run --no-project --no-config --python 3.12 --managed-python $helper install --uv $uvBin @forwardArgs
} else {
    & $uvBin run --no-project --no-config --python 3.12 --managed-python $helper demos @forwardArgs
}
exit $LASTEXITCODE
