package com.greenko.telemetryservice.config;

import com.greenko.telemetryservice.model.TelemetryData;
import com.greenko.telemetryservice.repository.TelemetryDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class SampleDataLoader implements CommandLineRunner {

    private final TelemetryDataRepository repository;
    private static final List<String> TURBINE_IDS = List.of("T001", "T002", "T003");
    private static final Random RANDOM = new Random(42);

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            log.info("Skipping sample data - database already has data");
            return;
        }
        log.info("Generating sample telemetry data for testing...");
        LocalDateTime base = LocalDateTime.now().minusHours(2);
        for (String turbineId : TURBINE_IDS) {
            for (int i = 0; i < 120; i++) { // 10-second intervals = 2 hours
                LocalDateTime ts = base.plusSeconds(i * 10L);
                double windSpeed = 5 + RANDOM.nextDouble() * 15;
                double powerOutput = windSpeed * (8 + RANDOM.nextDouble() * 4);
                double temperature = 20 + RANDOM.nextDouble() * 40;
                double vibration = 2 + RANDOM.nextDouble() * 8;
                double rpm = 10 + RANDOM.nextDouble() * 15;
                double efficiency = 60 + RANDOM.nextDouble() * 35;

                TelemetryData data = TelemetryData.builder()
                        .turbineId(turbineId)
                        .timestamp(ts)
                        .powerOutput(powerOutput)
                        .windSpeed(windSpeed)
                        .temperature(temperature)
                        .vibration(vibration)
                        .rpm(rpm)
                        .efficiency(efficiency)
                        .build();
                repository.save(data);
            }
        }
        log.info("Generated {} sample telemetry records", repository.count());
    }
}
