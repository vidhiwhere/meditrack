# Quick Authentication Testing - Manual Guide

**Status:** ✅ Ready to test once PostgreSQL is set up

## Quick Start (5 Steps)

### Step 1: Setup Database
```powershell
# Install PostgreSQL from: https://www.postgresql.org/download/windows/
# Create database
psql -U postgres -c "CREATE DATABASE meditrack;"

# Run migrations
$PGPASSWORD = "postgres"
$env:PGPASSWORD = $PGPASSWORD
Get-ChildItem migrations/*.sql | ForEach-Object {
    psql -U postgres -d meditrack -f $_.FullName
}
```

### Step 2: Start Backend Server
```powershell
cd meditrack-backend
npm run dev
```

### Step 3: Run Tests (choose one)

**Option A: Full Test Script**
```powershell
.\test-auth.ps1
```

**Option B: Individual cURL Tests**
```powershell
# Copy-paste commands below
```

---

## Individual Test Commands

### 1️⃣ **REGISTER PATIENT**
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "patient@test.com",
    "phone": "9876543210",
    "password": "testpass123",
    "confirmPassword": "testpass123",
    "role": "patient",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected:** 
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-...",
    "email": "patient@test.com",
    "phone": "9876543210",
    "role": "patient"
  }
}
```

---

### 2️⃣ **REGISTER DOCTOR**
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "doctor@test.com",
    "phone": "9876543211",
    "password": "docpass123",
    "confirmPassword": "docpass123",
    "role": "doctor",
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

---

### 3️⃣ **LOGIN PATIENT**
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "patient@test.com",
    "password": "testpass123"
  }'
```

**Expected:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-...",
    "email": "patient@test.com",
    "phone": "9876543210",
    "role": "patient"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**💾 Save the tokens!** You'll need them for next tests.

---

### 4️⃣ **GET CURRENT USER**
Replace `TOKEN` with your accessToken from step 3:
```powershell
curl -X GET http://localhost:3000/api/auth/me `
  -H "Authorization: Bearer TOKEN"
```

**Expected:**
```json
{
  "user": {
    "id": "550e8400-...",
    "email": "patient@test.com",
    "phone": "9876543210",
    "role": "patient",
    "status": "active",
    "language": "en"
  }
}
```

---

### 5️⃣ **UPDATE PROFILE**
Replace `TOKEN` with your accessToken:
```powershell
curl -X PUT http://localhost:3000/api/auth/profile `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TOKEN" `
  -d '{
    "language": "hi"
  }'
```

**Expected:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-...",
    "email": "patient@test.com",
    "phone": "9876543210",
    "role": "patient",
    "status": "active",
    "language": "hi"
  }
}
```

---

### 6️⃣ **CHANGE PASSWORD**
Replace `TOKEN` with your accessToken:
```powershell
curl -X POST http://localhost:3000/api/auth/change-password `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer TOKEN" `
  -d '{
    "currentPassword": "testpass123",
    "newPassword": "newpass456",
    "confirmPassword": "newpass456"
  }'
```

**Expected:**
```json
{
  "message": "Password changed successfully"
}
```

---

### 7️⃣ **REFRESH TOKEN**
Replace `REFRESH_TOKEN` with your refreshToken from step 3:
```powershell
curl -X POST http://localhost:3000/api/auth/refresh `
  -H "Content-Type: application/json" `
  -d '{
    "refreshToken": "REFRESH_TOKEN"
  }'
```

**Expected:**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 8️⃣ **LOGOUT**
Replace `TOKEN` with your accessToken:
```powershell
curl -X POST http://localhost:3000/api/auth/logout `
  -H "Authorization: Bearer TOKEN"
```

**Expected:**
```json
{
  "message": "Logout successful"
}
```

---

## Error Cases (Testing Error Handling)

### ❌ **Invalid Credentials**
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "patient@test.com",
    "password": "wrongpassword"
  }'
```

**Expected:**
```json
{
  "error": "Invalid credentials"
}
```

---

### ❌ **Duplicate Email**
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "patient@test.com",
    "phone": "9999999999",
    "password": "test123",
    "confirmPassword": "test123",
    "role": "patient",
    "firstName": "Duplicate",
    "lastName": "User"
  }'
```

**Expected:**
```json
{
  "error": "User with this email or phone already exists"
}
```

---

### ❌ **Invalid Role**
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "admin@test.com",
    "phone": "9999999998",
    "password": "test123",
    "confirmPassword": "test123",
    "role": "superadmin",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Expected:**
```json
{
  "error": "Validation failed",
  "details": [{"msg": "Invalid role", ...}]
}
```

---

### ❌ **Missing Authorization Header**
```powershell
curl -X GET http://localhost:3000/api/auth/me
```

**Expected:**
```json
{
  "error": "No token provided"
}
```

---

### ❌ **Invalid Token**
```powershell
curl -X GET http://localhost:3000/api/auth/me `
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Expected:**
```json
{
  "error": "Invalid token",
  "message": "..."
}
```

---

## Test Checklist

- [ ] Register Patient → Get user ID
- [ ] Register Doctor → Get user ID
- [ ] Login Patient → Get accessToken & refreshToken
- [ ] Get Current User → See profile
- [ ] Update Profile → Language changed
- [ ] Change Password → Success
- [ ] Login with New Password → Works
- [ ] Refresh Token → Get new accessToken
- [ ] Logout → Success
- [ ] Invalid Credentials → Error
- [ ] Duplicate Registration → Error
- [ ] Invalid Role → Error
- [ ] Missing Token → Error
- [ ] Invalid Token → Error

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `connect ECONNREFUSED` | Start server: `npm run dev` |
| `database 'meditrack' does not exist` | Create DB: `psql -U postgres -c "CREATE DATABASE meditrack;"` |
| `No token provided` | Add header: `-H "Authorization: Bearer TOKEN"` |
| `Invalid credentials` | Check email/password match |
| `password authentication failed` | Update `.env` with correct DB password |

---

## API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login user |
| POST | `/auth/refresh` | ❌ | Refresh token |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/profile` | ✅ | Update profile |
| POST | `/auth/change-password` | ✅ | Change password |
| POST | `/auth/logout` | ✅ | Logout |

**Auth Legend:** ✅ = Requires `Authorization: Bearer TOKEN` header | ❌ = No auth needed

---

## Next Steps After Testing ✅

1. ✅ Authentication working
2. 📋 **Build Patient Features**
   - Symptom entry endpoint
   - AI analysis service
   - Health score calculation
   - Timeline tracking
3. 👨‍⚕️ **Build Doctor Features**
   - Appointment management
   - Prescription creation
   - Drug interaction checker
   - Analytics dashboard

---

**Questions?** Check the full guide: [SETUP_AND_TEST_GUIDE.md](SETUP_AND_TEST_GUIDE.md)
