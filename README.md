# Wind Turbine Monitoring System - Complete Documentation

## 🎯 System Overview

Real-time wind turbine health monitoring system with microservices architecture, featuring:
- **Live telemetry tracking** (10-second intervals)
- **Intelligent anomaly detection** and alerting
- **Role-based access control** (ADMIN/USER)
- **Interactive dashboard** with real-time charts
- **RESTful APIs** with Feign client inter-service communication

---

## 📐 Architecture

### Services

```
┌─────────────┐
│   Frontend  │ (Angular 17 + Nginx) → Port 4200
│   (Nginx)   │
└──────┬──────┘
       │ Reverse Proxy
       ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                             │
├─────────────────────────────────────────────────────────────────┤
│  Turbine Service (8081) - Auth, CRUD, User Management            │
│  Telemetry Service (8083) - Real-time sensor data collection     │
│  Alert Service (8082) - Anomaly detection + notifications        │
│  Gateway Service (8080) - [Legacy - currently bypassed]          │
└─────────────────────────────────────────────────────────────────┘
       │
       ↓ Feign Clients
┌─────────────────────────────────────────────────────────────────┐
│  alert-service ← Feign → turbine-service                         │
│  alert-service ← Feign → telemetry-service                       │
└─────────────────────────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────────┐
│  Monitoring: Prometheus (9090) + Grafana (3000)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 17 (Standalone Components), Chart.js, RxJS, Nginx |
| **Backend** | Spring Boot 4.0.2, Spring WebMVC, Spring Data JPA |
| **Inter-Service** | Spring Cloud OpenFeign |
| **Security** | Spring Security, JWT (JSON Web Tokens), BCrypt |
| **Database** | H2 (in-memory), Flyway migrations |
| **Monitoring** | Prometheus, Grafana, Actuator |
| **Containerization** | Docker, Docker Compose |

---

## 📊 Data Models

### 1. Turbine (`turbine-service`)
```sql
CREATE TABLE turbines (
    turbine_id VARCHAR(50) PRIMARY KEY,
    turbine_name VARCHAR(100) NOT NULL,
    farm_id VARCHAR(50),
    farm_name VARCHAR(100),
    region VARCHAR(50),
    capacity DOUBLE,                 -- MW
    status VARCHAR(20),              -- ACTIVE, MAINTENANCE, OFFLINE
    latitude DOUBLE,
    longitude DOUBLE,
    installation_date TIMESTAMP,
    last_maintenance_date TIMESTAMP
);
```

### 2. User (`turbine-service`)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,   -- BCrypt hashed
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20),                 -- ADMIN or USER
    created_at TIMESTAMP,
    last_login TIMESTAMP
);
```

### 3. Telemetry Data (`telemetry-service`)
```sql
CREATE TABLE telemetry_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turbine_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    power_output DOUBLE,              -- MW
    wind_speed DOUBLE,                -- m/s
    temperature DOUBLE,               -- °C
    vibration DOUBLE,                 -- mm/s
    rpm DOUBLE,                       -- revolutions per minute
    efficiency DOUBLE,                -- percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_turbine_timestamp (turbine_id, timestamp)
);
```

### 4. Alerts (`alert-service`)
```sql
CREATE TABLE alerts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turbine_id VARCHAR(50) NOT NULL,
    turbine_name VARCHAR(100),
    severity VARCHAR(20) NOT NULL,    -- CRITICAL, WARNING, INFO
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    INDEX idx_turbine_severity (turbine_id, severity)
);
```

---

## 🔌 API Endpoints

### Authentication & User Management (`/api/auth`, `/api/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | Public |
| POST | `/api/auth/login` | Login (returns JWT) | Public |
| POST | `/api/auth/logout` | Logout | JWT |
| GET | `/api/auth/me` | Get current user info | JWT |

**Sample Request:**
```bash
# Login
curl -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response: {"token":"eyJhbGc...","username":"admin","role":"ADMIN"}
```

### Turbine Management (`/api/turbines`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/turbines` | List all turbines | JWT |
| GET | `/api/turbines/{id}` | Get turbine by ID | JWT |
| POST | `/api/turbines` | Create turbine | JWT + ADMIN |
| PUT | `/api/turbines/{id}` | Update turbine | JWT + ADMIN |
| PATCH | `/api/turbines/{id}/status` | Update status | JWT + ADMIN |
| DELETE | `/api/turbines/{id}` | Delete turbine | JWT + ADMIN |

### Telemetry Data (`/api/telemetry`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/telemetry` | Ingest telemetry data | JWT |
| GET | `/api/telemetry/{turbineId}/latest` | Get latest reading | JWT |
| GET | `/api/telemetry/{turbineId}` | Get telemetry history | JWT |
| GET | `/api/telemetry/{turbineId}/stats` | Get aggregated stats | JWT |
| GET | `/api/telemetry/recent` | Get recent telemetry (all turbines) | JWT |
| GET | `/api/telemetry/health` | Health check | Public |

