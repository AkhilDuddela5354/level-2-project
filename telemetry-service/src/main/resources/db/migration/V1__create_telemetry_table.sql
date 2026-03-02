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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_turbine_timestamp ON telemetry_data(turbine_id, timestamp DESC);
CREATE INDEX idx_timestamp ON telemetry_data(timestamp DESC);

-- Sample data for 10+ turbines (TRB-001, TRB-004, TRB-008 and others)
INSERT INTO telemetry_data (turbine_id, timestamp, power_output, wind_speed, temperature, vibration, rpm, efficiency) VALUES
('TRB-001', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 4.5, 12.5, 45.2, 3.2, 18.5, 90.0),
('TRB-001', DATEADD('MINUTE', -4, CURRENT_TIMESTAMP), 4.7, 13.1, 46.0, 3.5, 18.8, 94.0),
('TRB-002', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 4.8, 13.0, 44.5, 2.9, 18.6, 96.0),
('TRB-003', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 5.1, 14.2, 47.0, 4.1, 19.2, 96.2),
('TRB-004', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 0.5, 5.2, 85.5, 16.2, 5.1, 10.0),
('TRB-005', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 2.8, 9.5, 52.0, 8.5, 15.2, 56.0),
('TRB-006', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 4.2, 11.8, 46.5, 3.8, 18.0, 93.3),
('TRB-007', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 4.4, 12.2, 47.2, 3.6, 18.3, 97.8),
('TRB-008', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 0.0, 2.1, 35.0, 0.5, 0.0, 0.0),
('TRB-009', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 4.6, 12.8, 45.8, 3.3, 18.7, 92.0),
('TRB-010', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP), 5.0, 13.5, 48.0, 3.9, 19.0, 94.3),
('TRB-004', DATEADD('MINUTE', -3, CURRENT_TIMESTAMP), 0.3, 4.8, 86.0, 17.0, 4.5, 6.0),
('TRB-008', DATEADD('MINUTE', -2, CURRENT_TIMESTAMP), 0.0, 1.8, 34.0, 0.3, 0.0, 0.0);
