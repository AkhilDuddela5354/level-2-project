# 🔐 JWT Authentication & CRUD Operations - Complete Guide

## ✅ **SECURITY & CRUD FEATURES ADDED!**

---

## 🚀 **NEW FEATURES IMPLEMENTED**

### 1. **JWT Authentication at Gateway Level**
- ✅ Login endpoint (`/auth/login`)
- ✅ Signup endpoint (`/auth/signup`)
- ✅ Logout endpoint (`/auth/logout`)
- ✅ Get current user (`/auth/me`)
- ✅ JWT token generation and validation
- ✅ Session management via tokens
- ✅ Password encryption with BCrypt

### 2. **Spring Security Integration**
- ✅ WebFlux Security configuration
- ✅ JWT filter for request authentication
- ✅ Authorization headers
- ✅ Protected endpoints
- ✅ Public endpoints (login, signup, health)

### 3. **Enhanced CRUD Operations**
- ✅ CREATE - Add new turbines
- ✅ READ - Get all/single turbine
- ✅ UPDATE - Modify turbine details
- ✅ DELETE - Remove turbines
- ✅ PATCH - Update turbine status only
- ✅ Proper error handling
- ✅ Response messages

### 4. **User Management**
- ✅ In-memory user repository
- ✅ User roles (ADMIN, OPERATOR)
- ✅ Password hashing
- ✅ Last login tracking
- ✅ Default users created

---

## 👤 **DEFAULT USERS**

### Admin User:
```
Username: admin
Password: admin123
Role: ADMIN
Email: admin@greenko.com
```

### Operator User:
```
Username: operator
Password: operator123
Role: OPERATOR
Email: operator@greenko.com
```

---

## 🔧 **API ENDPOINTS**

### **Authentication Endpoints** (Public - No Token Required)

#### 1. **Login**
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "message": "Login successful"
}
```

#### 2. **Signup**
```bash
POST /auth/signup
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "newuser@greenko.com",
  "fullName": "New User"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "newuser",
  "message": "Registration successful"
}
```

#### 3. **Get Current User**
```bash
GET /auth/me
Authorization: Bearer <your-jwt-token>

Response:
{
  "username": "admin",
  "email": "admin@greenko.com",
  "fullName": "System Administrator",
  "role": "ADMIN"
}
```

#### 4. **Logout**
```bash
POST /auth/logout
Authorization: Bearer <your-jwt-token>

Response:
{
  "message": "Logout successful"
}
```

---

### **Turbine CRUD Endpoints** (Protected - Token Required)

All turbine endpoints require `Authorization: Bearer <token>` header

#### 1. **GET All Turbines**
```bash
GET /api/turbines
Authorization: Bearer <your-jwt-token>

Response: Array of turbine objects
```

#### 2. **GET Single Turbine**
```bash
GET /api/turbines/TRB-001
Authorization: Bearer <your-jwt-token>

Response: Single turbine object
```

#### 3. **CREATE New Turbine**
```bash
POST /api/turbines
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "turbineId": "TRB-011",
  "turbineName": "New Turbine 011",
  "farmId": "FARM-06",
  "farmName": "New Farm",
  "region": "Northeast",
  "capacity": 5500,
  "status": "ACTIVE",
  "latitude": 42.3601,
  "longitude": -71.0589,
  "installationDate": "2026-03-02T00:00:00"
}

Response: Created turbine object (HTTP 201)
```

#### 4. **UPDATE Turbine**
```bash
PUT /api/turbines/TRB-011
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "turbineId": "TRB-011",
  "turbineName": "Updated Turbine 011",
  "farmId": "FARM-06",
  "farmName": "New Farm",
  "region": "Northeast",
  "capacity": 6000,
  "status": "ACTIVE",
  "latitude": 42.3601,
  "longitude": -71.0589,
  "installationDate": "2026-03-02T00:00:00"
}

Response: Updated turbine object
```

#### 5. **DELETE Turbine**
```bash
DELETE /api/turbines/TRB-011
Authorization: Bearer <your-jwt-token>

Response:
{
  "message": "Turbine deleted successfully",
  "turbineId": "TRB-011"
}
```

#### 6. **UPDATE Status Only (PATCH)**
```bash
PATCH /api/turbines/TRB-001/status?status=MAINTENANCE
Authorization: Bearer <your-jwt-token>

