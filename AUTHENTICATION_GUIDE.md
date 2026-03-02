# Wind Turbine Monitoring System - Authentication & Authorization Guide

## 🔐 Overview

The Wind Turbine Monitoring System includes a comprehensive JWT-based authentication and role-based access control (RBAC) system implemented at the API Gateway level.

## 🏗️ Architecture

### Authentication Flow

```
1. User submits credentials (Login/Signup)
   ↓
2. Gateway validates credentials
   ↓
3. Gateway generates JWT token with username and role
   ↓
4. Token returned to frontend (stored in localStorage)
   ↓
5. Frontend includes token in all subsequent API requests
   ↓
6. Gateway validates token and extracts user info
   ↓
7. Gateway forwards request with X-Username and X-User-Role headers
   ↓
8. Backend services enforce role-based permissions
```

##  User Roles

### ADMIN Role
- **Full Access**: Create, Read, Update, Delete (CRUD) operations on all turbines
- Can manage all turbine data
- Can change turbine status
- No restrictions

### USER Role
- **Read-Only Access**: Can only view turbine data
- Cannot create new turbines
- Cannot update existing turbines
- Cannot delete turbines
- Attempting CRUD operations returns `403 Forbidden`

## 📡 API Endpoints

### Authentication Endpoints

#### 1. **Sign Up**
```http
POST http://localhost:4200/auth/signup
Content-Type: application/json

{
  "username": "john",
  "password": "john123",
  "email": "john@example.com",
  "fullName": "John Doe",
  "role": "USER"  // or "ADMIN"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "john",
  "message": "Registration successful"
}
```

#### 2. **Login**
```http
POST http://localhost:4200/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "admin",
  "message": "Login successful"
}
```

#### 3. **Get Current User**
```http
GET http://localhost:4200/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "fullName": "Administrator",
  "role": "ADMIN"
}
```

#### 4. **Logout**
```http
POST http://localhost:4200/auth/logout
Authorization: Bearer {token}
```

### Turbine Endpoints (Role-Based)

#### 1. **Get All Turbines** (All Users)
```http
GET http://localhost:4200/api/turbines
Authorization: Bearer {token}
```

#### 2. **Create Turbine** (ADMIN Only)
```http
POST http://localhost:4200/api/turbines
Authorization: Bearer {token}
Content-Type: application/json

{
  "turbineName": "WT-2201",
  "farmName": "Green Hills Wind Farm",
  "farmId": "FARM-05",
  "region": "North",
  "capacity": 3000,
  "status": "ACTIVE",
  "latitude": 42.3601,
  "longitude": -71.0589
}
```

**USER Role Response:**
```json
{
  "message": "Access Denied: Only administrators can create turbines"
}
```
HTTP Status: `403 Forbidden`

#### 3. **Update Turbine** (ADMIN Only)
```http
PUT http://localhost:4200/api/turbines/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "turbineName": "WT-2201-Updated",
  "status": "MAINTENANCE",
  ...
}
```

#### 4. **Delete Turbine** (ADMIN Only)
```http
DELETE http://localhost:4200/api/turbines/{id}
Authorization: Bearer {token}
```

## 👤 Default Users

The system comes with two pre-configured accounts:

### Administrator Account
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `ADMIN`
- **Permissions**: Full CRUD access

### Operator Account
- **Username**: `operator`
- **Password**: `operator123`
- **Role**: `USER`
- **Permissions**: Read-only access

## 🎨 Frontend Features

### Login Page (`/login`)
- Username and password fields
- "Remember me" functionality via localStorage
- Direct links to signup page
- Shows demo account credentials
- Error handling with user-friendly messages

### Signup Page (`/signup`)
- Full name, email, username, password fields
- **Role Selection Dropdown**:
  - `USER` (View Only)
  - `ADMIN` (Full Access)
- Helper text explaining role differences
- Automatic login after successful signup
- Validation and error messages

### Dashboard Page (`/dashboard`)
- **Header** shows:
  - Username
  - Role badge (color-coded)
  - Logout button
- **Statistics Bar**:
  - Total Turbines
  - Active count (green)
  - Maintenance count (orange)
  - Offline count (red)

### Turbine Management

#### ADMIN View
- ✅ "Add New Turbine" button at top
- ✅ "Edit" and "Delete" buttons on each turbine card
- ✅ Modal form for add/edit operations
- ✅ All fields editable
- ✅ Success/error notifications

#### USER View
- ❌ No "Add New Turbine" button
- ❌ No "Edit" or "Delete" buttons
- ℹ️ "View-only access" notice on each card
- ✅ Can view all turbine information
- ❌ Attempting to directly call CRUD APIs returns 403 error

## 🔒 Security Implementation

