#Requires -Version 5.1
<#
.SYNOPSIS
  Loads pre-built Resta POS Docker images and starts the stack (client machine).

.EXAMPLE
  .\scripts\import-docker-images.ps1
  .\scripts\import-docker-images.ps1 -SkipLoad
#>
param(
    [switch]$SkipLoad,
    [switch]$Down,
    [string]$ImagesTar = ""
)

$ErrorActionPreference = 'Stop'
$ScriptsDir = $PSScriptRoot
Set-Location $ScriptsDir

if (-not $ImagesTar) {
    $ImagesTar = Join-Path $ScriptsDir "restapos-images.tar"
}

$ComposeFile = Join-Path $ScriptsDir "docker-compose.client.yml"

function Ensure-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed. Install Docker Desktop and retry."
    }
    & docker info 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon is not running. Start Docker Desktop and retry."
    }
}

function Ensure-EnvFile {
    $envFile = Join-Path $ScriptsDir ".env"
    $example = Join-Path $ScriptsDir ".env.example"
    if (-not (Test-Path $envFile)) {
        if (Test-Path $example) {
            Copy-Item $example $envFile
            Write-Host "Created .env from .env.example - change passwords before production use." -ForegroundColor Yellow
        } else {
            throw ".env not found. Create scripts\.env with RESTAPOS_MSSQL_SA_PASSWORD, JWT_KEY, etc."
        }
    }
}

function Remove-StaleContainers {
    # Compose project name can change when files move (repo root → scripts/).
    # Fixed container_name values then conflict with orphaned containers.
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

if ($Down) {
    Remove-StaleContainers
    exit 0
}

if (-not (Test-Path $ComposeFile)) {
    throw "Missing docker-compose.client.yml in $ScriptsDir"
}

Ensure-EnvFile

if (-not $SkipLoad) {
    if (-not (Test-Path $ImagesTar)) {
        throw "Image archive not found: $ImagesTar. Place restapos-images.tar in scripts\ or pass -ImagesTar."
    }
    Write-Host "Loading Docker images from $ImagesTar ..." -ForegroundColor Cyan
    docker load -i $ImagesTar
    if ($LASTEXITCODE -ne 0) { throw "docker load failed." }
}

Remove-StaleContainers

Write-Host "Starting Resta POS..." -ForegroundColor Cyan
docker compose -f $ComposeFile --project-directory $ScriptsDir up -d
if ($LASTEXITCODE -ne 0) { throw "docker compose up failed." }

Write-Host ""
Write-Host "Resta POS is running." -ForegroundColor Green
Write-Host ""
Write-Host "  Web app : http://localhost:8080"
Write-Host "  API     : http://localhost:8081/swagger"
Write-Host ""
Write-Host "First startup may take 1-2 minutes while SQL Server initializes."
Write-Host ""
Write-Host "Stop  : docker compose -f scripts/docker-compose.client.yml --project-directory scripts down"
Write-Host "Logs  : docker compose -f scripts/docker-compose.client.yml --project-directory scripts logs -f"
Write-Host ""
