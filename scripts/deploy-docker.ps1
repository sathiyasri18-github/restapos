#Requires -Version 5.1
<#
.SYNOPSIS
  Builds and starts Resta POS (resta-api + resta-app) via Docker Compose.
  Uses shared SQL Server (shared-sqlserver) — does not create or remove SQL containers.
#>
param(
    [switch]$Build,
    [switch]$Down,
    [switch]$Logs,
    [switch]$EnsureSharedSql
)

$ErrorActionPreference = 'Stop'
$ScriptsDir = $PSScriptRoot
$ComposeFile = Join-Path $ScriptsDir "docker-compose.yml"
$SharedSqlCompose = Join-Path $ScriptsDir "docker-compose.shared-sql.yml"
$ProjectName = 'restapos'
Set-Location $ScriptsDir

function Ensure-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed. Run scripts\install-prerequisites.ps1 as Administrator."
    }

    . (Join-Path $ScriptsDir 'compose-env.ps1')
    if (-not (Test-DockerDaemon)) {
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
    # Only tear down THIS app's project. Never touch shared-sqlserver or other apps.
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

if (-not (Test-Path $ComposeFile)) {
    throw "Missing docker-compose.yml in $ScriptsDir"
}

if ($Down) {
    Remove-StaleContainers
    exit 0
}

if ($Logs) {
    docker compose -f $ComposeFile -p $ProjectName --project-directory $ScriptsDir logs -f
    exit 0
}

Ensure-EnvFile

if ($EnsureSharedSql) {
    Ensure-SharedSqlServer
}

Remove-StaleContainers

$composeArgs = @('compose', '-f', $ComposeFile, '-p', $ProjectName, '--project-directory', $ScriptsDir, 'up', '-d')
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
  SQL     : shared-sqlserver (or ConnectionStrings__DefaultConnection in .env)

View logs : .\scripts\deploy-docker.ps1 -Logs
Rebuild   : .\scripts\deploy-docker.ps1 -Build
Shared SQL: .\scripts\deploy-docker.ps1 -EnsureSharedSql
Stop      : .\scripts\deploy-docker.ps1 -Down   (does not stop shared SQL)

"@
