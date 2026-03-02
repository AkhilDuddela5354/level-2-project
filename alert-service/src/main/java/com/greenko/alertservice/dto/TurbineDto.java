package com.greenko.alertservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurbineDto {
    private String turbineId;
    private String turbineName;
    private String farmId;
    private String farmName;
    private String region;
    private Double capacity;
    private String status;
    private Double latitude;
    private Double longitude;
    private LocalDateTime installationDate;
    private LocalDateTime lastMaintenanceDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