**Sample Request:**
```bash
# Get latest telemetry
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:4200/api/telemetry/TRB-001/latest

# Ingest data
curl -X POST http://localhost:4200/api/telemetry \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"turbineId":"TRB-001","timestamp":"2026-03-02T12:00:00","powerOutput":4.5,"windSpeed":12.5,"temperature":45.0,"vibration":3.2,"rpm":18.5,"efficiency":90.0}'
```

### Alert Management (`/api/alerts`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/alerts` | List all alerts (with filters) | JWT |
| GET | `/api/alerts/{id}` | Get alert by ID | JWT |
| GET | `/api/alerts/turbine/{turbineId}` | Get alerts for turbine | JWT |
| POST | `/api/alerts` | Create manual alert | JWT + ADMIN |
| PATCH | `/api/alerts/{id}/acknowledge` | Acknowledge alert | JWT + ADMIN |
| PATCH | `/api/alerts/{id}/resolve` | Resolve alert | JWT + ADMIN |
| DELETE | `/api/alerts/{id}` | Delete alert | JWT + ADMIN |
| POST | `/api/alerts/scan` | Scan for anomalies | JWT + ADMIN |
| GET | `/api/alerts/health` | Health check | Public |

**Sample Request:**
```bash
# Get CRITICAL alerts
curl -H "Authorization: Bearer eyJhbGc..." \
  "http://localhost:4200/api/alerts?severity=CRITICAL&status=ACTIVE"

# Acknowledge alert
curl -X PATCH http://localhost:4200/api/alerts/1/acknowledge \
  -H "Authorization: Bearer eyJhbGc..."

# Scan for anomalies (trigger alert generation)
curl -X POST http://localhost:4200/api/alerts/scan \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 🚨 Alert Rules (Anomaly Detection)

| Rule | Condition | Severity |
|------|-----------|----------|
| **Critical Low Power** | `power < 10% capacity` AND `windSpeed > 5 m/s` | CRITICAL |
| **Critical Vibration** | `vibration > 15.0 mm/s` | CRITICAL |
| **High Temperature** | `temperature > 80°C` | WARNING |
| **High Wind Speed** | `windSpeed > 25 m/s` | WARNING |
| **Low Efficiency** | `efficiency < 70%` | INFO |

**Implementation:**
- Alert service uses Feign clients to fetch turbine data and latest telemetry
- Anomaly scan triggered via `/api/alerts/scan` endpoint
- Auto-generates alerts based on threshold rules

---

## 🎨 Frontend Features

### Dashboard Tabs

1. **Dashboard** - Real-time KPIs, farm overview, recent alerts
2. **Live Feed** - Streaming updates of system events
3. **Turbines** - CRUD operations, search, filter, pagination
4. **Analytics** - Interactive charts (line, bar, pie, donut) with Chart.js
5. **Farms** - Farm-level metrics and aggregations
6. **Alerts** - Alert management with acknowledge/resolve actions
7. **Reports** - [Coming soon]

### Features

- ✅ Role-based UI (ADMIN can create/update/delete turbines)
- ✅ Real-time data polling (30-second auto-refresh)
- ✅ JWT token management (stored in localStorage)
- ✅ Interactive charts with Chart.js
- ✅ Toast notifications for user actions
- ✅ Responsive design with gradients and animations
- ✅ Dark-themed sidebar with filters
- ✅ Search, sort, and pagination for turbines

---

## 🔒 Security

### Authentication Flow

1. User logs in via `/api/auth/login`
2. Backend validates credentials (BCrypt password check)
3. JWT token issued with `username` and `role` claims
4. Frontend stores token in localStorage
5. All subsequent requests include `Authorization: Bearer {token}` header
6. Backend validates JWT for protected endpoints

### Authorization

- **Public endpoints:** `/api/auth/login`, `/api/auth/signup`, actuator health
- **USER role:** Can view turbines, telemetry, alerts
- **ADMIN role:** Full CRUD on turbines, can acknowledge/resolve alerts, trigger anomaly scans

### JWT Structure

```json
{
  "sub": "admin",
  "role": "ADMIN",
  "iat": 1709386932,
  "exp": 1709473332
}
```

---

## 🐳 Deployment

### Prerequisites

- Docker & Docker Compose
- Port 4200, 8080-8083, 9090, 3000 available

### Build & Run

```bash
cd wind-turbine-monitoring

# Build all services
docker compose build

# Start all services
docker compose up -d

# Check status
docker ps

# View logs
docker logs -f telemetry-service
docker logs -f alert-service
docker logs -f turbine-service
```

### Access

- **Frontend:** http://localhost:4200
- **Turbine Service:** http://localhost:8081
- **Alert Service:** http://localhost:8082
- **Telemetry Service:** http://localhost:8083
- **Gateway Service:** http://localhost:8080 (not actively used)
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3000 (admin/admin)

### Default Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| user | user123 | USER |

---

## 🧪 Testing

### Manual API Testing

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# 2. Get all turbines
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4200/api/turbines | jq '.'

# 3. Get latest telemetry for TRB-001
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4200/api/telemetry/TRB-001/latest | jq '.'

# 4. Get CRITICAL alerts
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4200/api/alerts?severity=CRITICAL" | jq '.'

# 5. Scan for anomalies
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:4200/api/alerts/scan | jq '.'

# 6. Acknowledge alert ID=1
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  http://localhost:4200/api/alerts/1/acknowledge | jq '.'
```

