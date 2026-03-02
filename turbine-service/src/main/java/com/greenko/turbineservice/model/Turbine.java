package com.greenko.turbineservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "turbines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Turbine {

    @Id
    @Column(name = "turbine_id", length = 50)
    private String turbineId;

    @Column(name = "turbine_name", nullable = false, length = 100)
    private String turbineName;

    @Column(name = "farm_id", length = 50)
    private String farmId;

    @Column(name = "farm_name", length = 100)
    private String farmName;

    @Column(name = "region", length = 50)
    private String region;

    @Column(name = "capacity")
    private Double capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private TurbineStatus status;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "installation_date")
    private LocalDateTime installationDate;

    @Column(name = "last_maintenance_date")
    private LocalDateTime lastMaintenanceDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TurbineStatus {
        ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED
    }
}
