# Telemetry & Alert Services Integration - Summary

## ✅ Implementation Complete

### Services Implemented

#### 1. **Telemetry Service** (Port 8083)
- **Purpose:** Real-time sensor data collection and storage
- **Database:** H2 in-memory (`jdbc:h2:mem:telemetry`)
- **Endpoints:**
  - `POST /api/telemetry` - Ingest telemetry data
  - `GET /api/telemetry/{turbineId}/latest` - Get latest reading
  - `GET /api/telemetry/{turbineId}` - Get history (with time filters)
  - `GET /api/telemetry/recent` - Get recent data (all turbines)
  - `GET /api/telemetry/{turbineId}/stats` - Aggregated statistics
  - `GET /api/telemetry/health` - Health check

**Sample Telemetry Data:**
```json
{
  "turbineId": "TRB-001",
  "timestamp": "2026-03-02T12:00:00",
  "powerOutput": 4.7,
  "windSpeed": 13.1,
  "temperature": 46.0,
  "vibration": 3.5,
  "rpm": 18.8,
  "efficiency": 94.0
}
```

#### 2. **Alert Service** (Port 8082)
- **Purpose:** Anomaly detection and alert management
- **Database:** H2 in-memory (`jdbc:h2:mem:alerts`)
- **Feign Clients:** 
  - `TurbineServiceClient` → `http://turbine-service:8080`
  - `TelemetryServiceClient` → `http://telemetry-service:8083`
- **Endpoints:**
  - `GET /api/alerts` - List all alerts (with filters)
  - `GET /api/alerts/{id}` - Get specific alert
  - `GET /api/alerts/turbine/{turbineId}` - Get alerts for turbine
  - `POST /api/alerts` - Create manual alert
  - `PATCH /api/alerts/{id}/acknowledge` - Acknowledge alert
  - `PATCH /api/alerts/{id}/resolve` - Resolve alert
  - `DELETE /api/alerts/{id}` - Delete alert
  - `POST /api/alerts/scan` - Trigger anomaly detection
  - `GET /api/alerts/health` - Health check

**Alert Rules:**
- **CRITICAL:** Power < 10% capacity (with wind > 5m/s) OR Vibration > 15mm/s
- **WARNING:** Temperature > 80°C OR Wind speed > 25m/s
- **INFO:** Efficiency < 70%

### Frontend Integration

#### New Features Added:

1. **Telemetry Service Integration**
   - Created `TelemetryService` (`frontend/src/app/services/telemetry.service.ts`)
   - Methods: `getLatestTelemetry()`, `getTelemetryHistory()`, `getRecentTelemetry()`, `getStats()`, `ingestTelemetry()`

2. **Alert Service Integration**
   - Created `AlertService` (`frontend/src/app/services/alert.service.ts`)
   - Methods: `getAlerts()`, `acknowledgeAlert()`, `resolveAlert()`, `scanForAnomalies()`

3. **Dashboard Enhancements**
   - Real alerts displayed from API (replaced mock data)
   - "Refresh Alerts" button
   - "Scan Anomalies" button (triggers backend anomaly detection)
   - Acknowledge/Resolve buttons for ADMIN users
   - Alert severity filtering (CRITICAL, WARNING, INFO)

4. **Add Telemetry Data Form** ✨ NEW
   - **Location:** Live Feed tab → "➕ Add Telemetry" button
   - **Form Fields:**
     - Turbine selection dropdown
     - Power Output (MW)
     - Wind Speed (m/s)
     - Temperature (°C)
     - Vibration (mm/s)
     - RPM
     - Efficiency (%)
   - **Functionality:**
     - Validates input
     - Sends data to `POST /api/telemetry`
     - Shows success/error toast notification
     - Refreshes dashboard after submission

### Architecture

```
Frontend (Angular)
    ↓ HTTP Requests
Nginx (Port 4200)
    ├─→ /api/telemetry/* → Telemetry Service (8083)
    ├─→ /api/alerts/* → Alert Service (8082)
    └─→ /api/* (fallback) → Turbine Service (8080)

Alert Service (8082)
    ├─→ Feign Client → Turbine Service (8080) [Get turbine details]
    └─→ Feign Client → Telemetry Service (8083) [Get latest telemetry]
```

### Testing

#### Test Telemetry Ingestion:
```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:4200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Add telemetry data
curl -X POST http://localhost:4200/api/telemetry \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "turbineId": "TRB-001",
    "timestamp": "2026-03-02T18:00:00",
    "powerOutput": 4.5,
    "windSpeed": 12.5,
    "temperature": 45.0,
    "vibration": 3.2,
    "rpm": 18.5,
    "efficiency": 90.0
  }'

# Get latest telemetry
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4200/api/telemetry/TRB-001/latest | jq '.'
```

