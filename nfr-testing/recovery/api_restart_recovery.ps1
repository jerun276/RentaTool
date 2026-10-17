$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$apiDirectory = Join-Path $repoRoot 'src\backend\Host\RentaTool.API'
$apiDll = Join-Path $apiDirectory 'bin\Debug\net9.0\RentaTool.API.dll'
$evidenceDirectory = Join-Path $repoRoot 'nfr-testing\evidence\recovery'
$stdoutPath = Join-Path $evidenceDirectory 'api-process.stdout.log'
$stderrPath = Join-Path $evidenceDirectory 'api-process.stderr.log'
$csvPath = Join-Path $evidenceDirectory 'api-restart-results.csv'
$jsonPath = Join-Path $evidenceDirectory 'api-restart-results.json'
$baseUrl = 'http://127.0.0.1:5000'
$records = [System.Collections.Generic.List[object]]::new()
$apiProcess = $null

New-Item -ItemType Directory -Force -Path $evidenceDirectory | Out-Null
if (-not (Test-Path -LiteralPath $apiDll)) {
    throw "API build not found at $apiDll. Build the API before running this check."
}

$portProbe = [System.Net.Sockets.TcpClient]::new()
try {
    $portProbe.Connect('127.0.0.1', 5000)
    throw 'Port 5000 is already occupied. Stop the existing API and retry; this script will not stop an unrelated process.'
}
catch [System.Net.Sockets.SocketException] {
    # Expected: no process is listening on the test port.
}
finally {
    $portProbe.Dispose()
}

function Start-TestApi {
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    Start-Process -FilePath 'dotnet.exe' `
        -ArgumentList @($apiDll, '--urls', $baseUrl) `
        -WorkingDirectory $apiDirectory `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -PassThru
}

function Get-HttpStatus([string]$url) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing
        return [string][int]$response.StatusCode
    }
    catch {
        return '000'
    }
}

function Wait-ForStatus([string]$url, [string]$expected, [int]$timeoutSeconds) {
    $timer = [Diagnostics.Stopwatch]::StartNew()
    do {
        $status = Get-HttpStatus $url
        if ($status -eq $expected) { return $status }
        Start-Sleep -Milliseconds 500
    } while ($timer.Elapsed.TotalSeconds -lt $timeoutSeconds)
    return $status
}

function Add-Result([string]$step, [string]$endpoint, [string]$expected, [string]$actual, [string]$detail) {
    $records.Add([pscustomobject]@{
        TimestampUtc = [DateTime]::UtcNow.ToString('o')
        Step = $step
        Endpoint = $endpoint
        Expected = $expected
        Actual = $actual
        Result = if ($actual -eq $expected) { 'PASS' } else { 'FAIL' }
        Detail = $detail
    })
}

try {
    $healthUrl = "$baseUrl/health"
    $catalogUrl = "$baseUrl/api/v1/equipment"

    $apiProcess = Start-TestApi
    $healthStatus = Wait-ForStatus $healthUrl '200' 45
    Add-Result 'Initial startup' '/health' '200' $healthStatus 'Started the local API process for this recovery test.'
    if ($healthStatus -ne '200') { throw 'API failed to become healthy at initial startup.' }

    $catalogStatus = Get-HttpStatus $catalogUrl
    Add-Result 'Initial service probe' '/api/v1/equipment' '200' $catalogStatus 'Read-only catalog request before interruption.'
    if ($catalogStatus -ne '200') { throw 'Catalog endpoint did not return HTTP 200 before interruption.' }

    $apiProcess.Kill()
    $apiProcess.WaitForExit()
    $downStatus = Wait-ForStatus $healthUrl '000' 10
    Add-Result 'API stopped' '/health' '000' $downStatus 'Expected connection failure while the local API process was stopped.'
    if ($downStatus -ne '000') { throw 'API did not become unavailable after stopping the test process.' }

    $apiProcess = Start-TestApi
    $recoveryWatch = [Diagnostics.Stopwatch]::StartNew()
    $recoveredStatus = Wait-ForStatus $healthUrl '200' 45
    $recoveryWatch.Stop()
    Add-Result 'API restarted' '/health' '200' $recoveredStatus "Health endpoint recovered in $([math]::Round($recoveryWatch.Elapsed.TotalSeconds, 2)) seconds after process restart."
    if ($recoveredStatus -ne '200') { throw 'API failed to recover within 45 seconds.' }

    $catalogRecovered = Get-HttpStatus $catalogUrl
    Add-Result 'Post-restart catalog probe' '/api/v1/equipment' '200' $catalogRecovered 'Read-only catalog request after API recovery.'
    if ($catalogRecovered -ne '200') { throw 'Catalog endpoint did not return HTTP 200 after recovery.' }
}
finally {
    if ($null -ne $apiProcess -and -not $apiProcess.HasExited) {
        $apiProcess.Kill()
        $apiProcess.WaitForExit()
    }
    $records | Export-Csv -NoTypeInformation -Path $csvPath
    $records | ConvertTo-Json -Depth 4 | Set-Content -Path $jsonPath -Encoding utf8
}

$records | Format-Table -AutoSize
Write-Host "CSV: $csvPath"
Write-Host "JSON: $jsonPath"
