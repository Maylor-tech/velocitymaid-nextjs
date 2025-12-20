# Check Database Connection Configuration
# This script helps diagnose and fix Prisma database connection issues

Write-Host "Checking Database Connection Configuration..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "[OK] .env.local file found" -ForegroundColor Green
    
    # Read .env.local
    $envContent = Get-Content ".env.local" -Raw
    
    # Check for DATABASE_URL
    if ($envContent -match "DATABASE_URL") {
        Write-Host "[OK] DATABASE_URL is set" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] DATABASE_URL is NOT set" -ForegroundColor Red
    }
    
    # Check for DIRECT_URL
    if ($envContent -match "DIRECT_URL") {
        Write-Host "[OK] DIRECT_URL is set" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] DIRECT_URL is NOT set (REQUIRED for migrations)" -ForegroundColor Red
        Write-Host ""
        Write-Host "To fix:" -ForegroundColor Yellow
        Write-Host "  1. Go to Supabase Dashboard -> Settings -> Database" -ForegroundColor White
        Write-Host "  2. Copy the 'Connection string' (Direct connection, port 5432)" -ForegroundColor White
        Write-Host "  3. Add to .env.local:" -ForegroundColor White
        Write-Host "     DIRECT_URL=`"postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require`"" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "[ERROR] .env.local file NOT found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create .env.local file in the project root with:" -ForegroundColor Yellow
    Write-Host "  DATABASE_URL=`"your_pooled_connection_string`"" -ForegroundColor White
    Write-Host "  DIRECT_URL=`"your_direct_connection_string`"" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Supabase Connection Strings:" -ForegroundColor Cyan
Write-Host "  Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "  Path: Settings -> Database -> Connection string" -ForegroundColor White
Write-Host ""
Write-Host "  For DIRECT_URL, use the 'Direct connection' string (port 5432)" -ForegroundColor Yellow
Write-Host "  For DATABASE_URL, you can use pooled (port 6543) or direct (port 5432)" -ForegroundColor Yellow
Write-Host ""

