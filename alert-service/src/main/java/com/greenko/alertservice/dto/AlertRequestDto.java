package com.greenko.alertservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertRequestDto {
    private String turbineId;
    private String turbineName;
    private String severity;
    private String message;
}
