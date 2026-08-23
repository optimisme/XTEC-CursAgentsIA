$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SettingsFile = Join-Path $ScriptDir 'settings.env'
$SecretsDir = Join-Path $ScriptDir '.secrets'
$KeyFile = Join-Path $SecretsDir 'agents_server_key'
$ConfigFile = Join-Path $ScriptDir 'opencode.json'
$DefaultBaseUrl = 'https://agents.ieti.site/v1'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Get-DotEnvValue {
    param(
        [string]$Path,
        [string]$Name
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
        if ($line -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$' -and $Matches[1] -eq $Name) {
            $value = $Matches[2].Trim()
            if ($value.Length -ge 2) {
                $first = $value.Substring(0, 1)
                $last = $value.Substring($value.Length - 1, 1)
                if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
            }
            return $value
        }
    }

    return $null
}

function Set-DotEnvValue {
    param(
        [string]$Path,
        [string]$Name,
        [string]$Value
    )

    $source = @()
    if (Test-Path -LiteralPath $Path) {
        $source = [System.IO.File]::ReadAllLines($Path)
    }

    $output = New-Object System.Collections.Generic.List[string]
    $written = $false

    foreach ($line in $source) {
        if ($line -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=') {
            if ($Matches[1] -eq $Name) {
                if (-not $written) {
                    $output.Add("$Name=$Value")
                    $written = $true
                }
                continue
            }
        }
        $output.Add($line)
    }

    if (-not $written) {
        $output.Add("$Name=$Value")
    }

    while ($output.Count -gt 0 -and $output[$output.Count - 1] -eq '') {
        $output.RemoveAt($output.Count - 1)
    }

    [System.IO.File]::WriteAllText($Path, (($output -join "`n") + "`n"), $Utf8NoBom)
}

function Protect-SecretPath {
    param(
        [string]$Path,
        [switch]$Directory
    )

    $sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    & icacls.exe $Path /inheritance:r | Out-Null
    if ($Directory) {
        & icacls.exe $Path /grant:r "*${sid}:(OI)(CI)F" | Out-Null
    } else {
        & icacls.exe $Path /grant:r "*${sid}:F" | Out-Null
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Could not restrict permissions for $Path."
    }
}

function Normalize-BaseUrl {
    param([string]$Value)

    try {
        $uri = [System.Uri]$Value
    } catch {
        throw 'PROXY_AGENTS_BASE_URL must be a valid HTTP(S) URL.'
    }

    if (-not $uri.IsAbsoluteUri -or ($uri.Scheme -ne 'http' -and $uri.Scheme -ne 'https')) {
        throw 'PROXY_AGENTS_BASE_URL must be a valid HTTP(S) URL.'
    }
    if (-not [string]::IsNullOrEmpty($uri.UserInfo) -or -not [string]::IsNullOrEmpty($uri.Query) -or -not [string]::IsNullOrEmpty($uri.Fragment)) {
        throw 'PROXY_AGENTS_BASE_URL cannot contain credentials, query parameters, or a fragment.'
    }

    $builder = New-Object System.UriBuilder($uri)
    $path = $builder.Path.TrimEnd('/')
    if (-not $path.EndsWith('/v1')) {
        $path += '/v1'
    }
    $builder.Path = $path
    $builder.Query = ''
    $builder.Fragment = ''
    return $builder.Uri.AbsoluteUri.TrimEnd('/')
}

Set-Location -LiteralPath $ScriptDir

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Required command was not found: node'
    exit 1
}

$SettingsExisted = Test-Path -LiteralPath $SettingsFile
$BaseUrl = Get-DotEnvValue -Path $SettingsFile -Name 'PROXY_AGENTS_BASE_URL'
$SettingsNeedsWrite = [string]::IsNullOrWhiteSpace($BaseUrl)

if ($SettingsNeedsWrite) {
    $enteredUrl = Read-Host "IETI Agents base URL [$DefaultBaseUrl]"
    if ([string]::IsNullOrWhiteSpace($enteredUrl)) {
        $BaseUrl = $DefaultBaseUrl
    } else {
        $BaseUrl = $enteredUrl.Trim()
    }
}

