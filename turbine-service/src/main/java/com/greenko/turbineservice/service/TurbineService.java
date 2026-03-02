package com.greenko.turbineservice.service;

import com.greenko.turbineservice.model.Turbine;
import com.greenko.turbineservice.repository.TurbineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TurbineService {

    private final TurbineRepository turbineRepository;

    public List<Turbine> getAllTurbines() {
        log.debug("Fetching all turbines");
        return turbineRepository.findAll();
    }

    public Optional<Turbine> getTurbineById(String id) {
        log.debug("Fetching turbine with id: {}", id);
        return turbineRepository.findById(id);
    }

    @Transactional
    public Turbine createTurbine(Turbine turbine) {
        log.info("Creating new turbine: {}", turbine.getTurbineId());
        return turbineRepository.save(turbine);
    }

    @Transactional
    public Turbine updateTurbine(String id, Turbine turbine) {
        log.info("Updating turbine: {}", id);
        return turbineRepository.findById(id)
                .map(existing -> {
                    existing.setTurbineName(turbine.getTurbineName());
                    existing.setFarmId(turbine.getFarmId());
                    existing.setFarmName(turbine.getFarmName());
                    existing.setRegion(turbine.getRegion());
                    existing.setCapacity(turbine.getCapacity());
                    existing.setStatus(turbine.getStatus());
                    existing.setLatitude(turbine.getLatitude());
                    existing.setLongitude(turbine.getLongitude());
                    existing.setInstallationDate(turbine.getInstallationDate());
                    existing.setLastMaintenanceDate(turbine.getLastMaintenanceDate());
                    return turbineRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Turbine not found: " + id));
    }

    @Transactional
    public void deleteTurbine(String id) {
        log.info("Deleting turbine: {}", id);
        turbineRepository.deleteById(id);
    }

    public List<Turbine> getTurbinesByFarm(String farmId) {
        log.debug("Fetching turbines for farm: {}", farmId);
        return turbineRepository.findByFarmId(farmId);
    }

    public List<Turbine> getTurbinesByRegion(String region) {
        log.debug("Fetching turbines for region: {}", region);
        return turbineRepository.findByRegion(region);
    }

    public List<Turbine> getTurbinesByStatus(Turbine.TurbineStatus status) {
        log.debug("Fetching turbines with status: {}", status);
        return turbineRepository.findByStatus(status);
    }

    public List<Turbine> searchTurbines(String query) {
        log.debug("Searching turbines with query: {}", query);
        return turbineRepository.searchTurbines(query);
    }

    public long countByStatus(Turbine.TurbineStatus status) {
        return turbineRepository.countByStatus(status);
    }
}
