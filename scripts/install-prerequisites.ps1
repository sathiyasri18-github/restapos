#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Installs host prerequisites for Resta POS deployment.

.DESCRIPTION
  - Docker Desktop (required for container deployment)
  - IIS + ASP.NET Core 8 Hosting Bundle (optional native Windows hosting)
  - SQL Server 2022 Express (optional native database; Docker stack includes SQL Server)

  For Docker-only deployment you only need Docker Desktop.
  Run: .\scripts\deploy-docker.ps1
#>
param(
    [switch]$SkipDocker,
    [switch]$SkipIis,
    [switch]$SkipDotNet,
    [switch]$SkipSqlExpress,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Write-Step($Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-Command($Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-WingetPackage {
    param(
        [string]$Id,
        [string]$Label
    )

    if (-not (Test-Command winget)) {
        Write-Warning "winget not found. Install $Label manually: https://winget.run/pkg/$Id"
        return $false
    }

    Write-Step "Installing $Label via winget..."
    winget install --id $Id --accept-package-agreements --accept-source-agreements --silent
    return $LASTEXITCODE -eq 0
}

Write-Step "Resta POS — prerequisite installer"

# ── Docker Desktop ────────────────────────────────────────────────────────────
if (-not $SkipDocker) {
    if (Test-Command docker) {
        Write-Host "Docker already installed: $(docker --version)"
    }
    else {
        $ok = Install-WingetPackage -Id 'Docker.DockerDesktop' -Label 'Docker Desktop'
        if ($ok) {
            Write-Host "Docker Desktop installed. Reboot may be required, then start Docker Desktop."
        }
    }

    if (Test-Command docker) {
        try {
            docker info | Out-Null
            Write-Host "Docker daemon is running."
        }
        catch {
            Write-Warning "Docker is installed but not running. Start Docker Desktop before deploying."
        }
    }
}

# ── IIS + ASP.NET Core Hosting Bundle ─────────────────────────────────────────
if (-not $SkipIis) {
    Write-Step "Enabling IIS and required Windows features..."
    $features = @(
        'IIS-WebServerRole',
        'IIS-WebServer',
        'IIS-CommonHttpFeatures',
        'IIS-HttpErrors',
        'IIS-StaticContent',
        'IIS-DefaultDocument',
        'IIS-DirectoryBrowsing',
        'IIS-HttpLogging',
        'IIS-RequestFiltering',
        'IIS-ASPNET45',
        'IIS-NetFxExtensibility45',
        'IIS-ISAPIExtensions',
        'IIS-ISAPIFilter',
        'IIS-ManagementConsole',
        'WAS-WindowsActivationService',
        'WAS-ProcessModel'
    )

    foreach ($feature in $features) {
        $state = (Get-WindowsOptionalFeature -Online -FeatureName $feature -ErrorAction SilentlyContinue).State
        if ($state -ne 'Enabled') {
            Enable-WindowsOptionalFeature -Online -FeatureName $feature -All -NoRestart | Out-Null
            Write-Host "Enabled $feature"
        }
    }
}

if (-not $SkipDotNet) {
    Write-Step "Installing .NET 8 SDK and ASP.NET Core 8 Hosting Bundle..."
    Install-WingetPackage -Id 'Microsoft.DotNet.SDK.8' -Label '.NET 8 SDK' | Out-Null
    Install-WingetPackage -Id 'Microsoft.DotNet.HostingBundle.8' -Label 'ASP.NET Core 8 Hosting Bundle' | Out-Null

    if (Test-Command dotnet) {
        Write-Host ".NET SDK: $(dotnet --version)"
    }
}

# ── SQL Server 2022 Express (native) ──────────────────────────────────────────
if (-not $SkipSqlExpress) {
    Write-Step "Installing SQL Server 2022 Express (native host install)..."
    Write-Host "Note: Docker deployment uses SQL Server inside a container — native Express is optional."

    $sqlInstalled = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL' -ErrorAction SilentlyContinue
    if ($sqlInstalled) {
        Write-Host "SQL Server instance already present on this machine."
    }
    else {
        Install-WingetPackage -Id 'Microsoft.SQLServer.2022.Express' -Label 'SQL Server 2022 Express' | Out-Null
    }
}

Write-Step "Prerequisite installation complete"
Write-Host @"

Next steps (Docker deployment — recommended):
  1. Ensure Docker Desktop is running
  2. cd to repo root
  3. copy .env.example .env   (edit passwords if needed)
  4. .\scripts\deploy-docker.ps1

URLs after deploy:
  Web app : http://localhost:8080
  API     : http://localhost:8081/swagger
  SQL     : localhost,1433  (sa / password from .env)

"@
