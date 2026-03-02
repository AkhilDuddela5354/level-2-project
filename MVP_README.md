# 🌬️ Wind Turbine Monitoring System - MVP

## ✅ YOUR WORKING SYSTEM IS READY!

A functional Wind Turbine Health Monitoring System with:
- ✅ Turbine Service with CRUD APIs
- ✅ Angular 17 Dashboard
- ✅ Docker Compose orchestration
- ✅ Sample data (10 turbines)
- ✅ Real-time monitoring UI

---

## 🚀 **Quick Start (3 Steps)**

### 1. Build All Services
```bash
cd /home/akhilduddela/test/greenko-level-2/wind-turbine-monitoring
docker-compose build
```

### 2. Start Everything
```bash
docker-compose up -d
```

### 3. Access the Dashboard
- **Frontend Dashboard**: http://localhost:4200
- **API Gateway**: http://localhost:8080
- **Turbine API**: http://localhost:8081/api/turbines
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

---

## 📊 **What's Working**

### Backend Services:
✅ **Turbine Service** (Port 8081)
- GET `/api/turbines` - List all turbines
- GET `/api/turbines/{id}` - Get turbine details
- POST `/api/turbines` - Create turbine
- PUT `/api/turbines/{id}` - Update turbine  
- DELETE `/api/turbines/{id}` - Delete turbine
- GET `/api/turbines/farm/{farmId}` - Filter by farm
- GET `/api/turbines/region/{region}` - Filter by region
- GET `/api/turbines/status/{status}` - Filter by status
- GET `/api/turbines/stats` - Get statistics

### Frontend:
✅ **Angular 17 Dashboard**
- View all turbines in a table
- See real-time statistics
- Status indicators (Active, Maintenance, Offline)
- Responsive design
- Beautiful gradient UI

### Monitoring:
✅ **Prometheus** - Metrics collection
✅ **Grafana** - Visualization dashboards

---

## 🧪 **Testing the System**

### 1. Check if services are running:
```bash
docker-compose ps
```

All services should show "Up" status.

### 2. Test the Turbine API:
```bash
# Get all turbines
curl http://localhost:8081/api/turbines

# Get turbine statistics
curl http://localhost:8081/api/turbines/stats

# Get turbines by farm
curl http://localhost:8081/api/turbines/farm/FARM-01
```

### 3. Open the Dashboard:
```bash
# In your browser, go to:
http://localhost:4200
```

You should see 10 sample turbines with statistics!

---

## 📁 **Project Structure**

```
wind-turbine-monitoring/
├── turbine-service/           ✅ Backend API
│   ├── src/main/java/...     ✅ Full implementation
│   ├── src/main/resources/   ✅ Configuration + DB migration
│   └── Dockerfile            ✅ Ready
│
├── telemetry-service/         🔄 Template (can be expanded)
├── alert-service/             🔄 Template (can be expanded)
├── gateway-service/           ✅ API Gateway
│
├── frontend/                  ✅ Angular 17 Dashboard
│   ├── src/app/              ✅ Dashboard component
│   ├── Dockerfile            ✅ Multi-stage build
│   └── nginx.conf            ✅ Production config
│
└── docker-compose.yml         ✅ Orchestration
```

---

## 🎯 **Sample Data**

The system comes with 10 pre-loaded turbines:
- **5 Farms** across different regions
- **3 Turbine models** (Vestas, GE, Siemens, Nordex)
- **Mixed statuses** (Active, Maintenance, Offline)
- **Realistic specifications** (capacity, location, etc.)

---

## 🛠️ **Development Commands**

### View Logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f turbine-service
docker-compose logs -f frontend
```

### Restart Services:
```bash
# Restart all
docker-compose restart