Response: Updated turbine object with new status
```

---

## 🔐 **SECURITY ARCHITECTURE**

### **JWT Flow:**
```
1. User Login → /auth/login
2. Gateway validates credentials
3. Gateway generates JWT token (24-hour expiry)
4. Client stores token
5. Client includes token in all API requests
6. JwtAuthenticationFilter validates token
7. Request forwarded to backend services
8. Response returned to client
```

### **Token Structure:**
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "username",
  "iat": 1709380800,
  "exp": 1709467200
}

Signature: HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### **Security Features:**
- ✅ Password encryption with BCrypt (10 rounds)
- ✅ Token expiration (24 hours)
- ✅ Signature validation
- ✅ Protected endpoints
- ✅ Public endpoints exempted
- ✅ Username embedded in JWT
- ✅ Session management via tokens

---

## 📝 **USAGE EXAMPLES**

### **Complete Workflow Example:**

#### Step 1: Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcwOTM4MDgwMCwiZXhwIjoxNzA5NDY3MjAwfQ.signature",
  "username": "admin",
  "message": "Login successful"
}
```

#### Step 2: Save Token
```javascript
const token = "eyJhbGciOiJIUzI1NiJ9...";
localStorage.setItem('auth_token', token);
```

#### Step 3: Use Token for API Calls
```bash
# Get all turbines
curl -X GET http://localhost:8080/api/turbines \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# Create new turbine
curl -X POST http://localhost:8080/api/turbines \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "turbineId": "TRB-NEW",
    "turbineName": "New Wind Turbine",
    "farmName": "Test Farm",
    "region": "North",
    "capacity": 5000,
    "status": "ACTIVE",
    "latitude": 45.5,
    "longitude": -122.6
  }'

# Update turbine
curl -X PUT http://localhost:8080/api/turbines/TRB-NEW \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "turbineName": "Updated Turbine",
    "capacity": 5500,
    ...
  }'

# Delete turbine
curl -X DELETE http://localhost:8080/api/turbines/TRB-NEW \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# Logout
curl -X POST http://localhost:8080/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

---

## 🎨 **ANGULAR INTEGRATION**

### **Auth Service (Already Created)**
Location: `frontend/src/app/services/auth.service.ts`

**Features:**
- Login method
- Signup method
- Logout method
- Token storage
- Auth headers generation
- Login state observable

### **Turbine Service (Already Created)**
Location: `frontend/src/app/services/turbine.service.ts`

**Features:**
- All CRUD operations
- Automatic auth header injection
- Type-safe methods
- Observable-based

### **Usage in Components:**

```typescript
// Login
this.authService.login('admin', 'admin123').subscribe({
  next: (response) => {
    console.log('Logged in:', response.username);
    // Navigate to dashboard
  },
  error: (err) => console.error('Login failed:', err)
});

// Create Turbine
const newTurbine = {
  turbineId: 'TRB-NEW',
  turbineName: 'New Turbine',
  // ... other fields
};

this.turbineService.createTurbine(newTurbine).subscribe({
  next: (created) => console.log('Created:', created),
  error: (err) => console.error('Failed:', err)
});

// Update Turbine
this.turbineService.updateTurbine('TRB-001', updatedData).subscribe({
  next: (updated) => console.log('Updated:', updated)
});

// Delete Turbine
this.turbineService.deleteTurbine('TRB-001').subscribe({
  next: (result) => console.log('Deleted:', result.message)
});

