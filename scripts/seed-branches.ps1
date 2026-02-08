# Seed Branches Script
# This script calls the seed API endpoint to populate the database with branches

$baseUrl = "http://localhost:3000"
$endpoint = "$baseUrl/api/admin/branches/seed"

Write-Host "🌱 Seeding branches into database..." -ForegroundColor Cyan
Write-Host "Calling: $endpoint" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method POST -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Success! Branches seeded successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Seeded branches:" -ForegroundColor Yellow
        Write-Host "  - New Jersey: $($response.branches.newJersey.name) ($($response.branches.newJersey.slug)) - $($response.branches.newJersey.status)" -ForegroundColor White
        Write-Host "  - Vermont: $($response.branches.vermont.name) ($($response.branches.vermont.slug)) - $($response.branches.vermont.status)" -ForegroundColor White
        Write-Host "  - Port Antonio: $($response.branches.portAntonio.name) ($($response.branches.portAntonio.slug)) - $($response.branches.portAntonio.status)" -ForegroundColor White
    } else {
        Write-Host "❌ Error: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to seed branches:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Make sure your Next.js dev server is running (npm run dev)" -ForegroundColor Yellow
    exit 1
}