try {
    $ApiBaseUrl = Normalize-BaseUrl -Value $BaseUrl
} catch {
    Write-Error $_.Exception.Message
    exit 1
}

if (-not (Test-Path -LiteralPath $KeyFile)) {
    if (-not (Test-Path -LiteralPath $SecretsDir)) {
        New-Item -ItemType Directory -Path $SecretsDir | Out-Null
    }
    Protect-SecretPath -Path $SecretsDir -Directory

    $secureKey = Read-Host 'Paste your IETI Agents API key' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    try {
        $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }

    [System.IO.File]::WriteAllText($KeyFile, $ApiKey, $Utf8NoBom)
    Protect-SecretPath -Path $KeyFile
    Write-Host "Created $KeyFile with access restricted to the current user."
} else {
    $ApiKey = [System.IO.File]::ReadAllText($KeyFile).Trim()
    Protect-SecretPath -Path $KeyFile
}

if ($ApiKey -notmatch '^ieti_sk_[A-Za-z0-9_-]+$') {
    Write-Error "The API key in $KeyFile must start with ieti_sk_ and contain only letters, numbers, underscores, or hyphens."
    exit 1
}

$CapabilitiesUrl = "$ApiBaseUrl/model-capabilities"
$Headers = @{
    Authorization = "Bearer $ApiKey"
    Accept = 'application/json'
}

try {
    $response = Invoke-WebRequest -Uri $CapabilitiesUrl -Headers $Headers -Method Get -UseBasicParsing -TimeoutSec 60
    $CapabilitiesJson = $response.Content
} catch {
    $statusCode = $null
    $body = $null

    if ($_.Exception.Response) {
        try {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                try {
                    $body = $reader.ReadToEnd()
                } finally {
                    $reader.Dispose()
                }
            }
        } catch {}
    }

    if ($statusCode) {
        $message = 'the server rejected the request'
        if ($body) {
            try {
                $errorBody = $body | ConvertFrom-Json
                if ($errorBody.error -and $errorBody.error.message) {
                    $message = [string]$errorBody.error.message
                } elseif ($errorBody.message) {
                    $message = [string]$errorBody.message
                }
            } catch {}
        }
        Write-Warning "IETI Agents is unavailable (HTTP $statusCode): $message"
    } else {
        Write-Warning 'Could not connect to the IETI model capabilities endpoint.'
    }
    Write-Warning 'opencode.json was not modified.'
    exit 1
}

$CapabilitiesTmp = Join-Path $env:TEMP ("ieti-capabilities-{0}.json" -f [guid]::NewGuid().ToString('N'))
$ConfigTmp = "$ConfigFile.tmp.$PID.$([guid]::NewGuid().ToString('N'))"

