package com.greenko.alertservice.repository;

import com.greenko.alertservice.model.Alert;
import com.greenko.alertservice.model.AlertSeverity;
import com.greenko.alertservice.model.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByStatusOrderByCreatedAtDesc(AlertStatus status);

    List<Alert> findBySeverityOrderByCreatedAtDesc(AlertSeverity severity);

    List<Alert> findByTurbineIdOrderByCreatedAtDesc(String turbineId);

    List<Alert> findByTurbineIdAndSeverityOrderByCreatedAtDesc(String turbineId, AlertSeverity severity);

    List<Alert> findByTurbineIdAndStatusOrderByCreatedAtDesc(String turbineId, AlertStatus status);

    @Query("SELECT a FROM Alert a WHERE " +
           "(:severity IS NULL OR a.severity = :severity) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:turbineId IS NULL OR a.turbineId = :turbineId) " +
           "ORDER BY a.createdAt DESC")
    List<Alert> findByFilters(@Param("severity") AlertSeverity severity,
                             @Param("status") AlertStatus status,
                             @Param("turbineId") String turbineId);
}
