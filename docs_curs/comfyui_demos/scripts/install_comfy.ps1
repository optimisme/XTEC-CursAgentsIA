#requires -Version 5.1
# Options use the same spelling as Linux: --backend, --comfy-dir, --help.
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'bootstrap.ps1') install @args
exit $LASTEXITCODE
