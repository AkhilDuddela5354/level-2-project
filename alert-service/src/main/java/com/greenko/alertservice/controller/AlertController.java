package com.greenko.alertservice.controller;

import com.greenko.alertservice.dto.AlertRequestDto;
import com.greenko.alertservice.dto.AlertResponseDto;
import com.greenko.alertservice.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<AlertResponseDto>> getAllAlerts(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String turbineId) {
        log.info("GET /api/alerts - severity={}, status={}, turbineId={}", severity, status, turbineId);
        List<AlertResponseDto> alerts = alertService.getAllAlerts(severity, status, turbineId);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertResponseDto> getAlertById(@PathVariable Long id) {
        log.info("GET /api/alerts/{}", id);
        AlertResponseDto alert = alertService.getAlertById(id);
        return ResponseEntity.ok(alert);
    }

    @GetMapping("/turbine/{turbineId}")
    public ResponseEntity<List<AlertResponseDto>> getAlertsByTurbine(@PathVariable String turbineId) {
        log.info("GET /api/alerts/turbine/{}", turbineId);
        List<AlertResponseDto> alerts = alertService.getAlertsForTurbine(turbineId);
        return ResponseEntity.ok(alerts);
    }

    @PostMapping
    public ResponseEntity<AlertResponseDto> createAlert(@RequestBody AlertRequestDto request) {
        log.info("POST /api/alerts - Creating alert for turbine {}", request.getTurbineId());
        AlertResponseDto response = alertService.createAlert(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/acknowledge")
    public ResponseEntity<AlertResponseDto> acknowledgeAlert(@PathVariable Long id) {
        log.info("PATCH /api/alerts/{}/acknowledge", id);
        AlertResponseDto response = alertService.acknowledgeAlert(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<AlertResponseDto> resolveAlert(@PathVariable Long id) {
        log.info("PATCH /api/alerts/{}/resolve", id);
        AlertResponseDto response = alertService.resolveAlert(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(@PathVariable Long id) {
        log.info("DELETE /api/alerts/{}", id);
        alertService.deleteAlert(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/scan")
    public ResponseEntity<List<AlertResponseDto>> scanForAnomalies() {
        log.info("POST /api/alerts/scan - Triggering anomaly detection");
        List<AlertResponseDto> alerts = alertService.scanForAnomalies();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "alert-service"));
    }
}
