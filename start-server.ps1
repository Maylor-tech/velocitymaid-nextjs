# PowerShell script to start Next.js dev server
Write-Host "🚀 Starting VelocityMaid Dev Server..." -ForegroundColor Green
Write-Host ""

# Clear cache
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Cleared build cache" -ForegroundColor Yellow
}

# Start server
Write-Host "⏳ Starting server on port 3000..." -ForegroundColor Cyan
Write-Host "   (This will take 15-30 seconds on first run)" -ForegroundColor Gray
Write-Host ""

npm run dev


