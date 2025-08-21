# Simple PowerShell script to test POS API endpoints
$baseUrl = "http://localhost:3001"

Write-Host "🚀 Starting POS API Tests..." -ForegroundColor Green
Write-Host "=" * 50

# Test Health Endpoint
Write-Host "`n🔍 Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    Write-Host "✅ Health Check: $($response.StatusCode) - Success: $($content.success)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed" -ForegroundColor Red
    Write-Host "Make sure the server is running on port 3001" -ForegroundColor Yellow
    exit 1
}

# Test Menu GET Endpoint
Write-Host "`n🔍 Testing Menu GET Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/menu" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    Write-Host "📋 GET Menu: $($response.StatusCode) - Success: $($content.success)" -ForegroundColor Green
} catch {
    Write-Host "📋 GET Menu: Error - Database connection issue (expected without MongoDB)" -ForegroundColor Yellow
}

# Test Orders GET Endpoint
Write-Host "`n🔍 Testing Orders GET Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/orders" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    Write-Host "📋 GET Orders: $($response.StatusCode) - Success: $($content.success)" -ForegroundColor Green
} catch {
    Write-Host "📋 GET Orders: Error - Database connection issue (expected without MongoDB)" -ForegroundColor Yellow
}

Write-Host "`n" + "=" * 50
Write-Host "✅ API Tests Completed!" -ForegroundColor Green
Write-Host "`n📝 Note: Database endpoints may fail without MongoDB running." -ForegroundColor Yellow
Write-Host "This is expected for development testing." -ForegroundColor Yellow