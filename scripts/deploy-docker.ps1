#Requires -Version 5.1
<#
.SYNOPSIS
  Builds and starts Resta POS (resta-api + resta-app + SQL Server 2022) via Docker Compose.
#>
param(
    [switch]$Build,
    [switch]$Down,
    [switch]$Logs
)

$ErrorActionPreference = 'Stop'
$ScriptsDir = $PSScriptRoot
$ComposeFile = Join-Path $ScriptsDir "docker-compose.yml"
Set-Location $ScriptsDir

function Ensure-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed. Run scripts\install-prerequisites.ps1 as Administrator."
    }

    & docker info 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon is not running. Start Docker Desktop and retry."
    }
}

function Ensure-EnvFile {
    $envFile = Join-Path $ScriptsDir '.env'
    $example = Join-Path $ScriptsDir '.env.example'
    if (-not (Test-Path $envFile)) {
        if (-not (Test-Path $example)) {
            throw "Missing scripts\.env.example"
        }
        Copy-Item $example $envFile
        Write-Host "Created scripts\.env from .env.example — review passwords before production use."
    }
}

function Remove-StaleContainers {
    Write-Host "Stopping any existing Resta POS stack..." -ForegroundColor Cyan
    docker compose -f $ComposeFile --project-directory $ScriptsDir down --remove-orphans 2>$null | Out-Null

    $names = @('restapos-api', 'restapos-web', 'restapos-sqlserver')
    foreach ($name in $names) {
        & docker inspect $name 1>$null 2>$null
        if ($LASTEXITCODE -ne 0) { continue }
        Write-Host "  Removing leftover container: $name" -ForegroundColor Yellow
        docker rm -f $name 1>$null 2>$null
    }
}

Ensure-Docker

if (-not (Test-Path $ComposeFile)) {
    throw "Missing docker-compose.yml in $ScriptsDir"
}

if ($Down) {
    Remove-StaleContainers
    exit 0
}

if ($Logs) {
    docker compose -f $ComposeFile --project-directory $ScriptsDir logs -f
    exit 0
}

Ensure-EnvFile
Remove-StaleContainers

$composeArgs = @('compose', '-f', $ComposeFile, '--project-directory', $ScriptsDir, 'up', '-d')
if ($Build) { $composeArgs += '--build' }

Write-Host "Starting Resta POS stack..."
& docker @composeArgs

if ($LASTEXITCODE -ne 0) {
    throw "docker compose failed with exit code $LASTEXITCODE"
}

Write-Host @"

Resta POS is starting.

  Web app : http://localhost:8080
  API     : http://localhost:8081/swagger
  SQL     : localhost,1433

First startup may take 1–2 minutes while SQL Server initializes and the API migrates/seeds the database.

View logs : .\scripts\deploy-docker.ps1 -Logs
Rebuild   : .\scripts\deploy-docker.ps1 -Build
Stop      : .\scripts\deploy-docker.ps1 -Down

"@
