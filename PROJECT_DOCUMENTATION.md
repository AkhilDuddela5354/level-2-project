# Wind Turbine Health Monitoring System

## Overview
Real-time monitoring system for wind turbine farms with JWT authentication, role-based access control (RBAC), and health tracking.

## Architecture
```
Frontend (Angular 17) → Nginx → Turbine Service (Port 8081) - Auth + CRUD
                              → Gateway Service (Port 8080) - Routing
                              → Telemetry Service (Port 8082) - Metrics
                              → Alert Service (Port 8083) - Notifications
                              → Prometheus (Port 9090) + Grafana (Port 3000)
```

## Services

### 1. Turbine Service (8081) - Primary Service
**Handles:** Authentication + Turbine CRUD operations
**Key Endpoints:**
- `POST /api/auth/signup` - Register user (select ADMIN/USER role)
- `POST /api/auth/login` - Login, returns JWT token with role claim
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user info
- `GET /api/turbines` - List turbines (all users)
- `POST /api/turbines` - Create turbine (ADMIN only, 403 for USER)
- `PUT /api/turbines/{id}` - Update turbine (ADMIN only)
- `DELETE /api/turbines/{id}` - Delete turbine (ADMIN only)
- `GET /api/turbines/farm/{farmId}` - Filter by farm
- `GET /api/turbines/region/{region}` - Filter by region

**Database:** H2 in-memory with 2 tables:
- `users`: user_id, username, password (BCrypt), email, full_name, role, created_at, last_login
- `turbines`: turbine_id, turbine_name, farm_id, farm_name, region, capacity, status, latitude, longitude, dates

### 2. Gateway Service (8080)
Routes API requests to backend services, CORS enabled, health monitoring

### 3. Telemetry Service (8082)
Collects turbine metrics (temperature, vibration, power output), time-series data storage

### 4. Alert Service (8083)
Monitors health, generates alerts for anomalies, notifications for critical events

### 5. Frontend (4200)
**Tech:** Angular 17 standalone components + Nginx
**Pages:** Login, Signup (with role selector), Dashboard (turbine grid with stats)
**Features:**
- Role-based UI (ADMIN sees Add/Edit/Delete, USER sees view-only message)
- JWT stored in localStorage, auto-injected via HTTP interceptor
- Add/Edit modal, delete confirmation, status badges (ACTIVE/MAINTENANCE/OFFLINE)
- Responsive design, professional styling

## Authentication & Security

### JWT Implementation
- **Algorithm:** HS512, **Expiration:** 24h
- **Claims:** username (sub), role (ADMIN/USER), iat, exp
- **Flow:** Signup/Login → JWT with role → Stored in localStorage → Auto-attached to requests → Backend validates & enforces permissions

### Role-Based Access Control
| Action | ADMIN | USER |
|--------|-------|------|
| View Turbines | ✅ | ✅ |
| Add/Edit/Delete | ✅ | ❌ (403 Forbidden) |

**Backend Enforcement:** Each protected endpoint checks `X-User-Role` header extracted from JWT, returns 403 if not ADMIN

### Security Features
- BCrypt password hashing (spring-security-crypto)
- JWT tokens with role claims (jjwt 0.12.5)
- HTTP-only authentication (no Spring Security framework, custom JWT implementation)
- CORS configured for frontend access

## Technology Stack

**Backend:** Spring Boot 4.0.2, Java 21, Maven, H2 Database, Flyway, Spring Cloud Gateway
**Frontend:** Angular 17, TypeScript, Nginx
**DevOps:** Docker multi-stage builds, Docker Compose
**Monitoring:** Prometheus, Grafana, Spring Actuator
**API Docs:** SpringDoc OpenAPI 3.0.1

## Quick Start

```bash
# Start all services
cd /home/akhilduddela/test/greenko-level-2/wind-turbine-monitoring
docker compose up -d

# Access frontend
open http://localhost:4200

# Sign up as ADMIN
1. Click "Sign Up"
2. Enter details + select "Admin (Full Access)"
3. Auto-logged in after signup

# Test CRUD (ADMIN)
- Add new turbine (➕ button)
- Edit turbine (✏️ button)
- Delete turbine (🗑️ button)

# Test USER role
1. Logout
2. Sign up as "User (View Only)"
3. Verify: No CRUD buttons, 403 on direct API calls
```

## Key Endpoints

```bash
# Authentication
curl -X POST http://localhost:4200/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","email":"test@ex.com","fullName":"Test","role":"ADMIN"}'

curl -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Turbines (with JWT token)
curl http://localhost:4200/api/turbines \
  -H "Authorization: Bearer <token>"

# Health Check
curl http://localhost:8081/actuator/health
```

## Database Schema

**users:** user_id (PK), username (unique), password, email, full_name, role, created_at, last_login
**turbines:** turbine_id (PK), turbine_name, farm_id, farm_name, region, capacity, status, lat/lng, installation_date, last_maintenance_date, created_at, updated_at

10 sample turbines auto-loaded on startup across 5 farms in different regions.

## Features Implemented

✅ JWT authentication with role claims (ADMIN/USER)
✅ Role-based access control with 403 enforcement
✅ Full CRUD operations (Create, Read, Update, Delete turbines)
✅ BCrypt password hashing
✅ Automatic JWT injection (HTTP interceptor)
✅ Responsive dashboard with turbine grid
✅ Status monitoring (ACTIVE/MAINTENANCE/OFFLINE)
✅ Regional and farm-based filtering
✅ Health checks and monitoring
✅ Dockerized microservices
✅ Database migrations (Flyway)
✅ API documentation (OpenAPI/Swagger)
✅ Professional UI with role-aware components

## Development

```bash
# Rebuild services
docker compose build

# View logs
docker logs turbine-service -f

# Restart service
docker compose restart turbine-service

# Check service status
docker compose ps
```

## Production Notes

- **Database:** Switch from H2 to MySQL/PostgreSQL (update application.yaml, add JDBC URL)
- **CORS:** Restrict allowed origins (update nginx.conf and GatewayConfig.java)
- **JWT Secret:** Change SECRET_KEY in JwtUtil.java
- **Token Expiration:** Adjust EXPIRATION_TIME in JwtUtil.java
- **HTTPS:** Add SSL certificates, update nginx configuration
- **Environment Variables:** Externalize database credentials, JWT secret
- **Health Checks:** Add actuator endpoints to telemetry/alert services

## Troubleshooting

**Issue:** Service shows unhealthy
**Fix:** Check `docker logs <service>`, verify port availability, check health endpoint

**Issue:** 403 on CRUD operations
**Fix:** Ensure logged in as ADMIN, check JWT token includes role claim, verify token not expired

**Issue:** Can't login
**Fix:** Verify user created via signup, password matches, backend logs for errors

**Issue:** Frontend can't reach backend
**Fix:** Check nginx.conf routing, verify services running (`docker compose ps`), test direct backend URL

## Contact & Support

**Project Location:** `/home/akhilduddela/test/greenko-level-2/wind-turbine-monitoring`
**Main Services:** Frontend (4200), Turbine (8081), Gateway (8080)
**Documentation:** This file + OpenAPI docs at http://localhost:8081/swagger-ui.html
