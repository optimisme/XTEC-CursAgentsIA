$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KeysFile = Join-Path $ScriptDir "keys.env"
$ExampleFile = Join-Path $ScriptDir "keys.env.example"

Set-Location $ScriptDir

if (-not (Test-Path $KeysFile)) {
  Write-Host "Error: keys.env was not found."
  Write-Host ""
  Write-Host "Create it from the example file:"
  Write-Host "  Copy-Item '$ExampleFile' '$KeysFile'"
  Write-Host ""
  Write-Host "Then edit keys.env and fill in your API keys."
  exit 1
}

Get-Content $KeysFile | ForEach-Object {
  $line = $_.Trim()

  if ($line -eq "" -or $line.StartsWith("#")) {
    return
  }

  if ($line -match '^\s*(?:export\s+)?([^#=\s]+)\s*=\s*(.*)\s*$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    Set-Item -Path "env:$name" -Value $value
  }
}

if ($args.Count -gt 0 -and $args[0] -eq "desktop") {
  $desktopCandidates = @(
    "OpenCode",
    "opencode-desktop",
    "$env:LOCALAPPDATA\Programs\OpenCode\OpenCode.exe",
    "$env:LOCALAPPDATA\Programs\opencode\OpenCode.exe",
    "$env:LOCALAPPDATA\Programs\opencode-desktop\OpenCode.exe",
    "$env:LOCALAPPDATA\Programs\opencode-desktop\opencode-desktop.exe",
    "$env:ProgramFiles\OpenCode\OpenCode.exe",
    "$env:ProgramFiles\opencode-desktop\opencode-desktop.exe",
    "$env:USERPROFILE\scoop\apps\opencode-desktop\current\OpenCode.exe",
    "$env:USERPROFILE\scoop\apps\opencode-desktop\current\opencode-desktop.exe"
  )

  foreach ($cmd in $desktopCandidates) {
    $resolved = Get-Command $cmd -ErrorAction SilentlyContinue

    if ($resolved) {
      & $resolved.Source
      exit $LASTEXITCODE
    }
  }

  Write-Host "Warning: OpenCode desktop executable was not found."
  Write-Host "Tried common Windows install paths."
  Write-Host ""
  Write-Host "Falling back to CLI opencode."

  $cli = Get-Command "opencode" -ErrorAction SilentlyContinue

  if (-not $cli) {
    Write-Host "Error: opencode CLI was not found in PATH."
    exit 1
  }

  & $cli.Source
  exit $LASTEXITCODE
}

$cli = Get-Command "opencode" -ErrorAction SilentlyContinue

if (-not $cli) {
  Write-Host "Error: opencode CLI was not found in PATH."
  exit 1
}

& $cli.Source @args
exit $LASTEXITCODE