try {
    [System.IO.File]::WriteAllText($CapabilitiesTmp, $CapabilitiesJson, $Utf8NoBom)

    $nodeScript = @'
const fs = require('node:fs');
const [configPath, capabilitiesPath, configOutputPath, baseURL] = process.argv.slice(2);

let config = {};
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot update ${configPath}: ${error.message}`);
  }
}
if (!config || typeof config !== 'object' || Array.isArray(config)) {
  throw new Error(`Cannot update ${configPath}: the root value must be an object.`);
}

const catalog = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf8'));
if (catalog?.object !== 'ieti.model_capabilities.list' || catalog?.schema_version !== 1 || !Array.isArray(catalog.data) || catalog.data.length === 0) {
  throw new Error('The authenticated server returned no available models.');
}

const models = {};
const canonicalReasoningEfforts = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
for (const published of catalog.data) {
  const id = String(published?.id || '').trim();
  const context = Number(published?.context_window);
  const output = Number(published?.max_output_tokens);
  if (!id || !Number.isFinite(context) || context <= 0 || !Number.isFinite(output) || output <= 0) {
    throw new Error(`Model metadata is incomplete for ${id || '<unknown model>'}.`);
  }
  const capabilities = published.capabilities || {};
  const capabilityNames = ['text', 'image', 'tools', 'reasoning', 'parallel_tools'];
  if (capabilityNames.some((name) => typeof capabilities[name] !== 'boolean')) {
    throw new Error(`Model capabilities are incomplete for ${id}.`);
  }
  const inputModalities = Array.isArray(published?.modalities?.input)
    ? published.modalities.input.filter((value) => ['text', 'audio', 'image', 'video', 'pdf'].includes(value))
    : [capabilities.text === false ? null : 'text', capabilities.image ? 'image' : null].filter(Boolean);
  const advertisedReasoningEfforts = Array.isArray(published.reasoning_efforts)
    ? published.reasoning_efforts.map((value) => String(value).toLowerCase())
    : [];
  const supportedReasoningEfforts = canonicalReasoningEfforts
    .filter((effort) => advertisedReasoningEfforts.includes(effort));
  const defaultReasoningEffort = supportedReasoningEfforts.includes(published.default_reasoning_effort)
    ? published.default_reasoning_effort
    : null;
  const variants = capabilities.reasoning === true
    ? Object.fromEntries(canonicalReasoningEfforts.map((effort) => [
        effort,
        supportedReasoningEfforts.includes(effort) ? { reasoningEffort: effort } : { disabled: true }
      ]))
    : {};
  models[id] = {
    name: String(published?.name || id),
    attachment: capabilities.image === true,
    temperature: true,
    limit: { context, output },
    tool_call: capabilities.tools === true,
    reasoning: capabilities.reasoning === true,
    modalities: { input: inputModalities, output: ['text'] },
    variants,
    ...(defaultReasoningEffort ? { options: { reasoningEffort: defaultReasoningEffort } } : {})
  };
}

config.$schema ||= 'https://opencode.ai/config.json';
config.provider = config.provider && typeof config.provider === 'object' && !Array.isArray(config.provider) ? config.provider : {};
const existingProvider = config.provider['ieti-agents'] && typeof config.provider['ieti-agents'] === 'object'
  ? config.provider['ieti-agents']
  : {};
const existingOptions = existingProvider.options && typeof existingProvider.options === 'object'
  ? existingProvider.options
  : {};
config.provider['ieti-agents'] = {
  ...existingProvider,
  npm: '@ai-sdk/openai-compatible',
  name: 'IETI Agents',
  options: {
    ...existingOptions,
    baseURL,
    apiKey: '{file:.secrets/agents_server_key}',
    timeout: 900000,
    chunkTimeout: 600000
  },
  models
};

const selected = typeof config.model === 'string' ? config.model : '';
const selectedIetiModel = selected.startsWith('ieti-agents/') ? selected.slice('ieti-agents/'.length) : '';
if (!selected || (selectedIetiModel && !models[selectedIetiModel])) {
  config.model = `ieti-agents/${Object.keys(models)[0]}`;
}

fs.writeFileSync(configOutputPath, `${JSON.stringify(config, null, 2)}\n`);
'@

    $nodeScript | & node - $ConfigFile $CapabilitiesTmp $ConfigTmp $ApiBaseUrl
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not generate opencode.json.'
    }

    if ($SettingsNeedsWrite -or $BaseUrl -ne $ApiBaseUrl) {
        Set-DotEnvValue -Path $SettingsFile -Name 'PROXY_AGENTS_BASE_URL' -Value $ApiBaseUrl
        if ($SettingsExisted) {
            Write-Host "Updated $SettingsFile with the IETI Agents base URL."
        } else {
            Write-Host "Created $SettingsFile with the IETI Agents base URL."
        }
    }

    Move-Item -LiteralPath $ConfigTmp -Destination $ConfigFile -Force

    $config = Get-Content -LiteralPath $ConfigFile -Raw | ConvertFrom-Json
    $modelCount = @($config.provider.'ieti-agents'.models.PSObject.Properties).Count
    Write-Host "IETI API key validated. Updated the ieti-agents provider in $ConfigFile with $modelCount available model(s)."
} finally {
    if (Test-Path -LiteralPath $CapabilitiesTmp) {
        Remove-Item -LiteralPath $CapabilitiesTmp -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $ConfigTmp) {
        Remove-Item -LiteralPath $ConfigTmp -Force -ErrorAction SilentlyContinue
    }
}