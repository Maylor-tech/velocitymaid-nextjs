# Prisma Commands Helper Script
# Usage: .\prisma-commands.ps1 [command]

# Load DATABASE_URL from .env.local
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object { 
        $env:DATABASE_URL = ($_ -split '=', 2)[1] 
    }
    Write-Host "✅ DATABASE_URL loaded from .env.local" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    exit 1
}

$command = $args[0]

switch ($command) {
    "status" {
        Write-Host "`n📊 Checking migration status...`n" -ForegroundColor Cyan
        npx prisma migrate status
    }
    "studio" {
        Write-Host "`n🎨 Opening Prisma Studio...`n" -ForegroundColor Cyan
        Write-Host "👉 Open http://localhost:5555 in your browser`n" -ForegroundColor Yellow
        npx prisma studio
    }
    "reset" {
        Write-Host "`n⚠️  WARNING: This will delete ALL data!`n" -ForegroundColor Red
        $confirm = Read-Host "Type 'yes' to continue"
        if ($confirm -eq "yes") {
            Write-Host "`n🔄 Resetting database...`n" -ForegroundColor Cyan
            npx prisma migrate reset --force
        } else {
            Write-Host "❌ Cancelled" -ForegroundColor Yellow
        }
    }
    "generate" {
        Write-Host "`n🔧 Generating Prisma Client...`n" -ForegroundColor Cyan
        npx prisma generate
    }
    "migrate" {
        $name = $args[1]
        if (-not $name) {
            Write-Host "❌ Please provide a migration name" -ForegroundColor Red
            Write-Host "Usage: .\prisma-commands.ps1 migrate add_new_table" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "`n📝 Creating migration: $name`n" -ForegroundColor Cyan
        npx prisma migrate dev --name $name
    }
    default {
        Write-Host "`n📚 Prisma Commands Helper`n" -ForegroundColor Cyan
        Write-Host "Available commands:" -ForegroundColor Yellow
        Write-Host "  status    - Check migration status"
        Write-Host "  studio    - Open Prisma Studio (visual DB browser)"
        Write-Host "  reset     - Reset database (deletes all data)"
        Write-Host "  generate  - Generate Prisma Client"
        Write-Host "  migrate   - Create new migration (requires name)"
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\prisma-commands.ps1 status"
        Write-Host "  .\prisma-commands.ps1 studio"
        Write-Host "  .\prisma-commands.ps1 migrate add_user_table"
    }
}

