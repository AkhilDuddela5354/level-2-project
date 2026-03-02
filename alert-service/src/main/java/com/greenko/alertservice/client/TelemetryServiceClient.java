package com.greenko.alertservice.client;

import com.greenko.alertservice.dto.TelemetryDataDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "telemetry-service", url = "http://telemetry-service:8083")
public interface TelemetryServiceClient {

    @GetMapping("/api/telemetry/{turbineId}/latest")
    TelemetryDataDto getLatestTelemetry(@PathVariable("turbineId") String turbineId);

    @GetMapping("/api/telemetry/recent")
    List<TelemetryDataDto> getRecentTelemetry();
}
