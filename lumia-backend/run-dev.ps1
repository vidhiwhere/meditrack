# Add PostgreSQL to PATH for this session
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"
$env:PGPASSWORD = "Password"

Write-Host "✅ PostgreSQL configured" -ForegroundColor Green
Write-Host "🚀 Starting Lumia Backend..." -ForegroundColor Cyan
Write-Host ""

# Start the development server
npm run dev

