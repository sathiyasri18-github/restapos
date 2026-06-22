#Requires -Version 5.1
<#
.SYNOPSIS
  Builds Resta POS Docker images and exports them to a .tar for client deployment.

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
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not $OutputDir) {
    $OutputDir = Join-Path $Root "dist\client-package"
}

$imagesTar = Join-Path $OutputDir "restapos-images.tar"
$packageDir = $OutputDir

function Ensure-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed or not in PATH."
    }
    docker info | Out-Null
}

Ensure-Docker

Write-Host "Building Resta POS images (version: $Version)..." -ForegroundColor Cyan
$env:RESTAPOS_VERSION = $Version
docker compose build resta-api resta-app
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

# Copy client deployment files into package folder
$clientFiles = @(
    "docker-compose.client.yml",
    ".env.example",
    "scripts\import-docker-images.ps1"
)
foreach ($rel in $clientFiles) {
    $src = Join-Path $Root $rel
    if (-not (Test-Path $src)) { continue }
    $destDir = Join-Path $packageDir (Split-Path $rel -Parent)
    if ($destDir -and -not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    Copy-Item $src (Join-Path $packageDir $rel) -Force
}

$manifest = @"
Resta POS - Docker client package
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Version:   $Version
Images:    $($images -join ', ')

Client install:
  1. Copy this entire folder to the customer machine (e.g. C:\RestaPOS)
  2. copy .env.example .env   (edit passwords)
  3. .\scripts\import-docker-images.ps1
"@
$manifest | Set-Content (Join-Path $packageDir "README-CLIENT.txt") -Encoding UTF8

$sizeMb = [math]::Round((Get-Item $imagesTar).Length / 1MB, 1)
Write-Host @"

Export complete.

  Package folder : $packageDir
  Images archive : $imagesTar ($sizeMb MB)
  Version        : $Version

Copy the whole folder '$packageDir' to the client, then run:
  .\scripts\import-docker-images.ps1

"@ -ForegroundColor Green
