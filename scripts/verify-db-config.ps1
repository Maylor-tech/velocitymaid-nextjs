# Verify Supabase + Prisma + Vercel Configuration
# Run this before deploying to verify correct setup

Write-Host "=== VelocityMaid Database Configuration Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check Prisma Schema
Write-Host "[1] Checking Prisma Schema..." -ForegroundColor Yellow
$schemaPath = "prisma\schema.prisma"
if (Test-Path $schemaPath) {
    $schemaContent = Get-Content $schemaPath -Raw
    if ($schemaContent -match 'directUrl\s*=\s*env\("DIRECT_URL"\)') {
        Write-Host "  ✓ directUrl is configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ directUrl is MISSING - add: directUrl = env(`"DIRECT_URL`")" -ForegroundColor Red
    }
    if ($schemaContent -match 'url\s*=\s*env\("DATABASE_URL"\)') {
        Write-Host "  ✓ DATABASE_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ DATABASE_URL is MISSING" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ prisma/schema.prisma not found" -ForegroundColor Red
}

Write-Host ""

# Check Prisma Client
Write-Host "[2] Checking Prisma Client Setup..." -ForegroundColor Yellow
$prismaPath = "lib\prisma.ts"
if (Test-Path $prismaPath) {
    $prismaContent = Get-Content $prismaPath -Raw
    if ($prismaContent -match 'globalForPrisma') {
        Write-Host "  ✓ Singleton pattern detected" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Singleton pattern MISSING - use globalForPrisma pattern" -ForegroundColor Red
    }
    if ($prismaContent -match 'log:\s*\[.*error.*\]') {
        Write-Host "  ✓ Logging configured (errors only)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Logging may be too verbose" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ lib/prisma.ts not found" -ForegroundColor Red
}

Write-Host ""

# Check for problematic DIRECT_URL usage
Write-Host "[3] Checking for Direct DIRECT_URL Usage..." -ForegroundColor Yellow
$apiFiles = Get-ChildItem -Path "app" -Recurse -Filter "*.ts" | Where-Object { $_.FullName -notmatch "node_modules" }
$foundDirectUsage = $false
foreach ($file in $apiFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'process\.env\.DIRECT_URL') {
        Write-Host "  ✗ Found DIRECT_URL usage in: $($file.FullName)" -ForegroundColor Red
        Write-Host "    → Remove this - DIRECT_URL should only be used by Prisma Migrate" -ForegroundColor Yellow
        $foundDirectUsage = $true
    }
}
if (-not $foundDirectUsage) {
    Write-Host "  ✓ No direct DIRECT_URL usage found" -ForegroundColor Green
}

Write-Host ""

# Check for multiple PrismaClient instantiations
Write-Host "[4] Checking for Multiple PrismaClient Instantiations..." -ForegroundColor Yellow
$allFiles = Get-ChildItem -Path "." -Recurse -Filter "*.ts" | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.next" -and
    $_.FullName -notmatch "scripts"
}
$foundMultiple = $false
foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'new PrismaClient\(' -and $file.FullName -notmatch "lib\\prisma\.ts" -and $file.FullName -notmatch "scripts") {
        Write-Host "  ⚠ Found PrismaClient in: $($file.FullName)" -ForegroundColor Yellow
        Write-Host "    → Should import from lib/prisma.ts instead" -ForegroundColor Yellow
        $foundMultiple = $true
    }
}
if (-not $foundMultiple) {
    Write-Host "  ✓ All PrismaClient usage goes through lib/prisma.ts" -ForegroundColor Green
}

Write-Host ""

# Environment Variables Check
Write-Host "[5] Environment Variables (Local)..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match 'DATABASE_URL.*pooler.*6543') {
        Write-Host "  ✓ DATABASE_URL uses pooled connection (port 6543)" -ForegroundColor Green
    } elseif ($envContent -match 'DATABASE_URL') {
        Write-Host "  ⚠ DATABASE_URL exists but may not use pooled connection" -ForegroundColor Yellow
        Write-Host "    → Should use: pooler.supabase.com:6543 with pgbouncer=true" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ DATABASE_URL not found in .env.local" -ForegroundColor Red
    }
    
    if ($envContent -match 'DIRECT_URL.*db\..*\.supabase\.co:5432') {
        Write-Host "  ✓ DIRECT_URL uses direct connection (port 5432)" -ForegroundColor Green
    } elseif ($envContent -match 'DIRECT_URL') {
        Write-Host "  ⚠ DIRECT_URL exists but may not use direct connection" -ForegroundColor Yellow
        Write-Host "    → Should use: db.<project-ref>.supabase.co:5432" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ DIRECT_URL not found in .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠ .env.local not found (may be gitignored)" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify Vercel environment variables match this configuration" -ForegroundColor White
Write-Host "2. Ensure DATABASE_URL uses pooled connection (port 6543)" -ForegroundColor White
Write-Host "3. Ensure DIRECT_URL uses direct connection (port 5432)" -ForegroundColor White
Write-Host "4. Deploy to Vercel and monitor logs for Prisma errors" -ForegroundColor White
Write-Host ""
Write-Host "For detailed configuration, see: docs/DEPLOYMENT/SUPABASE_VERCEL_CONFIG.md" -ForegroundColor Cyan
