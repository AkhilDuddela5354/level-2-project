package com.greenko.alertservice.service;

import com.greenko.alertservice.client.TelemetryServiceClient;
import com.greenko.alertservice.client.TurbineServiceClient;
import com.greenko.alertservice.dto.AlertRequestDto;
import com.greenko.alertservice.dto.AlertResponseDto;
import com.greenko.alertservice.dto.TelemetryDataDto;
import com.greenko.alertservice.dto.TurbineDto;
import com.greenko.alertservice.model.Alert;
import com.greenko.alertservice.model.AlertSeverity;
import com.greenko.alertservice.model.AlertStatus;
import com.greenko.alertservice.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;
    private final TurbineServiceClient turbineServiceClient;
    private final TelemetryServiceClient telemetryServiceClient;
    private final AlertRules alertRules;

    public List<AlertResponseDto> getAllAlerts(String severity, String status, String turbineId) {
        AlertSeverity severityEnum = parseSeverity(severity);
        AlertStatus statusEnum = parseStatus(status);
        if (severityEnum != null || statusEnum != null || turbineId != null) {
            return alertRepository.findByFilters(severityEnum, statusEnum, turbineId).stream()
                    .map(AlertResponseDto::fromEntity)
                    .collect(Collectors.toList());
        }
        return alertRepository.findAll().stream()
                .map(AlertResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public AlertResponseDto getAlertById(Long id) {
        return alertRepository.findById(id)
                .map(AlertResponseDto::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + id));
    }

    @Transactional
    public AlertResponseDto createAlert(AlertRequestDto request) {
        if (request.getTurbineId() == null || request.getTurbineId().isBlank()) {
            throw new IllegalArgumentException("turbineId is required");
        }
        if (request.getSeverity() == null || request.getSeverity().isBlank()) {
            throw new IllegalArgumentException("severity is required");
        }
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("message is required");
        }
        AlertSeverity severity = parseSeverity(request.getSeverity().toUpperCase());
        if (severity == null) {
            throw new IllegalArgumentException("severity must be CRITICAL, WARNING, or INFO");
        }

        Alert alert = Alert.builder()
                .turbineId(request.getTurbineId())
                .turbineName(request.getTurbineName())
                .severity(severity)
                .message(request.getMessage())
                .status(AlertStatus.ACTIVE)
                .build();
        Alert saved = alertRepository.save(alert);
        log.info("Created alert id={} for turbine {} severity={}", saved.getId(), saved.getTurbineId(), saved.getSeverity());
        return AlertResponseDto.fromEntity(saved);
    }

    @Transactional
    public AlertResponseDto createAlert(Alert alert) {
        Alert saved = alertRepository.save(alert);
        log.info("Created alert id={} for turbine {} severity={}", saved.getId(), saved.getTurbineId(), saved.getSeverity());
        return AlertResponseDto.fromEntity(saved);
    }

    @Transactional
    public AlertResponseDto acknowledgeAlert(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + id));
        alert.setStatus(AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(LocalDateTime.now());
        Alert saved = alertRepository.save(alert);
        log.info("Acknowledged alert id={}", id);
        return AlertResponseDto.fromEntity(saved);
    }

    @Transactional
    public AlertResponseDto resolveAlert(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + id));
        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        Alert saved = alertRepository.save(alert);
        log.info("Resolved alert id={}", id);
        return AlertResponseDto.fromEntity(saved);
    }

    @Transactional
    public void deleteAlert(Long id) {
        if (!alertRepository.existsById(id)) {
            throw new ResourceNotFoundException("Alert not found: " + id);
        }
        alertRepository.deleteById(id);
        log.info("Deleted alert id={}", id);
    }

    public List<AlertResponseDto> getAlertsForTurbine(String turbineId) {
        return alertRepository.findByTurbineIdOrderByCreatedAtDesc(turbineId).stream()
                .map(AlertResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Scan telemetry data for anomalies and generate alerts.
     */
    @Transactional
    public List<AlertResponseDto> scanForAnomalies() {
        List<AlertResponseDto> alerts = new ArrayList<>();
        try {
            List<TelemetryDataDto> recentTelemetry = telemetryServiceClient.getRecentTelemetry();
            List<TurbineDto> turbines = turbineServiceClient.getAllTurbines();

            for (TelemetryDataDto telemetry : recentTelemetry) {
                String turbineId = telemetry.getTurbineId();
                TurbineDto turbine = findTurbine(turbines, turbineId);

                if (alertRules.isCriticalVibration(telemetry)) {
                    alerts.add(createAlertFromRule(turbineId, turbine, AlertSeverity.CRITICAL,
                            "Excessive vibration detected (" + telemetry.getVibration() + " mm/s)"));
                } else if (alertRules.isCriticalLowPower(telemetry, turbine)) {
                    alerts.add(createAlertFromRule(turbineId, turbine, AlertSeverity.CRITICAL,
                            "Power output below 10% capacity - possible turbine failure"));
                } else if (alertRules.isWarningTemperature(telemetry)) {
                    alerts.add(createAlertFromRule(turbineId, turbine, AlertSeverity.WARNING,
                            "High temperature detected (" + telemetry.getTemperature() + " °C)"));
                } else if (alertRules.isWarningWindSpeed(telemetry)) {
                    alerts.add(createAlertFromRule(turbineId, turbine, AlertSeverity.WARNING,
                            "High wind speed detected (" + telemetry.getWindSpeed() + " m/s)"));
                } else if (alertRules.isInfoLowEfficiency(telemetry)) {
                    alerts.add(createAlertFromRule(turbineId, turbine, AlertSeverity.INFO,
                            "Low efficiency (" + telemetry.getEfficiency() + "%)"));
                }
            }
            log.info("Anomaly scan completed: {} new alerts generated", alerts.size());
        } catch (Exception e) {
            log.error("Error during anomaly scan: {}", e.getMessage());
        }
        return alerts;
    }

    private TurbineDto findTurbine(List<TurbineDto> turbines, String turbineId) {
        return turbines.stream()
                .filter(t -> turbineId.equals(t.getTurbineId()))
                .findFirst()
                .orElse(null);
    }

    private AlertResponseDto createAlertFromRule(String turbineId, TurbineDto turbine, AlertSeverity severity, String message) {
        String turbineName = turbine != null ? turbine.getTurbineName() : null;
        Alert alert = Alert.builder()
                .turbineId(turbineId)
                .turbineName(turbineName)
                .severity(severity)
                .message(message)
                .status(AlertStatus.ACTIVE)
                .build();
        return createAlert(alert);
    }

    private static AlertSeverity parseSeverity(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return AlertSeverity.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static AlertStatus parseStatus(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return AlertStatus.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }
    }
}
