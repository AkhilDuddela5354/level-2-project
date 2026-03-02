CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    turbine_id VARCHAR(50) NOT NULL,
    turbine_name VARCHAR(100),
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_turbine_severity ON alerts(turbine_id, severity);
CREATE INDEX idx_status ON alerts(status);
CREATE INDEX idx_created_at ON alerts(created_at DESC);

-- Sample alerts: 5+ records with CRITICAL for TRB-004 and TRB-008
INSERT INTO alerts (turbine_id, turbine_name, severity, message, status, created_at) VALUES
('TRB-004', 'East Wind 001', 'CRITICAL', 'Power output below 10% capacity - possible turbine failure', 'ACTIVE', DATEADD('MINUTE', -10, CURRENT_TIMESTAMP)),
('TRB-005', 'East Wind 002', 'WARNING', 'Turbine under maintenance - scheduled service', 'ACKNOWLEDGED', DATEADD('HOUR', -2, CURRENT_TIMESTAMP)),
('TRB-008', 'Central Wind 001', 'CRITICAL', 'Turbine offline - no power generation', 'ACTIVE', DATEADD('HOUR', -1, CURRENT_TIMESTAMP)),
('TRB-004', 'East Wind 001', 'CRITICAL', 'Excessive vibration detected (16.2 mm/s)', 'ACTIVE', DATEADD('MINUTE', -5, CURRENT_TIMESTAMP)),
('TRB-003', 'South Wind 001', 'INFO', 'Scheduled maintenance due in 7 days', 'ACTIVE', DATEADD('HOUR', -12, CURRENT_TIMESTAMP)),
('TRB-008', 'Central Wind 001', 'CRITICAL', 'Zero power output with sufficient wind speed', 'ACTIVE', DATEADD('MINUTE', -30, CURRENT_TIMESTAMP));
