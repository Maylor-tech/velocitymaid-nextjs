# Test Payout API with Admin Authentication
# This script finds an admin user and makes an authenticated API call

Write-Host "Finding admin user..." -ForegroundColor Cyan

# Get admin users
try {
    $usersResponse = Invoke-RestMethod -Method GET -Uri "http://localhost:3000/api/admin/users?role=ADMIN"
    $adminUsers = $usersResponse.users | Where-Object { $_.role -eq 'ADMIN' }
    
    if ($adminUsers.Count -eq 0) {
        Write-Host "No admin users found. Creating a test admin user..." -ForegroundColor Yellow
        
        # You'll need to create an admin user first via database or API
        Write-Host "Please create an admin user first, or use a database query:" -ForegroundColor Yellow
        Write-Host "  INSERT INTO \"User\" (id, email, name, role, \"isActive\", \"createdAt\", \"updatedAt\")" -ForegroundColor Gray
        Write-Host "  VALUES ('admin-test-123', 'admin@test.com', 'Test Admin', 'ADMIN', true, NOW(), NOW());" -ForegroundColor Gray
        exit 1
    }
    
    $adminUser = $adminUsers[0]
    Write-Host "Found admin user: $($adminUser.email) (ID: $($adminUser.id))" -ForegroundColor Green
    
    # Create a session with cookies
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    
    # Set admin cookie (this won't work for httpOnly cookies, but let's try)
    Write-Host "`nAttempting API call with admin ID in header..." -ForegroundColor Cyan
    
    # Try with Authorization header instead (if the API supports it)
    $headers = @{
        "Content-Type" = "application/json"
        "X-Admin-Id" = $adminUser.id  # Some APIs support this
    }
    
    try {
        $body = @{
            days = 30
            maxJobs = 5
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/admin/payout-shadow/run" -Headers $headers -Body $body
        Write-Host "`n✅ Success!" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "`n❌ API call failed (expected - needs cookie auth)" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        
        Write-Host "`nTo authenticate properly, you need to:" -ForegroundColor Yellow
        Write-Host "1. Log in via the admin UI (which sets the cookie)" -ForegroundColor Yellow
        Write-Host "2. Or use a browser with cookies enabled" -ForegroundColor Yellow
        Write-Host "3. Or modify requireRole to accept header-based auth for testing" -ForegroundColor Yellow
        Write-Host "`nAdmin User ID for reference: $($adminUser.id)" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "Failed to fetch users: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
















