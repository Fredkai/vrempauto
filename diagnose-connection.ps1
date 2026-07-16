# VREMP Connection Diagnostic Script
$targetIp = "129.159.11.170"
$domain = "vrempauto.com"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "VREMP CONNECTION DIAGNOSTIC RESULTS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Local Internet Access
Write-Host "1. Testing local internet access..." -ForegroundColor Yellow
try {
    $ip = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5
    Write-Host "   [OK] Local Internet is up. Your public IP is: $ip" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Failed to query public IP. Check your internet connection." -ForegroundColor Red
}
Write-Host ""

# 2. Check DNS Resolution
Write-Host "2. Querying DNS for $domain..." -ForegroundColor Yellow
try {
    $dns = Resolve-DnsName -Name $domain -ErrorAction Stop
    $ips = $dns | Where-Object { $_.Type -eq "A" } | Select-Object -ExpandProperty IPAddress
    if ($ips) {
        Write-Host "   [OK] $domain resolves to IP(s): $($ips -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] $domain registered, but no 'A' records (IP mapping) found." -ForegroundColor Yellow
        Write-Host "             Currently parked at: $($dns | Where-Object { $_.Type -eq 'SOA' } | Select-Object -ExpandProperty PrimaryServer)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [ERROR] Could not resolve domain $domain." -ForegroundColor Red
}
Write-Host ""

# 3. Test Port Connectivity (TCP Handshakes)
Write-Host "3. Testing TCP Port connectivity to VPS ($targetIp)..." -ForegroundColor Yellow
$ports = @(22, 80, 443)
foreach ($port in $ports) {
    Write-Host "   Testing Port $port..." -NoNewline
    $t = New-Object System.Net.Sockets.TcpClient
    $con = $t.BeginConnect($targetIp, $port, $null, $null)
    $success = $con.AsyncWaitHandle.WaitOne(3000, $false)
    if ($success -and $t.Connected) {
        Write-Host " [SUCCESS] Port $port is OPEN" -ForegroundColor Green
        $t.Close()
    } else {
        Write-Host " [TIMED OUT] Port $port is BLOCKED/CLOSED" -ForegroundColor Red
    }
}
Write-Host ""

# 4. Traceroute to target IP
Write-Host "4. Running route trace to $targetIp (checking where packets drop)..." -ForegroundColor Yellow
tracert -d -h 10 $targetIp
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
