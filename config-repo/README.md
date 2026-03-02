# Wind Turbine Monitoring System - Configuration Repository

This repository contains centralized configuration for all microservices in the Wind Turbine Monitoring System.

## 🏗️ Structure

```
config-repo/
├── global/
│   └── application.yml              # Common configuration for all services
└── services/
    ├── turbine-service/
    │   ├── turbine-service.yaml     # Base configuration
    │   ├── turbine-service-dev.yaml # Development profile
    │   └── turbine-service-prod.yaml# Production profile
    ├── telemetry-service/
    │   ├── telemetry-service.yaml
    │   └── telemetry-service-dev.yaml
    ├── alert-service/
    │   ├── alert-service.yaml
    │   └── alert-service-dev.yaml
    └── gateway-service/
        └── gateway-service.yaml
```

## 📋 Configuration Hierarchy

Spring Cloud Config Server loads configurations in this order:

1. **Global Configuration** (`global/application.yml`)
   - Applied to ALL services
   - Contains common settings (actuator, prometheus, zipkin, logging)

2. **Service-Specific Configuration** (`services/{service-name}/{service-name}.yaml`)
   - Base configuration for a specific service
   - Server port, application name, etc.

3. **Profile-Specific Configuration** (`services/{service-name}/{service-name}-{profile}.yaml`)
   - Environment-specific settings (dev, prod, test)
   - Database connections, feature flags

## 🔧 Global Configuration Features

### Actuator & Health Checks
- Health probes enabled
- Multiple endpoints exposed: health, info, refresh, prometheus, metrics, env, beans, loggers

### Prometheus Metrics
- Enabled for all services
- Application tags for filtering

### Zipkin Distributed Tracing
- Sampling probability: 100% (1.0)
- Trace ID and Span ID in logs

### Logging
- Pattern includes application name, trace IDs
- Root level: INFO
- com.greenko: DEBUG

## 🌬️ Service Configurations

### Turbine Service (Port 8081)
Master data management for wind turbines

**Dev Profile:**
- H2 in-memory database
- H2 console enabled at `/h2-console`
- Flyway migrations: `classpath:db/dev-migration`

**Prod Profile:**
- PostgreSQL database
- HikariCP connection pool
- Flyway migrations: `classpath:db/migration`

### Telemetry Service (Port 8082)
IoT telemetry data ingestion and processing

**Dev Profile:**
- H2 in-memory database
- Sample data for testing

### Alert Service (Port 8083)
Anomaly detection and alerting

**Dev Profile:**
- H2 in-memory database
- Rule-based detection

### Gateway Service (Port 8080)
API Gateway with routing and Swagger aggregation

**Routes:**
- `/turbines/**` → turbine-service:8081
- `/telemetry/**` → telemetry-service:8082
- `/alerts/**` → alert-service:8083

**Swagger Docs:**
- Aggregates API docs from all services
- Available at: http://localhost:8080/swagger-ui.html

## 🚀 Usage with Config Server

### 1. Start Config Server
The config server reads from this directory (or Git repository).

```yaml
# config-server/application.yaml
spring:
  cloud:
    config:
      server:
        git:
          uri: file://${user.home}/wind-turbine-monitoring/config-repo
          # OR use remote Git:
          # uri: https://github.com/YOUR_USERNAME/wind-turbine-config.git
```

### 2. Service Configuration
Services import from config server:

```yaml
# Service application.yaml
spring:
  application:
    name: turbine-service
  config:
    import: optional:configserver:http://config-server:8888
  profiles:
    active: dev
```

### 3. Refresh Configuration
Trigger refresh without restart:

```bash
curl -X POST http://localhost:8081/actuator/refresh
```

## 📦 Push to GitHub

```bash
# Initialize Git repository
git init

# Add all configuration files
git add .

# Commit
git commit -m "Initial Wind Turbine Monitoring System configuration"

# Create GitHub repository named 'wind-turbine-config'
# Then add remote and push:
git remote add origin https://github.com/YOUR_USERNAME/wind-turbine-config.git
git branch -M main
git push -u origin main
```

## 🔐 Secrets Management

**Current:** No secrets (development setup)

**Production:** Use encrypted properties with Spring Cloud Config:

```bash
# Encrypt sensitive values
curl http://localhost:8888/encrypt -d "my-secret-value"

# Use in YAML
spring:
  datasource:
    password: '{cipher}ENCRYPTED_VALUE'
```

## 🌍 Environment Profiles

| Profile | Purpose | Database |
|---------|---------|----------|
| `dev` | Local development | H2 in-memory |
| `test` | Integration testing | H2 file-based |
| `prod` | Production | PostgreSQL |

## 📝 Configuration Best Practices

1. ✅ **Never commit secrets** - Use encryption or external secret management
2. ✅ **Use profiles** - Separate dev, test, prod configurations
3. ✅ **Centralize common config** - Avoid duplication in global/application.yml
4. ✅ **Document changes** - Use meaningful commit messages
5. ✅ **Version control** - Track all configuration changes in Git
6. ✅ **Use optional:configserver:** - Services can start without config server

## 🔄 Update Process

1. Modify configuration files in this repository
2. Commit and push changes to Git
3. Trigger refresh on affected services:
   ```bash
   curl -X POST http://service:port/actuator/refresh
   ```
4. Or restart services to pick up changes

## 📊 Monitoring Configuration

All services configured with:
- **Spring Boot Actuator** - Health checks and metrics
- **Micrometer + Prometheus** - Metrics export
- **Zipkin** - Distributed tracing
- **Structured Logging** - JSON format with trace context

## 🏷️ Version

**Current Version:** 1.0.0
**Spring Cloud Version:** 2024.0.0
**Spring Boot Version:** 4.0.2

## 📚 Documentation

- [Spring Cloud Config Documentation](https://docs.spring.io/spring-cloud-config/docs/current/reference/html/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Prometheus Metrics](https://prometheus.io/docs/introduction/overview/)

---

**Maintained by:** Greenko Wind Turbine Monitoring Team  
**Last Updated:** 2026-03-02  
**Environment:** Development/Production Ready 🌬️💚
