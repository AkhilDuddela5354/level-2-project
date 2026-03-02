package com.greenko.telemetryservice.controller;

import com.greenko.telemetryservice.dto.TelemetryIngestRequest;
import com.greenko.telemetryservice.dto.TelemetryStats;
import com.greenko.telemetryservice.model.TelemetryData;
import com.greenko.telemetryservice.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TelemetryController {

    private final TelemetryService telemetryService;

    @PostMapping
    public ResponseEntity<TelemetryData> ingestTelemetry(@RequestBody TelemetryIngestRequest request) {
        log.info("POST /api/telemetry - Ingesting telemetry for turbine {}", request.getTurbineId());
        if (request.getTurbineId() == null || request.getTurbineId().isBlank()) {
            throw new IllegalArgumentException("turbineId is required");
        }
        TelemetryData saved = telemetryService.ingest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{turbineId}/latest")
    public ResponseEntity<TelemetryData> getLatestReading(@PathVariable String turbineId) {
        log.info("GET /api/telemetry/{}/latest - Fetching latest reading", turbineId);
        TelemetryData data = telemetryService.getLatestReading(turbineId);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/{turbineId}")
    public ResponseEntity<List<TelemetryData>> getTelemetryHistory(
            @PathVariable String turbineId,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        log.info("GET /api/telemetry/{} - Fetching telemetry history", turbineId);
        List<TelemetryData> data = telemetryService.getTelemetryHistory(turbineId, startTime, endTime);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<TelemetryData>> getRecentTelemetry() {
        log.info("GET /api/telemetry/recent - Fetching recent telemetry");
        List<TelemetryData> data = telemetryService.getRecentTelemetry();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "telemetry-service"));
    }

    @GetMapping("/{turbineId}/stats")
    public ResponseEntity<TelemetryStats> getStats(
            @PathVariable String turbineId,
            @RequestParam(required = false, defaultValue = "daily") String period) {
        log.info("GET /api/telemetry/{}/stats - Fetching stats for period={}", turbineId, period);
        if (!"hourly".equalsIgnoreCase(period) && !"daily".equalsIgnoreCase(period)) {
            period = "daily";
        }
        TelemetryStats stats = telemetryService.getAggregatedStats(turbineId, period);
        return ResponseEntity.ok(stats);
    }
}
