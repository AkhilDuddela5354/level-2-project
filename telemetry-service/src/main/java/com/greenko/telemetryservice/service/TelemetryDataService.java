package com.greenko.telemetryservice.service;

import com.greenko.telemetryservice.dto.TelemetryIngestRequest;
import com.greenko.telemetryservice.dto.TelemetryResponse;
import com.greenko.telemetryservice.dto.TelemetryStats;
import com.greenko.telemetryservice.dto.HourlyAggregation;
import com.greenko.telemetryservice.model.TelemetryData;
import com.greenko.telemetryservice.repository.TelemetryDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryDataService {

    private final TelemetryDataRepository repository;

    @Transactional
    public TelemetryResponse ingest(TelemetryIngestRequest request) {
        log.debug("Ingesting telemetry for turbine {}", request.getTurbineId());
        if (request.getTimestamp() == null) {
            request.setTimestamp(LocalDateTime.now());
        }
        TelemetryData entity = TelemetryData.builder()
                .turbineId(request.getTurbineId())
                .timestamp(request.getTimestamp())
                .powerOutput(request.getPowerOutput())
                .windSpeed(request.getWindSpeed())
                .temperature(request.getTemperature())
                .vibration(request.getVibration())
                .rpm(request.getRpm())
                .efficiency(request.getEfficiency())
                .build();
        TelemetryData saved = repository.save(entity);
        log.info("Ingested telemetry id={} for turbine {}", saved.getId(), saved.getTurbineId());
        return TelemetryResponse.fromEntity(saved);
    }

    public List<TelemetryResponse> getTelemetryForTurbine(String turbineId, Integer limit) {
        int size = limit != null && limit > 0 ? Math.min(limit, 1000) : 100;
        return repository.findByTurbineIdOrderByTimestampDesc(turbineId, PageRequest.of(0, size))
                .stream()
                .map(TelemetryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public TelemetryResponse getLatestReading(String turbineId) {
        return repository.findFirstByTurbineIdOrderByTimestampDesc(turbineId)
                .map(TelemetryResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("No telemetry found for turbine: " + turbineId));
    }

    public TelemetryStats getAggregatedStats(String turbineId, String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        LocalDateTime end = now;

        if ("hourly".equalsIgnoreCase(period)) {
            start = now.minusHours(1).truncatedTo(ChronoUnit.HOURS);
        } else {
            // daily
            start = now.minusDays(1).truncatedTo(ChronoUnit.DAYS);
        }

        List<TelemetryData> data = repository.findByTurbineIdAndTimestampBetween(turbineId, start, end);
        if (data.isEmpty()) {
            return TelemetryStats.builder()
                    .turbineId(turbineId)
                    .period(period != null ? period.toUpperCase() : "DAILY")
                    .from(start)
                    .to(end)
                    .totalRecords(0L)
                    .build();
        }

        double avgPower = data.stream().mapToDouble(t -> t.getPowerOutput() != null ? t.getPowerOutput() : 0).average().orElse(0);
        double avgWind = data.stream().mapToDouble(t -> t.getWindSpeed() != null ? t.getWindSpeed() : 0).average().orElse(0);
        double avgTemp = data.stream().mapToDouble(t -> t.getTemperature() != null ? t.getTemperature() : 0).average().orElse(0);
        double avgVib = data.stream().mapToDouble(t -> t.getVibration() != null ? t.getVibration() : 0).average().orElse(0);
        double avgRpm = data.stream().mapToDouble(t -> t.getRpm() != null ? t.getRpm() : 0).average().orElse(0);
        double avgEff = data.stream().mapToDouble(t -> t.getEfficiency() != null ? t.getEfficiency() : 0).average().orElse(0);

        List<HourlyAggregation> aggregations = data.stream()
                .collect(Collectors.groupingBy(t -> t.getTimestamp().truncatedTo(ChronoUnit.HOURS)))
                .entrySet().stream()
                .map(e -> {
                    var list = e.getValue();
                    return HourlyAggregation.builder()
                            .turbineId(turbineId)
                            .hour(e.getKey())
                            .avgPowerOutput(list.stream().mapToDouble(t -> t.getPowerOutput() != null ? t.getPowerOutput() : 0).average().orElse(0))
                            .avgWindSpeed(list.stream().mapToDouble(t -> t.getWindSpeed() != null ? t.getWindSpeed() : 0).average().orElse(0))
                            .avgTemperature(list.stream().mapToDouble(t -> t.getTemperature() != null ? t.getTemperature() : 0).average().orElse(0))
                            .avgVibration(list.stream().mapToDouble(t -> t.getVibration() != null ? t.getVibration() : 0).average().orElse(0))
                            .avgRpm(list.stream().mapToDouble(t -> t.getRpm() != null ? t.getRpm() : 0).average().orElse(0))
                            .count((long) list.size())
                            .build();
                })
                .collect(Collectors.toList());

        return TelemetryStats.builder()
                .turbineId(turbineId)
                .period(period != null ? period.toUpperCase() : "DAILY")
                .from(start)
                .to(end)
                .totalRecords((long) data.size())
                .avgPowerOutput(avgPower)
                .avgWindSpeed(avgWind)
                .avgTemperature(avgTemp)
                .avgVibration(avgVib)
                .avgRpm(avgRpm)
                .avgEfficiency(avgEff)
                .aggregations(aggregations)
                .build();
    }

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }
}
