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
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Ensure-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed. Run scripts\install-prerequisites.ps1 as Administrator."
    }

    try {
        docker info | Out-Null
    }
    catch {
        throw "Docker daemon is not running. Start Docker Desktop and retry."
    }
}

function Ensure-EnvFile {
    if (-not (Test-Path '.env')) {
        Copy-Item '.env.example' '.env'
        Write-Host "Created .env from .env.example — review passwords before production use."
    }
}

Ensure-Docker

if ($Down) {
    Write-Host "Stopping Resta POS containers..."
    docker compose down
    exit 0
}

if ($Logs) {
    docker compose logs -f
    exit 0
}

Ensure-EnvFile

$composeArgs = @('compose', 'up', '-d')
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
