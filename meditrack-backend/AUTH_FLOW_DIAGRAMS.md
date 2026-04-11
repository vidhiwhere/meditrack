# MediTrack Authentication Flow - Visual Guide

## 🔐 Authentication Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│         (Currently: Test via cURL)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
        HTTP/HTTPS API Requests
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Express Server                              │
│              (meditrack-backend)                             │
├──────────────────────────────────────────────────────────────┤
│                   Routes Layer                               │
│  POST /auth/register    POST /auth/login                    │
│  GET  /auth/me         PUT  /auth/profile                   │
│  POST /auth/refresh    POST /auth/logout                    │
│  POST /auth/change-password                                 │
├──────────────────────────────────────────────────────────────┤
│               Middleware Layer                               │
│  • Authentication (verifyToken)                              │
│  • Validation (express-validator)                            │
│  • Error Handler                                             │
│  • CORS, Helmet Security                                     │
├──────────────────────────────────────────────────────────────┤
│               Controller Layer                               │
│  authController.js                                           │
│  • register()        • login()                               │
│  • getCurrentUser()  • updateProfile()                       │
│  • changePassword()  • refreshToken()                        │
├──────────────────────────────────────────────────────────────┤
│               Service Layer                                  │
│  • auth.service.js   • tokenService.js                       │
│  • Password hashing (bcrypt)                                 │
│  • Token generation (JWT)                                    │
│  • User management                                           │
├──────────────────────────────────────────────────────────────┤
│               Database Layer                                 │
│  • PostgreSQL Database                                       │
│  • Users table                                               │
│  • Patients/Doctors tables                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 User Registration Flow

```
┌─────────────────┐
│ User Provides:  │
│ • Email         │
│ • Phone         │
│ • Password      │
│ • Role          │
│ • Name          │
└────────┬────────┘
         │
         ▼
    ┌─────────────────────────────┐
    │ 1. Validation              │
    │ • Email format valid?       │
    │ • Phone 10 digits?         │
    │ • Password 6+ chars?       │
    │ • Role in [patient, doctor]?│
    └─────────────┬───────────────┘
                  │
        ❌ Fail   │   ✅ Pass
              ┌───┴────┐
              │         ▼
          Error    ┌──────────────┐
          401      │ 2. Check if  │
                   │ user exists? │
                   └──────┬───────┘
                          │
                ❌ Exists │   ✅ New
                   │      │
                Error  ┌──▼──────────┐
                400    │ 3. Hash      │
                       │ Password     │
                       │ (bcrypt)     │
                       └──────┬───────┘
                              │
                              ▼
                       ┌───────────────┐
                       │ 4. Create User│
                       │ in Database   │
                       └───────┬───────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ 5. Create     │
                       │ Patient/Doctor│
                       │ Profile       │
                       └───────┬───────┘
                               │
                               ▼
                       ┌──────────────┐
                       │ 6. Return    │
                       │ User ID      │
                       │ 201 Created  │
                       └──────────────┘
```

---

## 🔑 Login & Token Flow

```
┌──────────────────┐
│ User Provides:   │
│ • Email          │
│ • Password       │
└────────┬─────────┘
         │
         ▼
    ┌──────────────────┐
    │ 1. Find User     │
    │ by Email         │
    └────────┬─────────┘
             │
    ❌ Not Found│   ✅ Found
         │      │
    Error 401   ▼
              ┌──────────────────┐
              │ 2. Compare       │
              │ Password (bcrypt)│
              └────────┬─────────┘
                       │
              ❌ No Match│   ✅ Match
                   │     │
              Error 401   ▼
                    ┌────────────────────┐
                    │ 3. Create Tokens   │
                    │ • Access Token     │
                    │   (15 min expiry)  │
                    │ • Refresh Token    │
                    │   (7 day expiry)   │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ 4. Return Tokens   │
                    │ 200 Success        │
                    │ + User Data        │
                    └────────────────────┘

           ╔═════════════════════════════╗
           ║ Access Token Format (JWT)   ║
           ╠═════════════════════════════╣
           ║ Header: {alg, typ}          ║
           ║ Payload:                    ║
           ║ {                           ║
           ║   userId: "uuid",           ║
           ║   role: "patient",          ║
           ║   type: "access",           ║
           ║   iat: timestamp,           ║
           ║   exp: timestamp            ║
           ║ }                           ║
           ║ Signature: HMAC SHA256      ║
           ╚═════════════════════════════╝
```

