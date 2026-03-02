#!/bin/bash

# Wind Turbine Monitoring System - Quick Setup Script
# This script creates all necessary files for the MVP

set -e

echo "🌬️  Setting up Wind Turbine Monitoring System MVP..."

cd /home/akhilduddela/test/greenko-level-2/wind-turbine-monitoring

# Create all Java files for Turbine Service
echo "Creating Turbine Service files..."

cat > turbine-service/src/main/resources/application.yaml << 'EOF'
spring:
  application:
    name: turbine-service
  datasource:
    url: jdbc:h2:mem:turbines
    username: sa
    password:
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: true
  h2:
    console:
      enabled: true
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

server:
  port: 8081

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus

logging:
  level:
    com.greenko: DEBUG
EOF

# Create Flyway migration
mkdir -p turbine-service/src/main/resources/db/migration

cat > turbine-service/src/main/resources/db/migration/V1__create_turbines.sql << 'EOF'
CREATE TABLE turbines (
    turbine_id VARCHAR(50) PRIMARY KEY,
    turbine_name VARCHAR(100) NOT NULL,
    farm_id VARCHAR(50) NOT NULL,
    farm_name VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    model VARCHAR(50),
    capacity DOUBLE NOT NULL,
    installation_date DATE,
    latitude DOUBLE,
    longitude DOUBLE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_maintenance_date DATE,
    hub_height DOUBLE,
    rotor_diameter DOUBLE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_farm_id ON turbines(farm_id);
CREATE INDEX idx_region ON turbines(region);
CREATE INDEX idx_status ON turbines(status);

INSERT INTO turbines VALUES
('TRB-001', 'North Wind 001', 'FARM-01', 'Green Valley Farm', 'North', 'Vestas V150', 5000, '2020-01-15', 45.5231, -122.6765, 'ACTIVE', NULL, 105, 150, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-002', 'North Wind 002', 'FARM-01', 'Green Valley Farm', 'North', 'Vestas V150', 5000, '2020-01-20', 45.5245, -122.6780, 'ACTIVE', NULL, 105, 150, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-003', 'South Wind 001', 'FARM-02', 'Coastal Breeze Farm', 'South', 'GE 5.3-158', 5300, '2019-06-12', 34.0522, -118.2437, 'ACTIVE', NULL, 110, 158, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-004', 'East Wind 001', 'FARM-03', 'Prairie Power Farm', 'East', 'Siemens SG 5.0-145', 5000, '2021-03-15', 41.8781, -87.6298, 'ACTIVE', NULL, 100, 145, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-005', 'East Wind 002', 'FARM-03', 'Prairie Power Farm', 'East', 'Siemens SG 5.0-145', 5000, '2021-03-25', 41.8796, -87.6313, 'MAINTENANCE', NULL, 100, 145, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-006', 'West Wind 001', 'FARM-04', 'Mountain Ridge Farm', 'West', 'Nordex N149', 4500, '2020-08-10', 39.7392, -104.9903, 'ACTIVE', NULL, 100, 149, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-007', 'West Wind 002', 'FARM-04', 'Mountain Ridge Farm', 'West', 'Nordex N149', 4500, '2020-08-15', 39.7407, -104.9918, 'ACTIVE', NULL, 100, 149, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-008', 'Central Wind 001', 'FARM-05', 'Heartland Farm', 'Central', 'Vestas V150', 5000, '2019-11-20', 41.2524, -95.9980, 'OFFLINE', NULL, 105, 150, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-009', 'North Wind 003', 'FARM-01', 'Green Valley Farm', 'North', 'Vestas V150', 5000, '2020-02-10', 45.5260, -122.6795, 'ACTIVE', NULL, 105, 150, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('TRB-010', 'South Wind 002', 'FARM-02', 'Coastal Breeze Farm', 'South', 'GE 5.3-158', 5300, '2019-06-20', 34.0537, -118.2452, 'ACTIVE', NULL, 110, 158, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
EOF

echo "✅ Setup complete!"
echo ""
echo "Now run:"
echo "  cd /home/akhilduddela/test/greenko-level-2/wind-turbine-monitoring"
echo "  docker compose build"
echo "  docker compose up -d"
