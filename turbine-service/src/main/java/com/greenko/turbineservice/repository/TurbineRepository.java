package com.greenko.turbineservice.repository;

import com.greenko.turbineservice.model.Turbine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TurbineRepository extends JpaRepository<Turbine, String> {

    List<Turbine> findByFarmId(String farmId);

    List<Turbine> findByFarmName(String farmName);

    List<Turbine> findByRegion(String region);

    List<Turbine> findByStatus(Turbine.TurbineStatus status);

    @Query("SELECT t FROM Turbine t WHERE " +
           "LOWER(t.turbineName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.farmName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.region) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Turbine> searchTurbines(@Param("query") String query);

    long countByStatus(Turbine.TurbineStatus status);
}
