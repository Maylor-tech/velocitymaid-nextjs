# Test Database Connection
# This script tests if we can reach the Supabase database

Write-Host "Testing Database Connection..." -ForegroundColor Cyan
Write-Host ""

# Load .env.local
if (Test-Path ".env.local") {
    $envLines = Get-Content ".env.local"
    foreach ($line in $envLines) {
        if ($line -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Check if DIRECT_URL is set
if ($env:DIRECT_URL) {
    Write-Host "[OK] DIRECT_URL is set" -ForegroundColor Green
    
    # Extract host and port from connection string
    if ($env:DIRECT_URL -match "@([^:]+):(\d+)") {
        $dbHost = $matches[1]
        $dbPort = $matches[2]
        
        Write-Host "Testing connection to: ${dbHost}:${dbPort}" -ForegroundColor Yellow
        
        # Test TCP connection
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $connect = $tcpClient.BeginConnect($dbHost, $dbPort, $null, $null)
            $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)
            
            if ($wait) {
                $tcpClient.EndConnect($connect)
                Write-Host "[OK] TCP connection successful!" -ForegroundColor Green
                $tcpClient.Close()
            } else {
                Write-Host "[ERROR] Connection timeout (5 seconds)" -ForegroundColor Red
                Write-Host "  Possible causes:" -ForegroundColor Yellow
                Write-Host "  - Supabase project is paused" -ForegroundColor White
                Write-Host "  - Firewall blocking port ${dbPort}" -ForegroundColor White
                Write-Host "  - Network connectivity issue" -ForegroundColor White
            }
        } catch {
            Write-Host "[ERROR] Connection failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] Could not parse DIRECT_URL" -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] DIRECT_URL is not set" -ForegroundColor Red
}

Write-Host ""
Write-Host "Troubleshooting Steps:" -ForegroundColor Cyan
Write-Host "  1. Check Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "  2. Verify project is not paused" -ForegroundColor White
Write-Host "  3. Check Settings -> Database -> Connection Pooling" -ForegroundColor White
Write-Host "  4. Try resetting database password" -ForegroundColor White
Write-Host "  5. Verify connection string format is correct" -ForegroundColor White
Write-Host ""

