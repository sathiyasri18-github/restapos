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
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not $ImagesTar) {
    $ImagesTar = Join-Path $Root "restapos-images.tar"
}

$ComposeFile = Join-Path $Root "docker-compose.client.yml"

function Ensure-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed. Install Docker Desktop and retry."
    }
    docker info | Out-Null
}

function Ensure-EnvFile {
    $envFile = Join-Path $Root ".env"
    $example = Join-Path $Root ".env.example"
    if (-not (Test-Path $envFile)) {
        if (Test-Path $example) {
            Copy-Item $example $envFile
            Write-Host "Created .env from .env.example - change passwords before production use." -ForegroundColor Yellow
        } else {
            throw ".env not found. Create .env with RESTAPOS_MSSQL_SA_PASSWORD, JWT_KEY, etc."
        }
    }
}

Ensure-Docker

if ($Down) {
    docker compose -f $ComposeFile down
    exit 0
}

if (-not (Test-Path $ComposeFile)) {
    throw "Missing docker-compose.client.yml in $Root"
}

Ensure-EnvFile

if (-not $SkipLoad) {
    if (-not (Test-Path $ImagesTar)) {
        throw "Image archive not found: $ImagesTar. Place restapos-images.tar in the package root or pass -ImagesTar."
    }
    Write-Host "Loading Docker images from $ImagesTar ..." -ForegroundColor Cyan
    docker load -i $ImagesTar
    if ($LASTEXITCODE -ne 0) { throw "docker load failed." }
}

Write-Host "Starting Resta POS..." -ForegroundColor Cyan
docker compose -f $ComposeFile up -d
if ($LASTEXITCODE -ne 0) { throw "docker compose up failed." }

Write-Host ""
Write-Host "Resta POS is running." -ForegroundColor Green
Write-Host ""
Write-Host "  Web app : http://localhost:8080"
Write-Host "  API     : http://localhost:8081/swagger"
Write-Host ""
Write-Host "First startup may take 1-2 minutes while SQL Server initializes."
Write-Host ""
Write-Host "Stop  : docker compose -f docker-compose.client.yml down"
Write-Host "Logs  : docker compose -f docker-compose.client.yml logs -f"
Write-Host ""
