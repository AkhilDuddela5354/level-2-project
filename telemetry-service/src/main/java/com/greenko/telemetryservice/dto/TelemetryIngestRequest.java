package com.greenko.telemetryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryIngestRequest {
    private String turbineId;
    private LocalDateTime timestamp;
    private Double powerOutput;
    private Double windSpeed;
    private Double temperature;
    private Double vibration;
    private Double rpm;
    private Double efficiency;
}
