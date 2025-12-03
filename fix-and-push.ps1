# Quick Git Fix and Push Script
# Run this in PowerShell from the velocitymaid-nextjs folder

Write-Host "🔧 Fixing Git and Pushing to GitHub..." -ForegroundColor Yellow

# Step 1: Clean up any rebase state
if (Test-Path .git/rebase-merge) {
    Write-Host "Cleaning up rebase state..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git/rebase-merge -ErrorAction SilentlyContinue
}

# Step 2: Fetch latest from GitHub
Write-Host "Fetching latest from GitHub..." -ForegroundColor Yellow
git fetch origin

# Step 3: Reset to match remote (this will discard local changes if there are conflicts)
Write-Host "Resetting to match remote..." -ForegroundColor Yellow
git reset --hard origin/main

# Step 4: Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

# Step 5: Commit
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "Add Google Analytics 4, fix URLs, remove duplicate images, and add connection guides" -m "- Added Google Analytics 4 integration with custom event tracking" -m "- Updated all placeholder URLs to velocitymaid.com with HTTPS" -m "- Removed duplicate hero image from gallery section" -m "- Added event tracking for booking_started, booking_submitted, phone_clicked, whatsapp_clicked" -m "- Improved image error handling" -m "- Added comprehensive connection guides"

# Step 6: Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main --force

Write-Host "✅ Done! Check GitHub: https://github.com/Maylor-tech/velocitymaid-nextjs" -ForegroundColor Green
Write-Host "📋 Next steps: See ACTION_PLAN_NOW.md" -ForegroundColor Cyan


