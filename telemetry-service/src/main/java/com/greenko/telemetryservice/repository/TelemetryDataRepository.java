package com.greenko.telemetryservice.repository;

import com.greenko.telemetryservice.model.TelemetryData;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TelemetryDataRepository extends JpaRepository<TelemetryData, Long> {

    List<TelemetryData> findByTurbineIdOrderByTimestampDesc(String turbineId, Pageable pageable);

    Optional<TelemetryData> findFirstByTurbineIdOrderByTimestampDesc(String turbineId);

    List<TelemetryData> findByTurbineIdAndTimestampBetweenOrderByTimestampAsc(
            String turbineId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT t FROM TelemetryData t WHERE t.turbineId = :turbineId AND " +
           "t.timestamp >= :start AND t.timestamp < :end ORDER BY t.timestamp ASC")
    List<TelemetryData> findByTurbineIdAndTimestampBetween(
            @Param("turbineId") String turbineId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    long countByTurbineId(String turbineId);

    boolean existsByTurbineId(String turbineId);
}
