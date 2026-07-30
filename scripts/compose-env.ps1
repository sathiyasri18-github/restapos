# Shared helpers for docker compose environment files under scripts/.
# Compose reads ".env" from --project-directory (scripts/).

function Test-DockerDaemon {
    # Cross-platform: works on Windows and Linux PowerShell.
    # Docker may write warnings to stderr; with $ErrorActionPreference=Stop those become terminating errors.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $null = & docker info 2>&1
        return ($LASTEXITCODE -eq 0)
    }
    finally {
        $ErrorActionPreference = $prev
    }
}

function Get-ComposeEnvFile {
    param([string]$Root = $PSScriptRoot)

    $envPath = Join-Path $Root '.env'
    $examplePath = Join-Path $Root '.env.example'

    if (Test-Path $envPath) { return $envPath }
    if (Test-Path $examplePath) { return $examplePath }
    return $null
}

function Get-ComposeEnvArgs {
    param([string]$Root = $PSScriptRoot)

    $file = Get-ComposeEnvFile -Root $Root
    if ($file) { return @('--env-file', $file) }
    return @()
}

function Read-ComposeEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [string]$Default = '',
        [string]$Root = $PSScriptRoot
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
    param([string]$Root = $PSScriptRoot)

    $envPath = Join-Path $Root '.env'
    $examplePath = Join-Path $Root '.env.example'

    if (Test-Path $envPath) { return $envPath }

    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Host 'Created scripts\.env from .env.example - review passwords before production use.'
        return $envPath
    }

    throw '.env not found. Copy scripts\.env.example to scripts\.env and set RESTAPOS_MSSQL_SA_PASSWORD, JWT_KEY, etc.'
}