---

## 🔄 Token Refresh Flow

```
┌──────────────────┐
│ User Provides:   │
│ • Refresh Token  │
└────────┬─────────┘
         │
         ▼
    ┌───────────────────────┐
    │ 1. Verify Refresh     │
    │ Token Signature       │
    │ (using JWT_REFRESH_   │
    │ SECRET)               │
    └────────┬──────────────┘
             │
    ❌ Invalid│   ✅ Valid
         │     │
    Error 401  ▼
              ┌──────────────────┐
              │ 2. Check Token   │
              │ Type = "refresh" │
              └────────┬─────────┘
                       │
            ❌ Wrong Type│   ✅ Correct
                 │       │
            Error 401    ▼
                    ┌──────────────────┐
                    │ 3. Generate New  │
                    │ Access Token     │
                    │ (15 min expiry)  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ 4. Return New    │
                    │ Access Token     │
                    │ 200 Success      │
                    └──────────────────┘
```

---

## 🛡️ Protected Route Access Flow

```
                Frontend
                   │
    ┌──────────────▼────────────────┐
    │ Request to Protected Route    │
    │ GET /api/auth/me             │
    │ Headers: {                   │
    │   Authorization:             │
    │   "Bearer <accessToken>"     │
    │ }                            │
    └──────────────┬────────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │ 1. Extract Token from       │
    │ Authorization Header        │
    │ Format: "Bearer TOKEN"      │
    └──────────────┬──────────────┘
                   │
        ❌ Missing │   ✅ Found
             │     │
        Error401   ▼
                ┌──────────────────┐
                │ 2. Decode Token  │
                │ using JWT_SECRET │
                └────────┬─────────┘
                         │
            ❌ Invalid │   ✅ Valid
                 │      │
            Error401   ▼
                   ┌──────────────────┐
                   │ 3. Check Token   │
                   │ Expiry (exp)     │
                   └────────┬─────────┘
                            │
               ❌ Expired │   ✅ Valid
                    │      │
               Error401   ▼
                      ┌──────────────────┐
                      │ 4. Extract User  │
                      │ Data from Token  │
                      │ (userId, role)   │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ 5. Attach to     │
                      │ req.user object  │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │ 6. Allow Request │
                      │ to Continue      │
                      │ (call next())    │
                      └──────────────────┘
```

---

## 🔒 Password Change Flow

```
┌────────────────────┐
│ User Provides:     │
│ • Current Password │
│ • New Password     │
│ • Auth Header      │
└────────┬───────────┘
         │
         ▼
    ┌──────────────────────┐
    │ 1. Verify Auth Token │
    │ (Protected Route)    │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ 2. Get User from DB  │
    │ using userId from    │
    │ token                │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ 3. Compare Current   │
    │ Password with Hash   │
    │ (bcrypt)             │
    └────────┬─────────────┘
             │
    ❌ Wrong │   ✅ Correct
         │   │
    Error 401 ▼
           ┌──────────────────┐
           │ 4. Hash New      │
           │ Password (bcrypt)│
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │ 5. Update DB     │
           │ with New Hash    │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │ 6. Return        │
           │ Success Message  │
           │ 200 OK           │
           └──────────────────┘
```

---

## 🧮 Role-Based Access Control (RBAC)

```
┌─────────────────────────────────┐
│ Request to Admin Endpoint       │
│ GET /api/admin/dashboard        │
│ Headers: {Authorization: ...}   │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ 1. Verify Token        │
    │ (extract userId, role) │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ 2. Check if User Role  │
    │ in Allowed Roles for   │
    │ Endpoint?              │
    │ Endpoint: [admin]      │
    │ User Role: patient     │
    └────────┬───────────────┘
             │
    ❌ Not Allowed│   ✅ Allowed
             │      │
        Error 403   ▼
                ┌──────────────┐
                │ 3. Allow     │
                │ Access       │
                │ 200 OK       │
                └──────────────┘
```

---

## 🔐 Security Layers

