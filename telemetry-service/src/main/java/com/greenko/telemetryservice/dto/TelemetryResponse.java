package com.greenko.telemetryservice.dto;

import com.greenko.telemetryservice.model.TelemetryData;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryResponse {
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

    public static TelemetryResponse fromEntity(TelemetryData entity) {
        return TelemetryResponse.builder()
                .id(entity.getId())
                .turbineId(entity.getTurbineId())
                .timestamp(entity.getTimestamp())
                .powerOutput(entity.getPowerOutput())
                .windSpeed(entity.getWindSpeed())
                .temperature(entity.getTemperature())
                .vibration(entity.getVibration())
                .rpm(entity.getRpm())
                .efficiency(entity.getEfficiency())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
