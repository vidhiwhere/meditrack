# Authentication API Testing Guide

## Base URL
```
http://localhost:3000/api
```

## Prerequisites
1. PostgreSQL database running and initialized with migrations
2. Backend server running: `npm run dev`

## API Endpoints

### 1. Register New User
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "patient@example.com",
  "phone": "9876543210",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "patient",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "phone": "9876543210",
    "role": "patient"
  }
}
```

**Error Response (400):**
```json
{
  "error": "User with this email or phone already exists"
}
```

---

### 2. Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "phone": "9876543210",
    "role": "patient"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### 3. Get Current User Profile
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "phone": "9876543210",
    "role": "patient",
    "status": "active",
    "language": "en"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Not authenticated"
}
```

---

### 4. Refresh Access Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

### 5. Update User Profile
**PUT** `/auth/profile`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "language": "hi"
}
```

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "patient@example.com",
    "phone": "9876543210",
    "role": "patient",
    "status": "active",
    "language": "hi"
  }
}
```

---

### 6. Change Password
**POST** `/auth/change-password`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Response (401):**
```json
{
  "error": "Current password is incorrect"
}
```

---

### 7. Logout
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## cURL Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "phone": "9876543210",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "patient",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }'
```

### Get Current User (replace TOKEN with actual access token)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Refresh Token (replace REFRESH_TOKEN with actual refresh token)
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN"
  }'
```

### Change Password
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456",
    "confirmPassword": "newpassword456"
  }'
```

---

## Setup Instructions

### 1. Create PostgreSQL Database
```bash
createdb meditrack
```

### 2. Run Migrations
```bash
# For Windows (PowerShell)
Get-Content migrations/*.sql | psql -U postgres -d meditrack

# Or run individually
psql -U postgres -d meditrack -f migrations/001_init_users.sql
psql -U postgres -d meditrack -f migrations/002_init_patients.sql
psql -U postgres -d meditrack -f migrations/003_init_doctors.sql
# ... run all migration files
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment
```bash
# Copy example to .env
cp .env.example .env

# Update .env with your database credentials
```

### 5. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:3000`

### 6. Test Authentication
Use the cURL examples above or import into Postman

---

## Test Users

After running migrations, you can create test users via the register endpoint or directly in database:

```sql
-- Example queries to check users
SELECT * FROM users;
SELECT * FROM patients;
SELECT * FROM doctors;
```

---

## Authentication Flow

1. **Register** → User creates account → Returns user info
2. **Login** → User authenticates → Returns accessToken + refreshToken
3. **Access Token** → Use in Authorization header for protected endpoints
4. **Refresh Token** → When access token expires, refresh to get new token
5. **Logout** → Clear session (optional, more about clearing client-side token)

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

---

## Next Steps

- [ ] Test all authentication endpoints
- [ ] Implement patient features (symptom entry, profile)
- [ ] Build doctor features (appointments, prescriptions)
- [ ] Setup admin panel
- [ ] Connect to frontend
