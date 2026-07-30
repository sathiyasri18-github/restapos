#Requires -Version 5.1
<#
.SYNOPSIS
  Builds Resta POS Docker images and exports them to scripts/restapos-images.tar.

.EXAMPLE
  .\scripts\export-docker-images.ps1
  .\scripts\export-docker-images.ps1 -IncludeSqlServer -OutputDir C:\Release\restapos-client
#>
param(
    [string]$OutputDir = "",
    [switch]$IncludeSqlServer,
    [string]$Version = "latest"
)

$ErrorActionPreference = 'Stop'
$ScriptsDir = $PSScriptRoot
$Root = Split-Path -Parent $ScriptsDir
$ComposeFile = Join-Path $ScriptsDir "docker-compose.yml"

if (-not $OutputDir) {
    $OutputDir = $ScriptsDir
}

$imagesTar = Join-Path $OutputDir "restapos-images.tar"
$packageDir = $OutputDir

function Test-DockerDaemon {
    # Native docker.exe does not throw into try/catch on WinPS 5.1; check exit code.
    & docker info 1>$null 2>$null
    return ($LASTEXITCODE -eq 0)
}

function Start-DockerDesktopIfNeeded {
    if (Test-DockerDaemon) { return }

    $desktop = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if (-not $desktop) {
        throw "Docker Desktop is not installed (daemon not running and Docker Desktop.exe not found)."
    }

    if (-not (Get-Process "Docker Desktop" -ErrorAction SilentlyContinue)) {
        Write-Host "Docker daemon is not running. Starting Docker Desktop..." -ForegroundColor Yellow
        Start-Process $desktop | Out-Null
    }
    else {
        Write-Host "Docker Desktop is starting; waiting for the engine..." -ForegroundColor Yellow
    }

    $deadline = (Get-Date).AddMinutes(3)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 3
        if (Test-DockerDaemon) {
            Write-Host "Docker engine is ready." -ForegroundColor Green
            return
        }
    }

    throw @"
Docker daemon did not become ready within 3 minutes.
Open Docker Desktop, wait until it shows 'Engine running', then re-run this script.
"@
}

function Ensure-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed or not in PATH."
    }
    Start-DockerDesktopIfNeeded
}

if (-not (Test-Path $ComposeFile)) {
    throw "Missing docker-compose.yml in $ScriptsDir"
}

Ensure-Docker

Write-Host "Building Resta POS images (version: $Version)..." -ForegroundColor Cyan
$env:RESTAPOS_VERSION = $Version
docker compose -f $ComposeFile --project-directory $ScriptsDir build resta-api resta-app
if ($LASTEXITCODE -ne 0) { throw "docker compose build failed." }

$images = @(
    "restapos/api:$Version",
    "restapos/web:$Version"
)

if ($IncludeSqlServer) {
    Write-Host "Pulling SQL Server 2022 image (large download)..." -ForegroundColor Cyan
    docker pull mcr.microsoft.com/mssql/server:2022-latest
    if ($LASTEXITCODE -ne 0) { throw "docker pull sqlserver failed." }
    $images += "mcr.microsoft.com/mssql/server:2022-latest"
}

New-Item -ItemType Directory -Force -Path $packageDir | Out-Null

Write-Host "Saving images to $imagesTar ..." -ForegroundColor Cyan
docker save -o $imagesTar @images
if ($LASTEXITCODE -ne 0) { throw "docker save failed." }

# When exporting to a custom OutputDir, copy client deploy files alongside the tar.
if ($packageDir -ne $ScriptsDir) {
    $clientFiles = @(
        "docker-compose.client.yml",
        ".env.example",
        "import-docker-images.ps1"
    )
    foreach ($name in $clientFiles) {
        $src = Join-Path $ScriptsDir $name
        if (-not (Test-Path $src)) { continue }
        Copy-Item $src (Join-Path $packageDir $name) -Force
    }
}

$manifest = @"
Resta POS - Docker client package
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Version:   $Version
Images:    $($images -join ', ')
Archive:   restapos-images.tar

Client install (from the scripts folder or package copy):
  1. Copy scripts\ (or this package folder) to the customer machine
  2. copy .env.example .env   (edit passwords)
  3. .\import-docker-images.ps1
"@
$manifest | Set-Content (Join-Path $packageDir "README-CLIENT.txt") -Encoding UTF8

$sizeMb = [math]::Round((Get-Item $imagesTar).Length / 1MB, 1)
Write-Host @"

Export complete.

  Package folder : $packageDir
  Images archive : $imagesTar ($sizeMb MB)
  Version        : $Version

On the client machine, from this folder run:
  .\import-docker-images.ps1

"@ -ForegroundColor Green
