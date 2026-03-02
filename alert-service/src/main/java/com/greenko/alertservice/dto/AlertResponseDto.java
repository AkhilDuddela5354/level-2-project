package com.greenko.alertservice.dto;

import com.greenko.alertservice.model.Alert;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponseDto {
    private Long id;
    private String turbineId;
    private String turbineName;
    private String severity;
    private String message;
    private String status;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public static AlertResponseDto fromEntity(Alert alert) {
        return AlertResponseDto.builder()
                .id(alert.getId())
                .turbineId(alert.getTurbineId())
                .turbineName(alert.getTurbineName())
                .severity(alert.getSeverity() != null ? alert.getSeverity().name() : null)
                .message(alert.getMessage())
                .status(alert.getStatus() != null ? alert.getStatus().name() : null)
                .acknowledgedAt(alert.getAcknowledgedAt())
                .createdAt(alert.getCreatedAt())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }
}
