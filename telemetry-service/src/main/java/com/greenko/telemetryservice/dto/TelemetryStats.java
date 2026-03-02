package com.greenko.telemetryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryStats {
    private String turbineId;
    private String period; // HOURLY or DAILY
    private LocalDateTime from;
    private LocalDateTime to;
    private Long totalRecords;
    private Double avgPowerOutput;
    private Double avgWindSpeed;
    private Double avgTemperature;
    private Double avgVibration;
    private Double avgRpm;
    private Double avgEfficiency;
    private List<HourlyAggregation> aggregations;
}
