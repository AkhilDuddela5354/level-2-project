package com.greenko.alertservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryDataDto {
    private Long id;
    private String turbineId;
    private LocalDateTime timestamp;
    private Double powerOutput;
    private Double windSpeed;
    private Double temperature;
    private Double vibration;
    private Double rpm;
    private Double efficiency;
    private LocalDateTime createdAt;
}
