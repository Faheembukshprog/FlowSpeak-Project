# FlowSpeak Test Data Seeder
# Creates users (Admin, Sales, Viewer) and runs sample AI commands
# Usage:  .\seed-test-data.ps1
# Prereq: Backend running on http://localhost:5070

$API  = 'http://localhost:5070'
$AUTH = $API + '/api/auth'
$ActionUrl = $API + '/api/action/interpret'

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FlowSpeak - Test Data Seeder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -- Health Check --
Write-Host "[1/4] Checking API health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API/api/health" -Method Get -ErrorAction Stop
    Write-Host "  OK: API is ONLINE" -ForegroundColor Green
}
catch {
    Write-Host "  FAIL: API is OFFLINE. Start backend first." -ForegroundColor Red
    exit 1
}

# -- Register Users --
Write-Host ""
Write-Host "[2/4] Registering test users..." -ForegroundColor Yellow

$users = @(
    @{ Username="admin1";       Password="Admin@123!";     FullName="Faheem Admin";       Role="Admin"  }
    @{ Username="admin2";       Password="Admin@123!";     FullName="Sara Admin";         Role="Admin"  }
    @{ Username="sales_ali";    Password="Sales@123!";     FullName="Ali Sales Rep";      Role="Sales"  }
    @{ Username="sales_ayesha"; Password="Sales@123!";     FullName="Ayesha Sales Rep";   Role="Sales"  }
    @{ Username="sales_omar";   Password="Sales@123!";     FullName="Omar Sales Rep";     Role="Sales"  }
    @{ Username="viewer1";      Password="View@123!";      FullName="Ahmed Viewer";       Role="Viewer" }
    @{ Username="viewer2";      Password="View@123!";      FullName="Fatima Viewer";      Role="Viewer" }
    @{ Username="testuser";     Password="Password123!";   FullName="Test User";          Role="Viewer" }
)

foreach ($u in $users) {
    try {
        $body = $u | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$AUTH/register" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
        Write-Host ("  OK: " + $u.Username + " (" + $u.Role + ") - " + $resp.message) -ForegroundColor Green
    }
    catch {
        $raw = $_.ErrorDetails.Message
        if ($raw -and $raw -match "already exists") {
            Write-Host ("  SKIP: " + $u.Username + " (" + $u.Role + ") - Already exists") -ForegroundColor DarkYellow
        }
        else {
            Write-Host ("  FAIL: " + $u.Username + " - " + $_.Exception.Message) -ForegroundColor Red
        }
    }
}

# -- Login as admin1 --
Write-Host ""
Write-Host "[3/4] Logging in as admin1..." -ForegroundColor Yellow

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $loginBody = '{"Username":"admin1","Password":"Admin@123!"}'
    $loginResp = Invoke-RestMethod -Uri "$AUTH/login" -Method Post -ContentType "application/json" -Body $loginBody -WebSession $session -ErrorAction Stop
    Write-Host ("  OK: Logged in as " + $loginResp.user.fullName + " (" + $loginResp.user.role + ")") -ForegroundColor Green
}
catch {
    Write-Host "  FAIL: admin1 login failed. Trying sales_ali..." -ForegroundColor Red
    try {
        $loginBody = '{"Username":"sales_ali","Password":"Sales@123!"}'
        $loginResp = Invoke-RestMethod -Uri "$AUTH/login" -Method Post -ContentType "application/json" -Body $loginBody -WebSession $session -ErrorAction Stop
        Write-Host ("  OK: Logged in as " + $loginResp.user.fullName + " (" + $loginResp.user.role + ")") -ForegroundColor Green
    }
    catch {
        Write-Host "  FAIL: All logins failed. Exiting." -ForegroundColor Red
        exit 1
    }
}

# -- Run Sample AI Commands --
Write-Host ""
Write-Host "[4/4] Running sample AI commands..." -ForegroundColor Yellow

$commands = @(
    "Check stock for Dell XPS 15"
    "How many MacBook Pro 16 do we have?"
    "Is the ThinkPad X1 Carbon available?"
    "Check inventory for HP Spectre x360"
    "Do we have FlowSpeak Master Widget in stock?"
    "Reserve 2 Dell XPS 15s"
    "Reserve 1 HP Spectre x360"
    "Reserve 3 FlowSpeak Master Widgets"
    "What is the price of MacBook Pro 16?"
    "Show me Dell laptop stock"
    "How many HP Spectre x360 are left?"
    "Reserve 5 Dell XPS 15 laptops"
    "Check stock for ThinkPad"
    "I need 10 FlowSpeak Master Widgets"
)

$okCount = 0
$failCount = 0

foreach ($command in $commands) {
    try {
        $body = '{"text":"' + $command + '"}'
        $resp = Invoke-RestMethod -Uri $ActionUrl -Method Post -ContentType "application/json" -Body $body -WebSession $session -ErrorAction Stop

        $tag = "PROCESSED"
        if ($resp.intent) { $tag = $resp.intent }
        
        if ($resp.success) {
            Write-Host ("  OK  [" + $tag + "] " + $command) -ForegroundColor Green
        }
        else {
            Write-Host ("  WARN [" + $tag + "] " + $command) -ForegroundColor DarkYellow
        }
        Write-Host ("       -> " + $resp.message) -ForegroundColor DarkGray
        $okCount++
    }
    catch {
        Write-Host ("  FAIL: " + $command + " - " + $_.Exception.Message) -ForegroundColor Red
        $failCount++
    }
    Start-Sleep -Milliseconds 300
}

# -- Summary --
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SEED COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  USERS (login at http://localhost:5173):" -ForegroundColor White
Write-Host "    Admin   -> admin1 / Admin@123!" -ForegroundColor Gray
Write-Host "    Admin   -> admin2 / Admin@123!" -ForegroundColor Gray
Write-Host "    Sales   -> sales_ali / Sales@123!" -ForegroundColor Gray
Write-Host "    Sales   -> sales_ayesha / Sales@123!" -ForegroundColor Gray
Write-Host "    Sales   -> sales_omar / Sales@123!" -ForegroundColor Gray
Write-Host "    Viewer  -> viewer1 / View@123!" -ForegroundColor Gray
Write-Host "    Viewer  -> viewer2 / View@123!" -ForegroundColor Gray
Write-Host "    Viewer  -> testuser / Password123!" -ForegroundColor Gray
Write-Host ""
Write-Host ("  Commands: " + $okCount + " succeeded, " + $failCount + " failed") -ForegroundColor White
Write-Host ""
