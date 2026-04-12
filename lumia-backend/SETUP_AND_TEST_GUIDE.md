# Lumia Authentication - Complete Setup & Testing Guide

## Prerequisites

Before testing authentication, you need to:

1. **PostgreSQL Database**
2. **Node.js** (already have it)
3. **Backend server running**

---

## Part 1: PostgreSQL Setup

### Option A: Using Windows PostgreSQL Installer (Recommended)

1. **Download PostgreSQL**
   - Go to: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 14+ for Windows
   - Run the installer

2. **During Installation**
   - Choose installation directory
   - Set password for `postgres` user (remember this!)
   - Port: 5432 (default)
   - Locale: [Default]

3. **Verify Installation**
   ```powershell
   psql --version
   ```

4. **Add PostgreSQL to PATH** (if not already done)
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Add PostgreSQL `bin` folder to PATH (usually `C:\Program Files\PostgreSQL\15\bin`)
   - Restart PowerShell

### Option B: Using Docker (Alternative)

```powershell
# Install Docker Desktop from: https://www.docker.com/products/docker-desktop
# Then run:

docker run --name Lumia-db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=Lumia `
  -p 5432:5432 `
  -d postgres:15
```

---

## Part 2: Create Database

### Via Command Line

```powershell
# Connect to PostgreSQL as admin
psql -U postgres

# Inside psql console, run:
CREATE DATABASE Lumia;
\q  # Exit
```

### Via pgAdmin (GUI)

1. Open pgAdmin (installed with PostgreSQL)
2. Connect to local server
3. Right-click "Databases" → Create → Database
4. Name: `Lumia`
5. Click Create

---

## Part 3: Run Database Migrations

Run the SQL migration files to create tables:

### Windows PowerShell

```powershell
# Set your PostgreSQL password
$PGPASSWORD = "postgres"
$env:PGPASSWORD = $PGPASSWORD

# Run all migrations
Get-ChildItem migrations/*.sql | ForEach-Object {
    Write-Host "Running migration: $($_.Name)" -ForegroundColor Green
    psql -U postgres -d Lumia -f $_.FullName
}
```

### Or Run Individually

```powershell
$PGPASSWORD = "postgres"
$env:PGPASSWORD = $PGPASSWORD

psql -U postgres -d Lumia -f migrations/001_init_users.sql
psql -U postgres -d Lumia -f migrations/002_init_patients.sql
psql -U postgres -d Lumia -f migrations/003_init_doctors.sql
psql -U postgres -d Lumia -f migrations/004_init_appointments.sql
psql -U postgres -d Lumia -f migrations/005_init_prescriptions.sql
psql -U postgres -d Lumia -f migrations/006_init_symptoms.sql
psql -U postgres -d Lumia -f migrations/007_init_clinics.sql
psql -U postgres -d Lumia -f migrations/008_init_audit_logs.sql
```

### Verify Tables Created

```powershell
$PGPASSWORD = "postgres"
$env:PGPASSWORD = $PGPASSWORD

psql -U postgres -d Lumia -c "\dt"
```

Output should show:
```
           List of relations
 Schema |   Name    | Type  | Owner
--------+-----------+-------+----------
 public | users     | table | postgres
 public | patients  | table | postgres
 public | doctors   | table | postgres
 public | appointments | table | postgres
 public | prescriptions | table | postgres
 public | symptoms  | table | postgres
 public | clinics   | table | postgres
 public | audit_logs | table | postgres
```

---

## Part 4: Configure Environment

1. **Open `.env` file** in `Lumia-backend/.env`

2. **Update database credentials** (example with default PostgreSQL):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres  # Change if you set a different password
DB_NAME=Lumia
```

3. **Save the file**

---

## Part 5: Start Backend Server

```powershell
# Navigate to backend directory
cd c:\Users\vidhi\Documents\Lumia\Lumia-backend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Expected Output:
```
╔════════════════════════════════════╗
║     Lumia Backend Server       ║
║     Port: 3000                     ║
║     Env: development               ║
╚════════════════════════════════════╝

Database connected successfully
Server is running on port 3000
```

---

## Part 6: Test Authentication

### Using PowerShell Test Script

```powershell
# In a NEW PowerShell window, navigate to backend directory
cd c:\Users\vidhi\Documents\Lumia\Lumia-backend

# Run the test script
.\test-auth.ps1
```

### Using cURL (Individual Tests)

```powershell
# Test 1: Register a Patient
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
  }' | ConvertTo-Json

# Test 2: Login
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "patient@test.com",
    "password": "testpass123"
  }' | ConvertTo-Json
```

---

## Part 7: Expected Test Results