### JWT Token Structure
```json
{
  "sub": "username",
  "role": "ADMIN",
  "iat": 1709371234,
  "exp": 1709457634
}
```

- **Algorithm**: HS256
- **Expiration**: 24 hours
- **Claims**: username (subject) and role

### Gateway Security (`SecurityConfig.java`)
- CSRF disabled (stateless JWT)
- HTTP Basic disabled
- Form Login disabled
- Permits `/auth/**` endpoints
- All other endpoints require authentication

### JWT Authentication Filter
- Intercepts all requests except `/auth/**`
- Extracts and validates JWT tokens
- Adds `X-Username` and `X-User-Role` headers
- Returns `401 Unauthorized` for invalid tokens

### Backend Authorization
Each CRUD endpoint in `TurbineController` checks the `X-User-Role` header:

```java
@PostMapping
public ResponseEntity<?> createTurbine(@RequestBody Turbine turbine, 
                                       @RequestHeader(value = "X-User-Role", required = false) String role) {
    if (!"ADMIN".equals(role)) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Access Denied: Only administrators can create turbines"));
    }
    // ... create logic
}
```

## 🧪 Testing the System

### 1. Test with Browser

1. Open http://localhost:4200
2. You'll be redirected to `/login` if not authenticated
3. Try logging in with:
   - **ADMIN**: `admin` / `admin123`
   - **USER**: `operator` / `operator123`
4. As ADMIN:
   - Click "Add New Turbine"
   - Fill form and save
   - Edit an existing turbine
   - Delete a turbine
5. Logout and login as USER:
   - Notice no Add/Edit/Delete buttons
   - View-only access confirmed

### 2. Test with cURL

**Get Token:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')
```

**Use Token:**
```bash
# Get all turbines
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/turbines

# Create turbine (ADMIN only)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"turbineName":"Test","farmName":"Test Farm","farmId":"TEST-01","region":"North","capacity":2500,"status":"ACTIVE","latitude":40.7128,"longitude":-74.0060}' \
  http://localhost:8080/api/turbines
```

## 📁 Key Files

### Backend
- `gateway-service/src/main/java/com/greenko/gateway/`
  - `config/SecurityConfig.java` - Spring Security configuration
  - `security/JwtUtil.java` - JWT generation and validation
  - `security/JwtAuthenticationFilter.java` - Request filter
  - `controller/AuthController.java` - Auth endpoints
  - `service/AuthService.java` - Authentication logic
  - `repository/UserRepository.java` - In-memory user storage
  - `model/User.java` - User model

- `turbine-service/src/main/java/com/greenko/turbineservice/controller/TurbineController.java` - Role-based endpoints

### Frontend
- `frontend/src/app/components/`
  - `login.component.ts` - Login UI
  - `signup.component.ts` - Signup UI with role selection
  - `dashboard.component.ts` - Main dashboard with role-based UI
- `frontend/src/app/services/`
  - `auth.service.ts` - Authentication service
  - `auth.interceptor.ts` - HTTP interceptor for JWT
  - `turbine.service.ts` - Turbine API calls with auth

- `frontend/nginx.conf` - Proxies `/auth` and `/api` to gateway

## 🎯 Role-Based UI Logic

The dashboard dynamically shows/hides features based on user role:

```typescript
// Check if user is admin
if (this.userRole === 'ADMIN') {
  // Show Add/Edit/Delete buttons
  showAddButton = true;
  showCRUDActions = true;
} else {
  // Show read-only notice
  showViewOnlyNotice = true;
}
```

Backend enforces authorization even if UI is bypassed:

```java
if (!"ADMIN".equals(role)) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("message", "Access Denied..."));
}
```

## 🚀 Getting Started

1. **Start the system:**
   ```bash
   cd /home/akhilduddela/test/greenko-level-2/wind-turbine-monitoring
   docker compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:4200
   - Gateway API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html

3. **Login with default accounts or sign up new users**

4. **Test role-based access control**

## ✅ System Status

- ✅ JWT authentication implemented
- ✅ Role-based authorization (ADMIN/USER)
- ✅ Login/Signup/Logout functionality
- ✅ Token stored in localStorage
- ✅ HTTP interceptor for automatic token injection
- ✅ Backend enforces role permissions
- ✅ Frontend UI adapts to user role
- ✅ Default admin and user accounts
- ✅ Password hashing (BCrypt)
- ✅ Token includes role claim
- ✅ Gateway validates and forwards auth info

##  Security Notes

- Tokens expire after 24 hours
- Passwords are BCrypt hashed
- CORS enabled for development (`*`)
- In production: Use HTTPS, restrict CORS, add rate limiting
- Consider JWT refresh tokens for production
- Add token blacklist for logout in production

---

**System Ready!** Open http://localhost:4200 and test the authentication and role-based access control.
