package com.greenko.alertservice.config;

import com.greenko.alertservice.model.Alert;
import com.greenko.alertservice.model.AlertSeverity;
import com.greenko.alertservice.model.AlertStatus;
import com.greenko.alertservice.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class SampleDataLoader implements CommandLineRunner {

    private final AlertRepository repository;

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            log.info("Skipping sample alerts - database already has data");
            return;
        }
        log.info("Generating sample alerts for testing...");
        List<Alert> sampleAlerts = List.of(
                Alert.builder().turbineId("T001").turbineName("Turbine Alpha").severity(AlertSeverity.CRITICAL)
                        .message("Power output below 10% capacity - immediate inspection required").status(AlertStatus.ACTIVE).build(),
                Alert.builder().turbineId("T002").turbineName("Turbine Beta").severity(AlertSeverity.WARNING)
                        .message("Temperature exceeded 80°C - monitor closely").status(AlertStatus.ACTIVE).build(),
                Alert.builder().turbineId("T003").turbineName("Turbine Gamma").severity(AlertSeverity.INFO)
                        .message("Maintenance due in 7 days").status(AlertStatus.ACKNOWLEDGED).build(),
                Alert.builder().turbineId("T001").turbineName("Turbine Alpha").severity(AlertSeverity.WARNING)
                        .message("Wind speed exceeded 25 m/s - reduced output mode").status(AlertStatus.ACTIVE).build(),
                Alert.builder().turbineId("T002").turbineName("Turbine Beta").severity(AlertSeverity.CRITICAL)
                        .message("Vibration level > 15 mm/s - shutdown recommended").status(AlertStatus.ACTIVE).build()
        );
        repository.saveAll(sampleAlerts);
        log.info("Generated {} sample alerts", repository.count());
    }
}
