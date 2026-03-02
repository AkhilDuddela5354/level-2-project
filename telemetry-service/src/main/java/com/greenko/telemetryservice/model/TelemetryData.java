package com.greenko.telemetryservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry_data")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "turbine_id", nullable = false, length = 50)
    private String turbineId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "power_output")
    private Double powerOutput;

    @Column(name = "wind_speed")
    private Double windSpeed;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "vibration")
    private Double vibration;

    @Column(name = "rpm")
    private Double rpm;

    @Column(name = "efficiency")
    private Double efficiency;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
