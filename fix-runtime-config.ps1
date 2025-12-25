# Script to add runtime config to all Prisma-backed API routes
# Run this to find routes that need fixing

$routes = Get-ChildItem -Path "app\api\admin" -Recurse -Filter "route.ts" | Where-Object { $_.FullName -notmatch "_disabled" }

foreach ($route in $routes) {
    $content = Get-Content $route.FullName -Raw
    if ($content -match "prisma\." -or $content -match "from.*prisma") {
        if ($content -notmatch "export const runtime") {
            Write-Host "Missing runtime: $($route.FullName)"
        }
    }
}