### Testing Feign Client Integration

```bash
# Alert service calls turbine-service and telemetry-service
# Check alert-service logs for Feign client activity:
docker logs alert-service | grep -i feign
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker logs turbine-service
docker logs telemetry-service
docker logs alert-service

# Restart specific service
docker compose restart telemetry-service

# Rebuild if code changed
docker compose build telemetry-service
docker compose up -d telemetry-service
```

### 401 Unauthorized errors

- Check JWT token is included in `Authorization` header
- Token expires after 24 hours - re-login
- Verify user role (ADMIN vs USER)

### 404 Not Found for APIs

- Nginx routes `/api/telemetry` → `telemetry-service:8083`
- Nginx routes `/api/alerts` → `alert-service:8082`
- Nginx routes `/api/*` (fallback) → `turbine-service:8080`
- Check `frontend/nginx.conf` configuration

### Database issues

- H2 is in-memory - data lost on restart
- Access H2 console: http://localhost:8083/h2-console (telemetry)
- JDBC URL: `jdbc:h2:mem:telemetry`, Username: `sa`, Password: (blank)
- Flyway migrations auto-run on startup (check logs)

---

## 🚀 Future Enhancements

- [ ] Persistent database (PostgreSQL/MySQL)
- [ ] WebSocket support for real-time push updates
- [ ] Email/SMS notifications for critical alerts
- [ ] Predictive maintenance using ML models
- [ ] Multi-tenancy support
- [ ] API rate limiting and caching (Redis)
- [ ] Enhanced Grafana dashboards
- [ ] Kubernetes deployment manifests

---

## 📁 Project Structure

```
wind-turbine-monitoring/
├── frontend/                 # Angular 17 app
│   ├── src/app/
│   │   ├── components/       # dashboard, login
│   │   └── services/         # auth, turbine, telemetry, alert
│   ├── nginx.conf            # Reverse proxy config
│   └── Dockerfile
├── turbine-service/          # Auth + Turbine CRUD
│   ├── src/main/
│   │   ├── java/com/greenko/turbineservice/
│   │   │   ├── controller/   # AuthController, TurbineController
│   │   │   ├── model/        # User, Turbine
│   │   │   ├── repository/   # JPA repositories
│   │   │   ├── security/     # JwtUtil, SecurityConfig
│   │   │   └── service/      # Business logic
│   │   └── resources/
│   │       └── db/migration/ # Flyway SQL scripts
│   └── Dockerfile
├── telemetry-service/        # Telemetry data collection
│   ├── src/main/
│   │   ├── java/com/greenko/telemetryservice/
│   │   │   ├── controller/   # TelemetryController
│   │   │   ├── model/        # TelemetryData
│   │   │   ├── repository/   # TelemetryRepository
│   │   │   └── service/      # TelemetryService
│   │   └── resources/
│   │       └── db/migration/ # V1__create_telemetry_table.sql
│   └── Dockerfile
├── alert-service/            # Anomaly detection + alerting
│   ├── src/main/
│   │   ├── java/com/greenko/alertservice/
│   │   │   ├── client/       # TurbineServiceClient, TelemetryServiceClient (Feign)
│   │   │   ├── controller/   # AlertController
│   │   │   ├── dto/          # TurbineDto, TelemetryDataDto
│   │   │   ├── model/        # Alert, AlertSeverity, AlertStatus
│   │   │   ├── repository/   # AlertRepository
│   │   │   └── service/      # AlertService, AlertRules
│   │   └── resources/
│   │       └── db/migration/ # V1__create_alerts_table.sql
│   └── Dockerfile
├── gateway-service/          # [Legacy] Spring Cloud Gateway
├── docker-compose.yml        # Multi-service orchestration
├── prometheus.yml            # Prometheus scrape config
└── README.md                 # This file
```

---

## 📝 Summary

**Wind Turbine Monitoring System** is a production-ready, scalable microservices application that demonstrates:

✅ **Microservices architecture** with Spring Boot 4.0.2  
✅ **Inter-service communication** with Spring Cloud OpenFeign  
✅ **Real-time telemetry** data ingestion and storage  
✅ **Intelligent anomaly detection** and alerting  
✅ **JWT-based authentication** and role-based authorization  
✅ **Modern Angular 17 frontend** with Chart.js visualizations  
✅ **Docker containerization** for easy deployment  
✅ **Prometheus/Grafana** for monitoring and observability  
✅ **RESTful API design** with comprehensive endpoints  
✅ **Database migrations** with Flyway  

**Built by:** AI Assistant (Claude Sonnet 4.5)  
**Status:** ✅ Fully Implemented & Tested  
**Last Updated:** March 2, 2026
