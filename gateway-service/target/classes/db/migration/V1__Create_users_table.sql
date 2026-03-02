CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP,
    last_login TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (user_id, username, password, email, full_name, role, created_at) 
VALUES ('user-001', 'admin', '$2a$10$rZ5k8zQ7HQK9QX8J8OvOLeH2bLT4j.sVxGxU6H.xMZK9mZJCZHRCy', 'admin@greenko.com', 'Administrator', 'ADMIN', CURRENT_TIMESTAMP);

-- Insert default operator user (password: operator123)
INSERT INTO users (user_id, username, password, email, full_name, role, created_at) 
VALUES ('user-002', 'operator', '$2a$10$yHZKFQH4rTZ6QJqmGZJOeO8P7xLZQ9H.kXMRJCZQZH8QH.ZCZHRC', 'operator@greenko.com', 'Operator', 'USER', CURRENT_TIMESTAMP);