#### Test Alert Anomaly Scanning:
```bash
# Trigger anomaly scan
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:4200/api/alerts/scan | jq '.'

# Get CRITICAL alerts
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4200/api/alerts?severity=CRITICAL" | jq '.'

# Acknowledge alert
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  http://localhost:4200/api/alerts/1/acknowledge | jq '.'
```

### Database Schemas

#### Telemetry Data Table:
```sql
CREATE TABLE telemetry_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    turbine_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    power_output DOUBLE,
    wind_speed DOUBLE,
    temperature DOUBLE,
    vibration DOUBLE,
    rpm DOUBLE,
    efficiency DOUBLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_turbine_timestamp (turbine_id, timestamp)
);
```

#### Alerts Table:
```sql
CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    turbine_id VARCHAR(50) NOT NULL,
    turbine_name VARCHAR(100),
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    INDEX idx_turbine_severity (turbine_id, severity)
);
```

### Sample Data

Both services include Flyway migrations with sample data:
- **Telemetry:** 13 records for turbines TRB-001 through TRB-010
- **Alerts:** 6 sample alerts (including CRITICAL alerts for TRB-004 and TRB-008)

### UI Workflow

1. **Login** as admin or user
2. Navigate to **Live Feed** tab
3. Click **"➕ Add Telemetry"** button
4. Fill in the form:
   - Select turbine from dropdown
   - Enter sensor values (power, wind speed, temp, vibration, rpm, efficiency)
5. Click **Submit**
6. System ingests data and shows success toast
7. Navigate to **Alerts** tab
8. Click **"🔍 Scan Anomalies"** to trigger backend analysis
9. New alerts appear if thresholds are exceeded
10. ADMIN users can **Acknowledge** or **Resolve** alerts

### Key Technologies

- **Spring Cloud OpenFeign:** Inter-service communication
- **Spring Boot 4.0.2:** Microservices framework
- **H2 Database:** In-memory storage
- **Flyway:** Database migrations
- **Angular 17:** Reactive frontend
- **RxJS:** Observables for async operations
- **Chart.js:** Data visualizations (dashboard)

### Files Created/Modified

**Backend:**
- `telemetry-service/src/main/java/com/greenko/telemetryservice/`
  - `controller/TelemetryController.java`
  - `model/TelemetryData.java`
  - `repository/TelemetryRepository.java`
  - `service/TelemetryService.java`
- `telemetry-service/src/main/resources/db/migration/V1__create_telemetry_table.sql`
- `alert-service/src/main/java/com/greenko/alertservice/`
  - `client/TurbineServiceClient.java`
  - `client/TelemetryServiceClient.java`
  - `dto/TurbineDto.java`, `TelemetryDataDto.java`
  - `controller/AlertController.java`
  - `model/Alert.java`, `AlertSeverity.java`, `AlertStatus.java`
  - `repository/AlertRepository.java`
  - `service/AlertService.java`, `AlertRules.java`
- `alert-service/src/main/resources/db/migration/V1__create_alerts_table.sql`

**Frontend:**
- `frontend/src/app/services/telemetry.service.ts` (NEW)
- `frontend/src/app/services/alert.service.ts` (NEW)
- `frontend/src/app/components/dashboard.component.ts` (MODIFIED)
  - Added TelemetryService and AlertService injection
  - Added real alert fetching (replaced mock data)
  - Added acknowledge/resolve alert methods
  - Added telemetry data ingestion form and modal
  - Added "Add Telemetry" button in Live Feed tab
- `frontend/nginx.conf` (MODIFIED)
  - Added routes for `/api/telemetry/` → `telemetry-service:8083`
  - Added routes for `/api/alerts/` → `alert-service:8082`

**Docker:**
- `docker-compose.yml` (MODIFIED)
  - Fixed port mappings (telemetry:8083, alert:8082)
  - Added healthchecks
- `telemetry-service/src/main/resources/application-dev.yaml` (FIXED)
  - Changed port from 8080 to 8083

### Status

✅ **Telemetry Service** - Fully implemented and tested  
✅ **Alert Service** - Fully implemented and tested  
✅ **Feign Client Integration** - Working (alert-service calls turbine/telemetry services)  
✅ **Frontend Integration** - Real-time alerts, telemetry ingestion form  
✅ **Database Schemas** - Flyway migrations with sample data  
✅ **API Testing** - All endpoints verified  
✅ **Docker Deployment** - All services running healthy  

**Deployment:**
```bash
cd wind-turbine-monitoring
docker compose up -d
```

**Access:**
- Frontend: http://localhost:4200
- Telemetry API: http://localhost:8083/api/telemetry
- Alert API: http://localhost:8082/api/alerts
- Swagger UI (Telemetry): http://localhost:8083/swagger-ui.html
- Swagger UI (Alert): http://localhost:8082/swagger-ui.html

---

**Built:** March 2, 2026  
**Status:** ✅ Production Ready
