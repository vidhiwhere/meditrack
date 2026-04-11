# MediTrack Authentication Testing Script (PowerShell)
# This script tests all authentication endpoints

$BASE_URL = "http://localhost:3000/api"

Write-Host "================================================" -ForegroundColor Yellow
Write-Host "     MediTrack Authentication Testing" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

# Test 1: Register Patient
Write-Host "Test 1: Register a Patient User" -ForegroundColor Cyan
$registerPayload = @{
    email = "patient@test.com"
    phone = "9876543210"
    password = "testpass123"
    confirmPassword = "testpass123"
    role = "patient"
    firstName = "John"
    lastName = "Doe"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $registerPayload

Write-Host "Response:" -ForegroundColor Green
$registerResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# Test 2: Register Doctor
Write-Host "Test 2: Register a Doctor User" -ForegroundColor Cyan
$doctorPayload = @{
    email = "doctor@test.com"
    phone = "9876543211"
    password = "doctorpass123"
    confirmPassword = "doctorpass123"
    role = "doctor"
    firstName = "Jane"
    lastName = "Smith"
} | ConvertTo-Json

$doctorResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $doctorPayload

Write-Host "Response:" -ForegroundColor Green
$doctorResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# Test 3: Login as Patient
Write-Host "Test 3: Login as Patient" -ForegroundColor Cyan
$loginPayload = @{
    email = "patient@test.com"
    password = "testpass123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginPayload

Write-Host "Response:" -ForegroundColor Green
$loginResponseObj = $loginResponse.Content | ConvertFrom-Json
$loginResponseObj | ConvertTo-Json

$accessToken = $loginResponseObj.accessToken
$refreshToken = $loginResponseObj.refreshToken

Write-Host ""
Write-Host "Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Green
Write-Host "Refresh Token: $($refreshToken.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Test 4: Get Current User
Write-Host "Test 4: Get Current User Profile" -ForegroundColor Cyan
$meResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/me" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $accessToken" }

Write-Host "Response:" -ForegroundColor Green
$meResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# Test 5: Update Profile
Write-Host "Test 5: Update User Profile (Language to Hindi)" -ForegroundColor Cyan
$updatePayload = @{
    language = "hi"
} | ConvertTo-Json

$updateResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/profile" `
  -Method PUT `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $accessToken" } `
  -Body $updatePayload

Write-Host "Response:" -ForegroundColor Green
$updateResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# Test 6: Refresh Token
Write-Host "Test 6: Refresh Access Token" -ForegroundColor Cyan
$refreshPayload = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

$refreshResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/refresh" `
  -Method POST `
  -ContentType "application/json" `
  -Body $refreshPayload

Write-Host "Response:" -ForegroundColor Green
$refreshResponseObj = $refreshResponse.Content | ConvertFrom-Json
$refreshResponseObj | ConvertTo-Json

$newAccessToken = $refreshResponseObj.accessToken
Write-Host ""
Write-Host "New Access Token: $($newAccessToken.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Test 7: Change Password
Write-Host "Test 7: Change Password" -ForegroundColor Cyan
$passwordPayload = @{
    currentPassword = "testpass123"
    newPassword = "newpass456"
    confirmPassword = "newpass456"
} | ConvertTo-Json

$passwordResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/change-password" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $accessToken" } `
  -Body $passwordPayload

Write-Host "Response:" -ForegroundColor Green
$passwordResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# Test 8: Login with New Password
Write-Host "Test 8: Login with New Password" -ForegroundColor Cyan
$newLoginPayload = @{
    email = "patient@test.com"
    password = "newpass456"
} | ConvertTo-Json

$newLoginResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $newLoginPayload

Write-Host "Response:" -ForegroundColor Green
$newLoginResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

# Test 9: Test Invalid Credentials
Write-Host "Test 9: Test Invalid Credentials (Should Fail)" -ForegroundColor Cyan
$invalidPayload = @{
    email = "patient@test.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/login" `
      -Method POST `
      -ContentType "application/json" `
      -Body $invalidPayload
} catch {
    Write-Host "Response:" -ForegroundColor Green
    $_.Exception.Response.Content | ConvertFrom-Json | ConvertTo-Json
}
Write-Host ""

# Test 10: Test Duplicate Registration
Write-Host "Test 10: Test Duplicate Registration (Should Fail)" -ForegroundColor Cyan
$duplicatePayload = @{
    email = "patient@test.com"
    phone = "9876543212"
    password = "testpass123"
    confirmPassword = "testpass123"
    role = "patient"
    firstName = "Duplicate"
    lastName = "User"
} | ConvertTo-Json

try {
    $duplicateResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/register" `
      -Method POST `
      -ContentType "application/json" `
      -Body $duplicatePayload
} catch {
    Write-Host "Response:" -ForegroundColor Green
    $_.Exception.Response.Content | ConvertFrom-Json | ConvertTo-Json
}
Write-Host ""

# Test 11: Test Invalid Role
Write-Host "Test 11: Test Invalid Role (Should Fail)" -ForegroundColor Cyan
$invalidRolePayload = @{
    email = "invalid@test.com"
    phone = "9876543221"
    password = "testpass123"
    confirmPassword = "testpass123"
    role = "superuser"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $invalidRoleResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/register" `
      -Method POST `
      -ContentType "application/json" `
      -Body $invalidRolePayload
} catch {
    Write-Host "Response:" -ForegroundColor Green
    $_.Exception.Response.Content | ConvertFrom-Json | ConvertTo-Json
}
Write-Host ""

# Test 12: Logout
Write-Host "Test 12: Logout" -ForegroundColor Cyan
$logoutResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/logout" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $accessToken" }

Write-Host "Response:" -ForegroundColor Green
$logoutResponse.Content | ConvertFrom-Json | ConvertTo-Json
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "     Auth Testing Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
