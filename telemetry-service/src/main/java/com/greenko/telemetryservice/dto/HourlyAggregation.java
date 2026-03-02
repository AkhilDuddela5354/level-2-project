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
public class HourlyAggregation {
    private String turbineId;
    private LocalDateTime hour;
    private Double avgPowerOutput;
    private Double avgWindSpeed;
    private Double avgRpm;
    private Double avgTemperature;
    private Double avgVibration;
    private Long count;
}
