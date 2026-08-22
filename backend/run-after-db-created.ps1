# run-after-db-created.ps1
# Run this AFTER creating the s2r2_inventory database.
# It pushes the schema, seeds data, starts the server, and runs all tests.

Set-Location "$PSScriptRoot"

Write-Host "`n[1/4] Pushing Prisma schema to local PostgreSQL..." -ForegroundColor Cyan
npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Host "❌ db:push failed" -ForegroundColor Red; exit 1 }
Write-Host "✅ Schema pushed" -ForegroundColor Green

Write-Host "`n[2/4] Seeding database..." -ForegroundColor Cyan
node prisma/seed.js
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Seed failed" -ForegroundColor Red; exit 1 }
Write-Host "✅ Seed complete" -ForegroundColor Green

Write-Host "`n[3/4] Starting backend server (background)..." -ForegroundColor Cyan
$server = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3
Write-Host "✅ Server PID: $($server.Id)" -ForegroundColor Green

Write-Host "`n[4/4] Running route tests..." -ForegroundColor Cyan
node test-routes.js
$testResult = $LASTEXITCODE

Write-Host "`nStopping test server..." -ForegroundColor Gray
Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue

if ($testResult -eq 0) {
    Write-Host "`n✅ All tests passed! Local setup complete." -ForegroundColor Green
} else {
    Write-Host "`n❌ Some tests failed. Check output above." -ForegroundColor Red
}

Read-Host "`nPress Enter to exit"
