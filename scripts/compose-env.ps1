# Shared helpers for docker compose environment files.
# Compose reads ".env" by default only; use these to fall back to ".env.example".

function Get-ComposeEnvFile {
    param([string]$Root = (Get-Location).Path)

    $envPath = Join-Path $Root '.env'
    $examplePath = Join-Path $Root '.env.example'

    if (Test-Path $envPath) { return $envPath }
    if (Test-Path $examplePath) { return $examplePath }
    return $null
}

function Get-ComposeEnvArgs {
    param([string]$Root = (Get-Location).Path)

    $file = Get-ComposeEnvFile -Root $Root
    if ($file) { return @('--env-file', $file) }
    return @()
}

function Read-ComposeEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [string]$Default = '',
        [string]$Root = (Get-Location).Path
    )

    $file = Get-ComposeEnvFile -Root $Root
    if (-not $file) { return $Default }

    foreach ($line in Get-Content $file) {
        if ($line -notmatch "^\s*$([regex]::Escape($Name))\s*=\s*(.*)$") { continue }
        $val = $matches[1].Trim().Trim('"').Trim("'")
        if ($val) { return $val }
    }
    return $Default
}

function Ensure-ComposeEnvFile {
    param([string]$Root = (Get-Location).Path)

    $envPath = Join-Path $Root '.env'
    $examplePath = Join-Path $Root '.env.example'

    if (Test-Path $envPath) { return $envPath }

    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Host 'Created .env from .env.example - review passwords before production use.'
        return $envPath
    }

    throw '.env not found. Copy .env.example to .env and set RESTAPOS_MSSQL_SA_PASSWORD, JWT_KEY, etc.'
}