### Test 1: Register Patient ✅
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@test.com",
    "phone": "9876543210",
    "role": "patient"
  }
}
```

### Test 2: Register Doctor ✅
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "doctor@test.com",
    "phone": "9876543211",
    "role": "doctor"
  }
}
```

### Test 3: Login ✅
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@test.com",
    "phone": "9876543210",
    "role": "patient"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 4: Get Current User ✅
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@test.com",
    "phone": "9876543210",
    "role": "patient",
    "status": "active",
    "language": "en"
  }
}
```

### Test 5: Update Profile ✅
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@test.com",
    "phone": "9876543210",
    "role": "patient",
    "status": "active",
    "language": "hi"
  }
}
```

### Test 6: Refresh Token ✅
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 7: Change Password ✅
```json
{
  "message": "Password changed successfully"
}
```

### Test 8: Login with New Password ✅
```json
{
  "message": "Login successful",
  "user": {...},
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Test 9: Invalid Credentials ❌
```json
{
  "error": "Invalid credentials"
}
```

### Test 10: Duplicate Registration ❌
```json
{
  "error": "User with this email or phone already exists"
}
```

### Test 11: Invalid Role ❌
```json
{
  "error": "Validation failed",
  "details": [
    {
      "value": "superuser",
      "msg": "Invalid role",
      "param": "role",
      "location": "body"
    }
  ]
}
```

### Test 12: Logout ✅
```json
{
  "message": "Logout successful"
}
```

---

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
**Problem:** Database is not running
**Solution:**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# If not running, start it:
Start-Service postgresql-x64-15  # (version may vary)
```

### Error: "role 'postgres' does not exist"
**Problem:** PostgreSQL user not found
**Solution:** 
- Reinstall PostgreSQL with a username/password
- Or create the user manually in PostgreSQL

### Error: "database 'Lumia' does not exist"
**Problem:** Database not created
**Solution:**
```powershell
$PGPASSWORD = "postgres"
$env:PGPASSWORD = $PGPASSWORD
psql -U postgres -c "CREATE DATABASE Lumia;"
```

### Error: "password authentication failed"
**Problem:** Wrong password in `.env`
**Solution:** Update `.env` with correct PostgreSQL password

### Error: "No token provided" when calling /auth/me
**Problem:** Missing Authorization header
**Solution:**
```powershell
# Correct way:
curl -X GET http://localhost:3000/api/auth/me `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Complete Testing Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `Lumia` created
- [ ] Migrations ran successfully
- [ ] Backend server started (`npm run dev`)
- [ ] Test 1: Register Patient - ✅ Returns user ID
- [ ] Test 2: Register Doctor - ✅ Returns user ID
- [ ] Test 3: Login - ✅ Returns tokens
- [ ] Test 4: Get Current User - ✅ Returns user data
- [ ] Test 5: Update Profile - ✅ Language updated
- [ ] Test 6: Refresh Token - ✅ New token generated
- [ ] Test 7: Change Password - ✅ Password changed
- [ ] Test 8: Login with New Password - ✅ Works
- [ ] Test 9: Invalid Credentials - ✅ Returns error
- [ ] Test 10: Duplicate Registration - ✅ Returns error
- [ ] Test 11: Invalid Role - ✅ Returns validation error
- [ ] Test 12: Logout - ✅ Returns success

---

## Database Verification

After successful tests, verify data in database:

```powershell
$PGPASSWORD = "postgres"
$env:PGPASSWORD = $PGPASSWORD

# Check users table
psql -U postgres -d Lumia -c "SELECT id, email, phone, role FROM users;"

# Check patients table
psql -U postgres -d Lumia -c "SELECT id, user_id, first_name, last_name FROM patients;"

# Check doctors table
psql -U postgres -d Lumia -c "SELECT id, user_id, first_name, last_name FROM doctors;"
```

---

## Next Steps

Once authentication is working:

1. ✅ **Authentication** (Complete - currently testing)
2. 📋 **Patient Features** - Symptom entry, health score, timeline
3. 👨‍⚕️ **Doctor Features** - Appointments, prescriptions, analytics
4. 📅 **Appointment System** - Booking, scheduling, reminders
5. ⚛️ **Frontend** - React app with auth integration

---

## Quick Command Reference

```powershell
# Start server
npm run dev

# Test auth
.\test-auth.ps1

# Check database
$PGPASSWORD = "postgres"; $env:PGPASSWORD = $PGPASSWORD; psql -U postgres -d Lumia -c "\dt"

# View users
$PGPASSWORD = "postgres"; $env:PGPASSWORD = $PGPASSWORD; psql -U postgres -d Lumia -c "SELECT * FROM users;"

# Stop server
Ctrl + C
```

---

**Happy Testing! 🎉**

