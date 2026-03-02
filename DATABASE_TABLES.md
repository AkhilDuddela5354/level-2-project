# Wind Turbine Monitoring System - Database Tables

## Database Overview

**Database Type:** H2 (In-Memory)  
**JDBC URL:** `jdbc:h2:mem:turbines`  
**Username:** `sa`  
**Password:** *(blank)*  
**Console:** http://localhost:8081/h2-console

---

## Tables Structure

### 1. `turbines` Table

**Purpose:** Stores all wind turbine asset master data including location, capacity, and operational status.

**Schema:**
```sql
CREATE TABLE turbines (
    turbine_id VARCHAR(50) PRIMARY KEY,
    turbine_name VARCHAR(100) NOT NULL,
    farm_id VARCHAR(50),
    farm_name VARCHAR(100),
    region VARCHAR(50),
    capacity DOUBLE,
    status VARCHAR(20),
    latitude DOUBLE,
    longitude DOUBLE,
    installation_date TIMESTAMP,
    last_maintenance_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Columns:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `turbine_id` | VARCHAR(50) | NO | Primary key, unique identifier (e.g., "TRB-001") |
| `turbine_name` | VARCHAR(100) | NO | Display name of the turbine |
| `farm_id` | VARCHAR(50) | YES | Foreign key reference to farm |
| `farm_name` | VARCHAR(100) | YES | Name of the farm where turbine is located |
| `region` | VARCHAR(50) | YES | Geographic region (North, South, East, West, Central) |
| `capacity` | DOUBLE | YES | Power generation capacity in kW |
| `status` | VARCHAR(20) | YES | Operational status (ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED) |
| `latitude` | DOUBLE | YES | Geographic latitude coordinate |
| `longitude` | DOUBLE | YES | Geographic longitude coordinate |
| `installation_date` | TIMESTAMP | YES | Date when turbine was installed |
| `last_maintenance_date` | TIMESTAMP | YES | Date of last maintenance activity |
| `created_at` | TIMESTAMP | NO | Record creation timestamp (auto-set) |
| `updated_at` | TIMESTAMP | NO | Record last update timestamp (auto-set) |

**Indexes:**
- Primary key on `turbine_id`

**Usage:**
- **Create:** Add new wind turbines (ADMIN only)
- **Read:** View turbine details, filter by region/farm/status
- **Update:** Modify turbine information (ADMIN only)
- **Delete:** Remove turbines (ADMIN only)

**Sample Data:**
```sql
INSERT INTO turbines VALUES (
    'TRB-001',
    'North Wind 001',
    'FARM-01',
    'Green Valley Farm',
    'North',
    5000.0,
    'ACTIVE',
    45.5231,
    -122.6765,
    '2020-01-15 00:00:00',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
```

**API Endpoints:**
- `GET /api/turbines` - List all turbines
- `GET /api/turbines/{id}` - Get single turbine
- `POST /api/turbines` - Create turbine (ADMIN)
- `PUT /api/turbines/{id}` - Update turbine (ADMIN)
- `DELETE /api/turbines/{id}` - Delete turbine (ADMIN)
- `GET /api/turbines/farm/{farmId}` - List by farm
- `GET /api/turbines/region/{region}` - List by region
- `GET /api/turbines/status/{status}` - List by status

**Frontend Usage:**
- Dashboard KPIs (total, active, maintenance, offline counts)
- Turbines tab (grid view with search/filter/sort)
- Farms tab (aggregated metrics by farm)
- Analytics tab (charts showing capacity, status distribution)
- Live Feed (status change events)

---

### 2. `users` Table

**Purpose:** Stores user authentication credentials and role information for access control.

**Schema:**
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Columns:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | BIGINT | NO | Primary key, auto-increment |
| `username` | VARCHAR(50) | NO | Unique username for login |
| `password` | VARCHAR(255) | NO | BCrypt hashed password |
| `email` | VARCHAR(100) | NO | Unique email address |
| `full_name` | VARCHAR(100) | NO | User's full display name |
| `role` | VARCHAR(20) | NO | User role (ADMIN, USER) |
| `created_at` | TIMESTAMP | NO | Account creation timestamp |
| `last_login` | TIMESTAMP | YES | Last successful login timestamp |
| `updated_at` | TIMESTAMP | NO | Record last update timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `username`
- Unique index on `email`

**Constraints:**
- `username` must be unique
- `email` must be unique
- `password` stored as BCrypt hash (60 characters)

**Usage:**
- **Signup:** Create new user accounts
- **Login:** Authenticate users and generate JWT tokens
- **Authorization:** Check user role for RBAC
- **Profile:** Retrieve current user information

**Sample Data (Default Accounts):**
```sql
-- Admin account (password: admin123)
INSERT INTO users (username, password, email, full_name, role) VALUES (
    'admin',
    '$2a$10$QqF0KK.CRIP4cOngtbTrBu3QQiWRo7EyYo0d68ZT.aYe6.2BmBwCq',
    'admin@greenko.com',
    'System Admin',
    'ADMIN'
);

-- User account (password: user123)
INSERT INTO users (username, password, email, full_name, role) VALUES (
    'user',
    '$2a$10$ljNZXXefK.K0.7MR5FYXlu6b.QzTo0e6w6WJO8gRE7pYOE1ylY1Ma',
    'user@greenko.com',
    'Regular User',
    'USER'
);
```

**API Endpoints:**
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Authenticate and get JWT
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/health` - Auth service health check

**Frontend Usage:**
- Login page (authentication)
- Signup page (account creation with role selection)
- Dashboard header (display username and role)
- RBAC (show/hide CRUD buttons based on role)

**Roles & Permissions:**

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full CRUD access to turbines, view all data |
| `USER` | Read-only access, cannot create/edit/delete |

---

### 3. `flyway_schema_history` Table (System Table)

**Purpose:** Tracks database migration history (managed by Flyway).

**Schema:**
```sql
CREATE TABLE flyway_schema_history (
    installed_rank INT NOT NULL PRIMARY KEY,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INT NOT NULL,
    success BOOLEAN NOT NULL
);
```

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `installed_rank` | INT | Sequential rank of migration |
| `version` | VARCHAR(50) | Migration version number (e.g., "1", "2") |
| `description` | VARCHAR(200) | Migration description |
| `type` | VARCHAR(20) | Migration type (SQL, JDBC) |
| `script` | VARCHAR(1000) | Script filename |
| `checksum` | INT | Script checksum for validation |
| `installed_by` | VARCHAR(100) | User who ran migration |
| `installed_on` | TIMESTAMP | When migration was executed |
| `execution_time` | INT | Time taken in milliseconds |
| `success` | BOOLEAN | Whether migration succeeded |

**Usage:**
- Automatically managed by Flyway
- Ensures migrations run only once
- Tracks migration history

**Sample Data:**
```sql
SELECT * FROM flyway_schema_history;

installed_rank | version | description              | script
---------------|---------|--------------------------|---------------------------
1              | 1       | create turbines          | V1__create_turbines.sql
2              | 2       | Create users table       | V2__Create_users_table.sql
```

---

## Table Relationships

```
┌─────────────────────────┐
│      turbines           │
│─────────────────────────│
│ turbine_id (PK)         │
│ farm_id                 │  (Logical grouping, no FK)
│ region                  │  (Logical grouping)
│ ...                     │
└─────────────────────────┘

┌─────────────────────────┐
│       users             │
│─────────────────────────│
│ id (PK)                 │
│ username (UNIQUE)       │
│ email (UNIQUE)          │
│ role                    │  (Used for authorization)
│ ...                     │
└─────────────────────────┘

No direct foreign key relationships between tables.
```

**Note:** 
- `turbines.farm_id` is a logical grouping field, not a foreign key
- No `farms` table exists (farms are derived from turbine data)
- Users and turbines are independent entities

---

## Data Statistics (Current State)

**Turbines Table:**
- Initial records: 10 turbines
- Farms: 5 unique farms
- Regions: 5 regions (North, South, East, West, Central)
- Status distribution:
  - ACTIVE: 8 turbines
  - MAINTENANCE: 1 turbine
  - OFFLINE: 1 turbine

**Users Table:**
- Default accounts: 2 (admin, user)
- Can grow dynamically via signup

---

## Database Access Methods

### 1. H2 Console (Web UI)
```
URL: http://localhost:8081/h2-console
JDBC URL: jdbc:h2:mem:turbines
Username: sa
Password: (blank)
```

### 2. API Endpoints
```
Turbines API: http://localhost:4200/api/turbines
Auth API: http://localhost:4200/api/auth
```

### 3. Docker Exec
```bash
docker exec -it turbine-service sh
```

---

## Query Examples

### Get All Active Turbines
```sql
SELECT * FROM turbines WHERE status = 'ACTIVE';
```

### Count Turbines by Region
```sql
SELECT region, COUNT(*) as count 
FROM turbines 
GROUP BY region;
```

### Get Total Capacity by Farm
```sql
SELECT farm_name, SUM(capacity) as total_capacity 
FROM turbines 
GROUP BY farm_name;
```

### Find Turbines Needing Maintenance (older than 6 months)
```sql
SELECT * FROM turbines 
WHERE last_maintenance_date < DATEADD('MONTH', -6, CURRENT_TIMESTAMP)
   OR last_maintenance_date IS NULL;
```

### List All Users and Roles
```sql
SELECT username, email, full_name, role, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Get User by Username
```sql
SELECT * FROM users WHERE username = 'admin';
```

---

## Database Limitations & Notes

### Current Limitations:
1. **In-Memory Database:** Data is lost on service restart
2. **No Persistence:** All data recreated from migrations on startup
3. **No Relationships:** No foreign key constraints between tables
4. **No Audit Trail:** No detailed change history tracking
5. **No Soft Deletes:** Records are permanently deleted

### Migration to Production:

For production use, consider:
1. **PostgreSQL Migration:**
   - Replace H2 with PostgreSQL
   - Add volume mounting for data persistence
   - Update JDBC driver and connection strings

2. **Add Missing Tables:**
   - `farms` table for farm master data
   - `telemetry` table for sensor data (10-second intervals)
   - `alerts` table for anomaly records
   - `maintenance_logs` table for service history
   - `audit_logs` table for change tracking

3. **Add Relationships:**
   - Foreign key: `turbines.farm_id → farms.farm_id`
   - Foreign key: `telemetry.turbine_id → turbines.turbine_id`
   - Foreign key: `alerts.turbine_id → turbines.turbine_id`

4. **Add Indexes:**
   - Index on `turbines.farm_id`
   - Index on `turbines.region`
   - Index on `turbines.status`
   - Index on `telemetry.timestamp`
   - Index on `alerts.created_at`

---

## Backup & Restore

### Export Data (H2 Console)
```sql
-- Export turbines
SCRIPT TO 'turbines_backup.sql' TABLE turbines;

-- Export users
SCRIPT TO 'users_backup.sql' TABLE users;
```

### Import Data
```sql
-- Via H2 Console
RUNSCRIPT FROM 'turbines_backup.sql';
RUNSCRIPT FROM 'users_backup.sql';
```

---

## Summary Table

| Table Name | Records | Primary Key | Usage | API Access |
|------------|---------|-------------|-------|------------|
| `turbines` | ~10 | turbine_id | Asset management | `/api/turbines` |
| `users` | ~2+ | id | Authentication & authorization | `/api/auth` |
| `flyway_schema_history` | 2 | installed_rank | Migration tracking | Internal |

---

**Database Status:** ✅ Operational (In-Memory)  
**Last Migration:** V2__Create_users_table.sql  
**Total Tables:** 3 (2 application + 1 system)
