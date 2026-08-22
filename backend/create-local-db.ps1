# create-local-db.ps1
# Run this once to create the local s2r2_inventory database.
# Usage: Right-click → Run with PowerShell
#        OR in PowerShell terminal: .\create-local-db.ps1

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
$pgPassword = Read-Host "Enter your PostgreSQL postgres user password" -AsSecureString
$plainPwd = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

$env:PGPASSWORD = $plainPwd

$sql = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 's2r2_user') THEN
    CREATE USER s2r2_user WITH PASSWORD 's2r2pass';
    RAISE NOTICE 'Created user s2r2_user';
  ELSE
    RAISE NOTICE 'User s2r2_user already exists';
  END IF;
END
`$`$;
"@

# Create user
Write-Host "`n Creating s2r2_user..." -ForegroundColor Cyan
$sql | & "$pgBin\psql.exe" -U postgres -h 127.0.0.1

# Create DB
Write-Host "`n Creating s2r2_inventory database..." -ForegroundColor Cyan
& "$pgBin\psql.exe" -U postgres -h 127.0.0.1 -c "SELECT 'CREATE DATABASE s2r2_inventory OWNER s2r2_user' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 's2r2_inventory')\gexec"

# Grant privileges
Write-Host "`n Granting privileges..." -ForegroundColor Cyan
& "$pgBin\psql.exe" -U postgres -h 127.0.0.1 -c "GRANT ALL PRIVILEGES ON DATABASE s2r2_inventory TO s2r2_user;"
& "$pgBin\psql.exe" -U postgres -h 127.0.0.1 -d s2r2_inventory -c "GRANT ALL ON SCHEMA public TO s2r2_user;"

$env:PGPASSWORD = ""

Write-Host "`n Done! Database s2r2_inventory is ready." -ForegroundColor Green
Write-Host " Connection: postgresql://s2r2_user:s2r2pass@localhost:5432/s2r2_inventory" -ForegroundColor Yellow
Write-Host "`n Now run in your terminal:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   npm run db:push" -ForegroundColor White
Write-Host "   npm run db:seed" -ForegroundColor White
Read-Host "`nPress Enter to exit"