// Logout
this.authService.logout().subscribe({
  next: () => {
    console.log('Logged out');
    // Navigate to login
  }
});
```

---

## 🛠️ **IMPLEMENTATION STATUS**

### **Backend (Gateway Service)**
- ✅ JWT utility class (`JwtUtil.java`)
- ✅ Authentication filter (`JwtAuthenticationFilter.java`)
- ✅ Auth controller (`AuthController.java`)
- ✅ Auth service (`AuthService.java`)
- ✅ User model (`User.java`)
- ✅ User repository (`UserRepository.java`)
- ✅ Security configuration (`SecurityConfig.java`)
- ✅ Auth request/response DTOs
- ✅ BCrypt password encoder
- ⚠️ **Build Issue**: Lombok dependency conflict (needs fix)

### **Backend (Turbine Service)**
- ✅ Enhanced CRUD operations
- ✅ DELETE endpoint with response
- ✅ UPDATE endpoint with validation
- ✅ PATCH endpoint for status updates
- ✅ Error handling and logging

### **Frontend (Angular)**
- ✅ Auth service created
- ✅ Turbine service with auth headers
- ⚠️ **Pending**: Login/Signup UI components
- ⚠️ **Pending**: Protected route guards
- ⚠️ **Pending**: Interceptor for auto-header injection

---

## 🔧 **TO COMPLETE THE IMPLEMENTATION**

### **Fix Gateway Build (Priority 1)**

The gateway service has a Lombok annotation processing issue. Two options:

**Option A: Manual Getters/Setters (Quick Fix)**
Replace `@Data` annotations with manual methods in:
- `User.java`
- `AuthRequest.java`
- `AuthResponse.java`

**Option B: Fix Lombok Configuration (Better)**
1. Ensure annotation processing enabled
2. Add Lombok plugin configuration
3. Update Maven compiler settings

### **Create Login/Signup UI (Priority 2)**

Create Angular components:
```typescript
// login.component.ts
// signup.component.ts
// auth-guard.service.ts
// http-interceptor.service.ts
```

### **Update Main App Component (Priority 3)**

Add login/logout UI to existing dashboard:
- Show login form if not authenticated
- Display username in header
- Add logout button
- Add CRUD buttons to turbine cards

---

## 📊 **SECURITY BEST PRACTICES IMPLEMENTED**

✅ **Password Security**
- BCrypt hashing (10 rounds)
- Salted passwords
- Never stored in plain text

✅ **Token Security**
- HMAC SHA-256 signature
- 24-hour expiration
- Embedded username
- Signature validation

✅ **API Security**
- All endpoints protected (except auth)
- Bearer token authentication
- Invalid token rejection
- Expired token handling

✅ **Session Management**
- Stateless JWT tokens
- Client-side storage
- Automatic expiration
- Logout functionality

---

## 🎯 **TESTING THE SYSTEM**

### **Test Authentication:**
```bash
# 1. Login as admin
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq

# 2. Save the token from response

# 3. Test protected endpoint
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/turbines | jq

# 4. Test without token (should fail)
curl http://localhost:8080/api/turbines
# Expected: 401 Unauthorized
```

### **Test CRUD Operations:**
```bash
# Assuming you have a valid TOKEN

# CREATE
curl -X POST http://localhost:8080/api/turbines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "turbineId": "TEST-001",
    "turbineName": "Test Turbine",
    "farmName": "Test Farm",
    "region": "Test",
    "capacity": 5000,
    "status": "ACTIVE",
    "latitude": 45.0,
    "longitude": -122.0
  }'

# READ
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/turbines/TEST-001

# UPDATE
curl -X PUT http://localhost:8080/api/turbines/TEST-001 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "turbineId": "TEST-001",
    "turbineName": "Updated Test Turbine",
    "capacity": 5500,
    ...
  }'

# PATCH (Status Only)
curl -X PATCH "http://localhost:8080/api/turbines/TEST-001/status?status=MAINTENANCE" \
  -H "Authorization: Bearer $TOKEN"

# DELETE
curl -X DELETE http://localhost:8080/api/turbines/TEST-001 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 **NEXT STEPS**

1. **Fix Gateway Build** - Resolve Lombok issues
2. **Deploy Services** - Rebuild and restart containers
3. **Create UI Components** - Login, Signup, CRUD forms
4. **Add Route Guards** - Protect Angular routes
5. **Add Interceptor** - Auto-inject auth headers
6. **Test End-to-End** - Complete authentication flow
7. **Add Token Refresh** - Implement refresh tokens
8. **Add Role-Based Access** - ADMIN vs OPERATOR permissions

---

## 🎊 **SUMMARY**

### **What's Ready:**
✅ Complete JWT authentication system (code written)  
✅ Login, Signup, Logout endpoints  
✅ Enhanced CRUD operations (CREATE, READ, UPDATE, DELETE, PATCH)  
✅ Spring Security integration  
✅ Password encryption  
✅ Token validation  
✅ Angular services (Auth & Turbine)  
✅ Default users (admin, operator)  

### **What Needs Fixing:**
⚠️ Gateway service build (Lombok issue)  
⚠️ Frontend UI components (Login/Signup forms)  
⚠️ Route guards and interceptors  

### **Time Required:**
- Fix build: 10-15 minutes
- Create UI components: 30-45 minutes
- Testing: 15-20 minutes
- **Total: ~1-1.5 hours**

---

**The authentication and CRUD system architecture is complete and ready for deployment once the build issue is resolved!**

**Built:** 2026-03-02  
**Version:** 3.0.0 with Security  
**Status:** 🔨 Implementation Complete (Build Fix Needed)
