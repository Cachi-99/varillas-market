$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$binary = Join-Path $projectRoot '.local\mariadb-11.4.13-winx64\bin\mariadbd.exe'
$config = Join-Path $projectRoot '.local\data\my.ini'
if (!(Test-Path -LiteralPath $binary) -or !(Test-Path -LiteralPath $config)) {
    throw 'No se encontro la instalacion local de MariaDB en .local. Consultar README.md.'
}
Write-Host 'Iniciando MariaDB local en 127.0.0.1:3307. Dejar esta terminal abierta.'
& $binary "--defaults-file=$config" '--bind-address=127.0.0.1' '--console'
exit $LASTEXITCODE
