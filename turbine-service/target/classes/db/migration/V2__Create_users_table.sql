-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, email, full_name, role) VALUES
('admin', '$2a$10$QqF0KK.CRIP4cOngtbTrBu3QQiWRo7EyYo0d68ZT.aYe6.2BmBwCq', 'admin@greenko.com', 'System Admin', 'ADMIN');

-- Insert default regular user (password: user123)
INSERT INTO users (username, password, email, full_name, role) VALUES
('user', '$2a$10$ljNZXXefK.K0.7MR5FYXlu6b.QzTo0e6w6WJO8gRE7pYOE1ylY1Ma', 'user@greenko.com', 'Regular User', 'USER');
