# Image Verification Script
# Run this after adding your images to check if they're in the correct location

Write-Host "Checking for gallery images..." -ForegroundColor Cyan
Write-Host ""

$galleryPath = "public\images\gallery"
$requiredImages = @(
    "velocitymaid-kitchen-before-newark-nj.jpg",
    "velocitymaid-kitchen-after-newark-nj.jpg",
    "velocitymaid-luxury-bathroom-deep-clean-nj.jpg",
    "velocitymaid-cozy-bedroom-cleaning-nj.jpg"
)

$allFound = $true

foreach ($image in $requiredImages) {
    $fullPath = Join-Path $galleryPath $image
    if (Test-Path $fullPath) {
        $fileInfo = Get-Item $fullPath
        Write-Host "✓ Found: $image ($([math]::Round($fileInfo.Length/1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $image" -ForegroundColor Red
        $allFound = $false
    }
}

Write-Host ""
if ($allFound) {
    Write-Host "All required images are present! ✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "Full path to gallery folder:" -ForegroundColor Yellow
    Write-Host (Resolve-Path $galleryPath).Path -ForegroundColor White
} else {
    Write-Host "Some images are missing. Please add them to:" -ForegroundColor Yellow
    Write-Host (Resolve-Path $galleryPath).Path -ForegroundColor White
}