```
                ┌─────────────────┐
                │   Client Request│
                └────────┬────────┘
                         │
        ┌────────────────▼────────────────┐
        │ 1. HTTPS/TLS Encryption        │ ◄─ Network Level
        └────────────────┬────────────────┘
                         │
        ┌────────────────▼───────────────┐
        │ 2. Helmet Security Headers    │ ◄─ Server Level
        │ (XSS, CSRF, etc.)             │
        └────────────────┬───────────────┘
                         │
        ┌────────────────▼─────────────────┐
        │ 3. CORS Verification            │ ◄─ Request Level
        │ Only allowed origins            │
        └────────────────┬─────────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │ 4. Body Validation               │ ◄─ Data Level
        │ Input format, size, type          │
        └────────────────┬──────────────────┘
                         │
        ┌────────────────▼───────────────┐
        │ 5. JWT Verification            │ ◄─ Auth Level
        │ Signature & expiry check        │
        └────────────────┬───────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │ 6. Role Verification             │ ◄─ Authorization
        │ User role vs endpoint required    │
        └────────────────┬──────────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │ 7. Database Stored Hash          │ ◄─ Storage Level
        │ bcrypt + salt for passwords      │
        └────────────────┬──────────────────┘
                         │
        ┌────────────────▼──────────────────┐
        │ 8. Audit Logging                 │ ◄─ Monitoring
        │ Track all access & changes        │
        └─────────────────────────────────┘
```

---

## 📊 Token Lifecycle

```
Time ──────────────────────────────────────────────────────►

User Registers/Logins
       │
       ▼
┌──────────────────────────────────────────────┐
│ JWT Access Token Created (15 min)            │
│ ├─ Sent to Client                            │
│ ├─ Used in Authorization Header              │
│ └─ Expires after 15 minutes                  │
└──────────────────────────────────────────────┘
       │
       ├─ (0-15 min) API Requests Successful
       │  Each request passes token validation
       │
       │(15 min mark)
       ▼
  Access Token Expires
       │
       ├─ API requests with old token → 401 Error
       │
       ▼
┌──────────────────────────────────────────────┐
│ JWT Refresh Token (7 days)                   │
│ ├─ Stored securely (HTTP-only cookie)        │
│ ├─ Used to get new Access Token              │
│ └─ Lasts 7 days                              │
└──────────────────────────────────────────────┘
       │
       ├─ (15 min - 7 days) User calls
       │  POST /api/auth/refresh
       │  ↓
       │  Get new Access Token
       │  Continue API requests
       │
       │(7 days mark)
       ▼
  Refresh Token Expires
       │
       ├─ User must login again
       │
       ▼
  User Re-authenticates
       │ (Back to beginning)
```

---

## ✅ Test Flow Diagram

```
START
  │
  ├─► TEST 1: Register Patient
  │    └─ Expect: User ID ✅
  │
  ├─► TEST 2: Register Doctor
  │    └─ Expect: User ID ✅
  │
  ├─► TEST 3: Login Patient
  │    └─ Expect: accessToken + refreshToken ✅
  │
  ├─► TEST 4: Get Current User
  │    └─ Expect: User profile ✅
  │
  ├─► TEST 5: Update Profile
  │    └─ Expect: Language changed ✅
  │
  ├─► TEST 6: Change Password
  │    └─ Expect: Success message ✅
  │
  ├─► TEST 7: Refresh Token
  │    └─ Expect: New accessToken ✅
  │
  ├─► TEST 8: Logout
  │    └─ Expect: Success message ✅
  │
  ├─► TEST 9: Invalid Credentials
  │    └─ Expect: 401 Error ✅
  │
  ├─► TEST 10: Duplicate Registration
  │    └─ Expect: 400 Error ✅
  │
  ├─► TEST 11: Invalid Role
  │    └─ Expect: Validation Error ✅
  │
  ├─► TEST 12: Missing Token
  │    └─ Expect: 401 Error ✅
  │
  ├─► TEST 13: Invalid Token
  │    └─ Expect: 401 Error ✅
  │
  └─► ALL TESTS PASSED ✅
       │
       ▼
    Ready for Next Feature!
```

---

## 🎯 This Visualization Shows:

✅ Complete authentication architecture
✅ User registration flow with validation
✅ Login and token generation flow
✅ Token refresh mechanism
✅ Protected route access flow
✅ Password change flow
✅ Role-Based Access Control (RBAC)
✅ Security layers
✅ Token lifecycle
✅ Testing flow

---

**All these flows are now implemented and ready for testing! 🚀**
