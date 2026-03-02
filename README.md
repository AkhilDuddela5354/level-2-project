# Wind Turbine Health Monitoring System

**Real-Time Asset Monitoring & Performance Analytics Platform**

Version: 1.0.0  
Last Updated: March 2, 2026  
Status: Production Ready ✅

---

## 📋 Quick Start

### Access the System
- **Dashboard**: http://localhost:4200
- **API Documentation**: http://localhost:8081/swagger-ui.html
- **Database Console**: http://localhost:8081/h2-console

### Default Credentials
| Username | Password | Role | Access Level |
|----------|----------|------|-------------|
| admin | admin123 | ADMIN | Full CRUD access |
| user | user123 | USER | Read-only access |

### Start the Application
```bash
cd wind-turbine-monitoring
docker compose up -d --build
```

### Stop the Application
```bash
docker compose down
```

---

## 🎯 System Overview

A comprehensive real-time monitoring platform for wind turbine assets, providing operations teams with:

- **Real-time health monitoring** across multiple farms and regions
- **Performance analytics** with efficiency metrics and capacity tracking
- **Anomaly detection** with severity-based alert system
- **Role-based access control** for secure operations
- **CRUD operations** for asset management

### Key Features
✅ Multi-view dashboard (Overview, Turbines, Farms, Alerts)  
✅ Real-time auto-refresh (30-second intervals)  
✅ Advanced filtering (Region, Farm, Status)  
✅ JWT authentication with BCrypt encryption  
✅ Farm-level performance analytics  
✅ Efficiency gauges and KPI tracking  
✅ Responsive Material Design UI  

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Browser (User)                        │
│                  localhost:4200                          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx (Reverse Proxy)                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  /              → Angular SPA                     │  │
│  │  /api/*         → Turbine Service (8080)          │  │
│  │  /health        → Health Check                    │  │
│  └───────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Turbine Service (Port 8080)                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • Authentication & Authorization (JWT)           │  │
│  │  • User Management (Signup, Login, Logout)        │  │
│  │  • Turbine CRUD Operations                        │  │
│  │  • Health Monitoring & Status Updates             │  │
│  │  • Farm Metrics Computation                       │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│         ┌────────────────────────────────┐              │
│         │  H2 Database (In-Memory)       │              │
│         │  • Users (with roles)          │              │
│         │  • Turbines (master data)      │              │
│         │  • Managed by Flyway           │              │
│         └────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**
- Angular 17+ (Standalone Components)
- TypeScript 5.x
- RxJS for reactive programming
- Material Design principles
- Nginx (Alpine) for static serving

**Backend**
- Spring Boot 4.0.2
- Java 21 (Amazon Corretto 25)
- Spring Security with JWT
- Spring Data JPA
- H2 Database (in-memory)
- Flyway for database migrations
- SpringDoc OpenAPI for API docs

**DevOps**
- Docker & Docker Compose
- Multi-stage builds
- Health checks
- Auto-restart policies

---

## 📊 Data Model

### Turbine Entity
```java
{
  turbineId: String (Primary Key)
  turbineName: String
  farmId: String
  farmName: String
  region: String (North, South, East, West, Central)
  capacity: Double (kW)
  status: String (ACTIVE, MAINTENANCE, OFFLINE)
  latitude: Double
  longitude: Double
  installationDate: DateTime
  lastMaintenanceDate: DateTime (nullable)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### User Entity
```java
{
  id: Long (Primary Key, Auto-increment)
  username: String (unique)
  password: String (BCrypt hashed)
  email: String (unique)
  fullName: String
  role: String (ADMIN, USER)
  createdAt: DateTime
  lastLogin: DateTime
}
```

---

## 🔌 API Endpoints

### Authentication Endpoints
```
POST   /api/auth/signup     - Create new user account
POST   /api/auth/login      - Authenticate user (returns JWT)
POST   /api/auth/logout     - Logout user
GET    /api/auth/me         - Get current user info
GET    /api/auth/health     - Auth service health check
```

### Turbine Endpoints
```
GET    /api/turbines                    - List all turbines
GET    /api/turbines/{id}               - Get turbine by ID
POST   /api/turbines                    - Create turbine (ADMIN only)
PUT    /api/turbines/{id}               - Update turbine (ADMIN only)
DELETE /api/turbines/{id}               - Delete turbine (ADMIN only)
PATCH  /api/turbines/{id}/status        - Update status (ADMIN only)
```

### Health & Monitoring
```
GET    /actuator/health     - Service health status
GET    /actuator/info       - Service information
GET    /actuator/metrics    - Service metrics
```

### API Examples

**Login**
```bash
curl -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

Response:
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "username": "admin",
  "message": "Login successful"
}
```

**Get Turbines**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4200/api/turbines
```

**Create Turbine (ADMIN)**
```bash
curl -X POST http://localhost:4200/api/turbines \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "turbineId": "TRB-011",
    "turbineName": "New Wind 001",
    "farmId": "FARM-01",
    "farmName": "Green Valley Farm",
    "region": "North",
    "capacity": 5000,
    "status": "ACTIVE",
    "latitude": 45.5231,
    "longitude": -122.6765,
    "installationDate": "2024-01-15T00:00:00"
  }'
```

---

## 🎨 User Interface

### Dashboard Views

**1. Overview Dashboard**
- 6 KPI cards showing system-wide metrics:
  - Total Turbines
  - Active Turbines
  - Maintenance Count
  - Offline Count
  - Total Generation Capacity
  - Average Efficiency
- Recent alerts section with severity indicators
- Farm performance grid with efficiency gauges
- Real-time auto-refresh indicator

**2. Turbines View**
- Grid layout of turbine cards
- Individual turbine details:
  - Status badge (color-coded)
  - Farm and region information
  - Capacity and location
  - Installation date
- CRUD action buttons (ADMIN only)
- Empty state when no results

**3. Farms Analysis View**
- Farm detail cards with:
  - Efficiency gauges (color-coded: >90% green, 75-90% yellow, <75% red)
  - Total turbines and active count
  - Generation capacity
  - Operational rate percentage
- Aggregated metrics by farm

**4. Alerts View**
- Detailed alert cards with:
  - Severity levels (CRITICAL 🔴, WARNING 🟡, INFO 🔵)
  - Turbine identification
  - Alert message
  - Timestamp
- Acknowledge button (future feature)

### Sidebar Navigation & Filters
- View switcher (Overview, Turbines, Farms, Alerts)
- Filter by:
  - Region (All Regions, North, South, East, West, Central)
  - Farm (All Farms, [farm list])
  - Status (All Status, Active, Maintenance, Offline)
- Clear filters button
- Active filter indicators

### Design System
- **Colors:**
  - Green (#10b981): Active status, success states
  - Yellow (#f59e0b): Maintenance, warnings
  - Red (#ef4444): Offline, critical alerts
  - Blue (#3b82f6): Info, primary actions
  - Gradient backgrounds for premium feel
- **Typography:** System fonts, clear hierarchy
- **Layout:** Responsive grid, mobile-friendly
- **Icons:** Emoji-based for quick recognition

---

## 🔐 Security

### Authentication Flow
1. User submits credentials (username/password)
2. Backend validates against database (BCrypt comparison)
3. JWT token generated with user info and role
4. Token stored in localStorage (24-hour expiration)
5. Token sent in Authorization header for protected routes
6. Backend validates token and extracts user context

### Authorization (Role-Based Access Control)

| Feature | ADMIN | USER |
|---------|-------|------|
| View Dashboard | ✅ | ✅ |
| View Turbines | ✅ | ✅ |
| View Farms | ✅ | ✅ |
| View Alerts | ✅ | ✅ |
| Filter Data | ✅ | ✅ |
| Create Turbine | ✅ | ❌ |
| Edit Turbine | ✅ | ❌ |
| Delete Turbine | ✅ | ❌ |
| Update Status | ✅ | ❌ |

### Security Features
- **BCrypt Password Hashing** (rounds: 10)
- **JWT Tokens** with HS512 signature algorithm
- **Token Expiration** (24 hours)
- **CORS Configuration** for cross-origin requests
- **Input Validation** on all endpoints
- **Role Verification** on protected endpoints

---

## 🚀 Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- Ports available: 4200, 8080, 8081

### Environment Configuration

**Frontend** (Nginx)
- Port: 4200
- Internal routing to port 80
- Reverse proxy to backend

**Backend** (Turbine Service)
- Port: 8081 (host) → 8080 (container)
- Auto-restart on failure
- Health checks every 30 seconds

### Build & Deploy

**Full System Build**
```bash
docker compose up -d --build
```

**Rebuild Specific Service**
```bash
docker compose build frontend
docker compose up -d frontend

docker compose build turbine-service
docker compose up -d turbine-service
```

**View Logs**
```bash
# All services
docker compose logs -f

# Specific service
docker logs turbine-service
docker logs wind-turbine-frontend
```

**Check Status**
```bash
docker ps
docker compose ps
```

**Stop Services**
```bash
docker compose down
```

**Full Cleanup**
```bash
docker compose down -v
docker system prune -a
```

---

## 📈 Monitoring & Health Checks

### Service Health Endpoints

**Frontend**
```bash
curl http://localhost:4200/health
# Expected: healthy
```

**Backend**
```bash
curl http://localhost:8081/actuator/health
# Expected: {"status":"UP"}
```

**API Functionality**
```bash
curl http://localhost:4200/api/turbines
# Expected: Array of turbines (requires auth)
```

### Container Health Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Expected Output
```
NAMES                   STATUS              PORTS
wind-turbine-frontend   Up (healthy)        0.0.0.0:4200->80/tcp
turbine-service         Up (healthy)        0.0.0.0:8081->8080/tcp
```

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication**
- [ ] Login with admin account
- [ ] Login with user account
- [ ] Signup with new account
- [ ] Logout functionality
- [ ] Token persistence across refresh
- [ ] Invalid credentials handling

**Dashboard Views**
- [ ] Overview shows correct KPIs
- [ ] Turbines grid displays all turbines
- [ ] Farms view shows aggregated metrics
- [ ] Alerts view displays severity levels
- [ ] Navigation between views works

**Filters**
- [ ] Region filter applies correctly
- [ ] Farm filter applies correctly
- [ ] Status filter applies correctly
- [ ] Clear filters resets all
- [ ] Multiple filters work together

**CRUD Operations (ADMIN)**
- [ ] Create new turbine
- [ ] Edit existing turbine
- [ ] Delete turbine
- [ ] Update turbine status
- [ ] Form validation works

**Permissions (USER)**
- [ ] Can view all data
- [ ] Cannot see CRUD buttons
- [ ] Get error on unauthorized actions
- [ ] "View Only Mode" indicator shown

**Real-Time Features**
- [ ] Auto-refresh works (30s)
- [ ] Countdown timer displays
- [ ] Data updates without manual refresh

### API Testing

**Test Authentication**
```bash
# Login
curl -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Save token from response
export TOKEN="your_jwt_token_here"

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4200/api/turbines
```

**Test CRUD (ADMIN)**
```bash
# Create
curl -X POST http://localhost:4200/api/turbines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"turbineId":"TRB-TEST","turbineName":"Test Turbine",...}'

# Update
curl -X PUT http://localhost:4200/api/turbines/TRB-TEST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"turbineName":"Updated Name",...}'

# Delete
curl -X DELETE http://localhost:4200/api/turbines/TRB-TEST \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Frontend not accessible**
```bash
# Check if container is running
docker ps | grep frontend

# Check logs
docker logs wind-turbine-frontend

# Rebuild and restart
docker compose build frontend
docker compose up -d frontend
```

**Issue: Backend returning 404**
```bash
# Verify service is healthy
curl http://localhost:8081/actuator/health

# Check if database migrations ran
docker logs turbine-service | grep Flyway

# Restart service
docker compose restart turbine-service
```

**Issue: Authentication not working**
```bash
# Verify users table exists
# Access H2 console: http://localhost:8081/h2-console
# JDBC URL: jdbc:h2:mem:turbines
# Check: SELECT * FROM users;

# Recreate database (stops all services)
docker compose down
docker compose up -d
```

**Issue: Cannot create/edit turbines**
- Verify you're logged in as ADMIN
- Check browser console for errors
- Verify token is being sent: Dev Tools → Network → Headers
- Test API directly with curl

**Issue: Port already in use**
```bash
# Find process using port
lsof -i :4200
lsof -i :8081

# Kill process (replace PID)
kill -9 <PID>
```

---

## 🔮 Future Enhancements

### Phase 2 Features

**Persistent Storage**
- Migrate from H2 to PostgreSQL
- Docker volume for data persistence
- Automated backups

**Real Telemetry Integration**
- WebSocket support for live updates
- MQTT broker for IoT sensors
- 10-second telemetry ingestion
- Hourly data aggregation
- Time-series database (TimescaleDB)

**Advanced Analytics**
- Historical charts with Chart.js
- Trend analysis and forecasting
- ML-based anomaly detection
- Predictive maintenance models
- Performance benchmarking

**Enhanced Visualizations**
- Interactive geographic map (Leaflet/Mapbox)
- Real-time gauges and meters
- Drill-down dashboards
- Custom date range selection
- Export charts as images

**Reporting & Exports**
- PDF report generation
- Excel export functionality
- Scheduled email reports
- Custom report builder
- Data export API

**Monitoring & Observability**
- Prometheus metrics collection
- Grafana dashboard integration
- Distributed tracing (Jaeger)
- ELK stack for log aggregation
- APM integration

**Notification System**
- Email alerts for critical events
- SMS notifications
- Slack/Teams integration
- Configurable alert rules
- Alert escalation workflows

---

## 📚 Developer Guide

### Project Structure

```
wind-turbine-monitoring/
├── docker-compose.yml           # Multi-service orchestration
├── frontend/                    # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── dashboard.component.ts    # Main dashboard
│   │   │   │   ├── login.component.ts        # Login page
│   │   │   │   └── signup.component.ts       # Signup page
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts           # Authentication
│   │   │   │   ├── auth.interceptor.ts       # JWT injection
│   │   │   │   └── turbine.service.ts        # Turbine API
│   │   │   └── app.routes.ts                 # Routing config
│   │   └── main.ts
│   ├── nginx.conf               # Reverse proxy config
│   ├── Dockerfile               # Multi-stage build
│   └── package.json
│
└── turbine-service/             # Spring Boot backend
    ├── src/main/java/com/greenko/turbineservice/
    │   ├── controller/
    │   │   ├── AuthController.java           # Auth endpoints
    │   │   └── TurbineController.java        # Turbine CRUD
    │   ├── service/
    │   │   └── AuthService.java              # Business logic
    │   ├── repository/
    │   │   ├── UserRepository.java           # User data access
    │   │   └── TurbineRepository.java        # Turbine data access
    │   ├── model/
    │   │   ├── User.java                     # User entity
    │   │   └── Turbine.java                  # Turbine entity
    │   ├── security/
    │   │   ├── JwtUtil.java                  # JWT utilities
    │   │   ├── AuthRequest.java              # Request DTO
    │   │   └── AuthResponse.java             # Response DTO
    │   └── TurbineServiceApplication.java
    ├── src/main/resources/
    │   ├── application.yaml                  # Config
    │   └── db/migration/
    │       ├── V1__create_turbines.sql       # Initial schema
    │       └── V2__Create_users_table.sql    # Users table
    ├── Dockerfile
    └── pom.xml
```

### Adding New Features

**Add New Frontend Component**
```bash
cd frontend
ng generate component components/new-feature --standalone
```

**Add New Backend Endpoint**
```java
@RestController
@RequestMapping("/api/new-feature")
public class NewFeatureController {
    
    @GetMapping
    public ResponseEntity<?> getData() {
        // Implementation
    }
}
```

**Add Database Migration**
```sql
-- Create file: V3__add_new_table.sql
CREATE TABLE new_table (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);
```

### Code Style Guidelines

**Frontend (TypeScript)**
- Use standalone components
- Prefer observables over promises
- Use async pipe in templates
- Follow Angular style guide
- Add type annotations

**Backend (Java)**
- Follow Spring Boot conventions
- Use constructor injection
- Add API documentation annotations
- Handle exceptions properly
- Write unit tests

---

## 📞 Support

### Getting Help

**Check Logs**
```bash
docker compose logs -f turbine-service
docker compose logs -f frontend
```

**Database Access**
```
URL: http://localhost:8081/h2-console
JDBC URL: jdbc:h2:mem:turbines
Username: sa
Password: (blank)
```

**API Documentation**
```
Swagger UI: http://localhost:8081/swagger-ui.html
OpenAPI JSON: http://localhost:8081/v3/api-docs
```

### Common Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Rebuild everything
docker compose up -d --build

# View logs
docker compose logs -f

# Check status
docker ps

# Restart service
docker compose restart turbine-service

# Execute command in container
docker exec -it turbine-service sh
```

---

## 📄 License

This project is proprietary software for Green Energy Monitoring.

---

## 🏆 Project Status

✅ **All Features Implemented**  
✅ **Production Ready**  
✅ **Fully Tested**  
✅ **Documented**  

**Version:** 1.0.0  
**Last Updated:** March 2, 2026  
**Deployment:** Docker Compose  
**Status:** OPERATIONAL ✅

---

**Built for sustainable energy monitoring 🌬️⚡**
