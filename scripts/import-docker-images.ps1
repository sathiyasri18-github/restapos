#Requires -Version 5.1
<#
.SYNOPSIS
  Loads pre-built Resta POS Docker images and starts the stack (client machine).
  Only manages restapos-* containers. Does not remove other apps or shared SQL.

.EXAMPLE
  .\scripts\import-docker-images.ps1
  .\scripts\import-docker-images.ps1 -SkipLoad
  .\scripts\import-docker-images.ps1 -EnsureSharedSql
#>
param(
    [switch]$SkipLoad,
    [switch]$Down,
    [switch]$EnsureSharedSql,
    [string]$ImagesTar = ""
)

$ErrorActionPreference = 'Stop'
$ScriptsDir = $PSScriptRoot
Set-Location $ScriptsDir

if (-not $ImagesTar) {
    $ImagesTar = Join-Path $ScriptsDir "restapos-images.tar"
}

$ComposeFile = Join-Path $ScriptsDir "docker-compose.client.yml"
$SharedSqlCompose = Join-Path $ScriptsDir "docker-compose.shared-sql.yml"
$ProjectName = 'restapos'

function Ensure-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed. Install Docker Desktop and retry."
    }
    . (Join-Path $ScriptsDir 'compose-env.ps1')
    if (-not (Test-DockerDaemon)) {
        throw "Docker daemon is not running. Start Docker and retry."
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
            throw ".env not found. Create scripts\.env with ConnectionStrings__DefaultConnection, JWT_KEY, etc."
        }
    }
}

function Ensure-SharedSqlServer {
    & docker inspect shared-sqlserver 1>$null 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Shared SQL Server already running (shared-sqlserver)." -ForegroundColor Green
        return
    }

    if (-not (Test-Path $SharedSqlCompose)) {
        Write-Host "shared-sqlserver not found and docker-compose.shared-sql.yml missing — skipping." -ForegroundColor Yellow
        return
    }

    Write-Host "Starting shared SQL Server (shared-sqlserver) for all apps..." -ForegroundColor Cyan
    docker compose -f $SharedSqlCompose -p shared-sql --project-directory $ScriptsDir up -d
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start shared-sqlserver."
    }
}

function Remove-StaleContainers {
    # Only this app's compose project + its fixed container names.
    # Never remove shared-sqlserver, tncoa-*, or any other application.
    Write-Host "Stopping Resta POS stack (project: $ProjectName)..." -ForegroundColor Cyan
    docker compose -f $ComposeFile -p $ProjectName --project-directory $ScriptsDir down --remove-orphans 2>$null | Out-Null

    $names = @('restapos-api', 'restapos-web')
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

if ($EnsureSharedSql) {
    Ensure-SharedSqlServer
}

Remove-StaleContainers

Write-Host "Starting Resta POS..." -ForegroundColor Cyan
docker compose -f $ComposeFile -p $ProjectName --project-directory $ScriptsDir up -d
if ($LASTEXITCODE -ne 0) { throw "docker compose up failed." }

Write-Host ""
Write-Host "Resta POS is running." -ForegroundColor Green
Write-Host ""
Write-Host "  Web app : http://localhost:8080"
Write-Host "  API     : http://localhost:8081/swagger"
Write-Host "  SQL     : shared-sqlserver (or ConnectionStrings__DefaultConnection in .env)"
Write-Host ""
Write-Host "Stop  : .\import-docker-images.ps1 -Down   (does not stop shared SQL or other apps)"
Write-Host "Logs  : docker compose -f docker-compose.client.yml -p restapos --project-directory . logs -f"
Write-Host ""