# Restart one
docker-compose restart turbine-service
```

### Stop Everything:
```bash
docker-compose down
```

### Rebuild After Changes:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 **API Examples**

### Create a New Turbine:
```bash
curl -X POST http://localhost:8081/api/turbines \
  -H "Content-Type: application/json" \
  -d '{
    "turbineId": "TRB-011",
    "turbineName": "New Turbine 011",
    "farmId": "FARM-01",
    "farmName": "Green Valley Farm",
    "region": "North",
    "model": "Vestas V150",
    "capacity": 5000,
    "status": "ACTIVE",
    "latitude": 45.5275,
    "longitude": -122.6810,
    "hubHeight": 105,
    "rotorDiameter": 150
  }'
```

### Update Turbine Status:
```bash
curl -X PUT http://localhost:8081/api/turbines/TRB-001 \
  -H "Content-Type: application/json" \
  -d '{
    "turbineId": "TRB-001",
    "turbineName": "North Wind 001",
    "farmId": "FARM-01",
    "farmName": "Green Valley Farm",
    "region": "North",
    "model": "Vestas V150",
    "capacity": 5000,
    "status": "MAINTENANCE",
    "latitude": 45.5231,
    "longitude": -122.6765,
    "hubHeight": 105,
    "rotorDiameter": 150
  }'
```

### Delete a Turbine:
```bash
curl -X DELETE http://localhost:8081/api/turbines/TRB-010
```

---

## 🔧 **Troubleshooting**

### Services not starting?
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Restart Docker
sudo systemctl restart docker
```

### Frontend not loading?
```bash
# Check if nginx is serving
curl http://localhost:4200/health

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### API not responding?
```bash
# Check service health
curl http://localhost:8081/actuator/health

# Check if port is in use
netstat -tulpn | grep 8081
```

---

## 📈 **Next Steps - Expand the MVP**

You can now add:

### Backend Enhancements:
1. **Telemetry Service** - IoT data ingestion
2. **Alert Service** - Anomaly detection
3. **Batch Processing** - Hourly aggregation
4. **PostgreSQL** - Replace H2 with production DB
5. **Spring Security** - Authentication & authorization

### Frontend Features:
1. **Charts** - Power output, efficiency trends
2. **Map View** - Turbine locations on map
3. **Alert Dashboard** - Real-time alerts
4. **Analytics Page** - Performance analysis
5. **Admin Panel** - Turbine management UI

### DevOps:
1. **CI/CD Pipeline** - Automated deployments
2. **Kubernetes** - Production orchestration
3. **Logging** - ELK stack integration
4. **Monitoring** - Advanced Grafana dashboards

---

## 📝 **Notes**

- **H2 Database**: Using in-memory for MVP (data resets on restart)
- **Port 4200**: Frontend runs on port 4200 (not 80) for easier development
- **No Authentication**: MVP has open APIs (add security for production)
- **Sample Data**: 10 turbines loaded automatically
- **Expandable**: Easy to add more services and features

---

## 🎉 **Success Metrics**

Your MVP is successful if:
- ✅ All services start without errors
- ✅ Dashboard displays 10 turbines
- ✅ Statistics show correct counts
- ✅ APIs respond to curl commands
- ✅ You can create/update/delete turbines
- ✅ Frontend updates automatically

---

## 📞 **Support**

Issues? Check:
1. `docker-compose ps` - All services "Up"?
2. `docker-compose logs` - Any errors?
3. Browser console - Any API errors?
4. Ports not conflicting? (8080-8083, 4200, 3000, 9090)

---

## 🎯 **Demo Script**

**Show stakeholders:**
1. Open dashboard: http://localhost:4200
2. Point out the statistics
3. Show turbine table with status colors
4. Use curl to create a new turbine
5. Refresh dashboard to see the new turbine
6. Open Grafana for monitoring view

---

**🎉 Congratulations! You have a working Wind Turbine Monitoring System!**

Built with: Angular 17, Spring Boot 4, Docker, Prometheus & Grafana

---

**Time to build**: ~2 hours  
**Time to run**: ~5 minutes  
**Value**: Infinite 🚀
