package com.greenko.turbineservice.controller;

import com.greenko.turbineservice.model.Turbine;
import com.greenko.turbineservice.service.TurbineService;
import com.greenko.turbineservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/turbines")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TurbineController {

    private final TurbineService turbineService;
    private final JwtUtil jwtUtil;
    
    private String extractRoleFromToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                return jwtUtil.extractRole(token);
            } catch (Exception e) {
                log.error("Failed to extract role from token: {}", e.getMessage());
            }
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Turbine>> getAllTurbines() {
        log.info("GET /api/turbines - Fetching all turbines");
        List<Turbine> turbines = turbineService.getAllTurbines();
        log.info("Returning {} turbines", turbines.size());
        return ResponseEntity.ok(turbines);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Turbine> getTurbineById(@PathVariable String id) {
        log.info("GET /api/turbines/{} - Fetching turbine", id);
        return turbineService.getTurbineById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createTurbine(
            @RequestBody Turbine turbine, 
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        log.info("POST /api/turbines - Creating turbine");
        
        // Try X-User-Role header first, then extract from JWT
        String role = headerRole != null ? headerRole : extractRoleFromToken(authHeader);
        log.info("Extracted role: {}", role);
        
        if (role == null || !role.equals("ADMIN")) {
            log.warn("Unauthorized create attempt by role: {}", role);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("message", "Access Denied: Only ADMIN users can create turbines"));
        }
        
        Turbine created = turbineService.createTurbine(turbine);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTurbine(
            @PathVariable String id, 
            @RequestBody Turbine turbine, 
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        log.info("PUT /api/turbines/{} - Updating turbine", id);
        
        // Try X-User-Role header first, then extract from JWT
        String role = headerRole != null ? headerRole : extractRoleFromToken(authHeader);
        log.info("Extracted role: {}", role);
        
        if (role == null || !role.equals("ADMIN")) {
            log.warn("Unauthorized update attempt by role: {}", role);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("message", "Access Denied: Only ADMIN users can update turbines"));
        }
        
        try {
            Turbine updated = turbineService.updateTurbine(id, turbine);
            log.info("Turbine {} updated successfully", id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Failed to update turbine {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("message", "Turbine not found: " + id));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTurbine(
            @PathVariable String id, 
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        log.info("DELETE /api/turbines/{} - Deleting turbine", id);
        
        // Try X-User-Role header first, then extract from JWT
        String role = headerRole != null ? headerRole : extractRoleFromToken(authHeader);
        log.info("Extracted role: {}", role);
        
        if (role == null || !role.equals("ADMIN")) {
            log.warn("Unauthorized delete attempt by role: {}", role);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("message", "Access Denied: Only ADMIN users can delete turbines"));
        }
        
        try {
            turbineService.deleteTurbine(id);
            log.info("Turbine {} deleted successfully", id);
            return ResponseEntity.ok(java.util.Map.of("message", "Turbine deleted successfully", "turbineId", id));
        } catch (Exception e) {
            log.error("Failed to delete turbine {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Failed to delete turbine"));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateTurbineStatus(
            @PathVariable String id, 
            @RequestParam String status, 
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Role", required = false) String headerRole) {
        log.info("PATCH /api/turbines/{}/status - Updating status to {}", id, status);
        
        // Try X-User-Role header first, then extract from JWT
        String role = headerRole != null ? headerRole : extractRoleFromToken(authHeader);
        log.info("Extracted role: {}", role);
        
        if (role == null || !role.equals("ADMIN")) {
            log.warn("Unauthorized status update attempt by role: {}", role);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("message", "Access Denied: Only ADMIN users can update turbine status"));
        }
        
        try {
            Turbine turbine = turbineService.getTurbineById(id)
                    .orElseThrow(() -> new RuntimeException("Turbine not found"));
            
            turbine.setStatus(Turbine.TurbineStatus.valueOf(status.toUpperCase()));
            Turbine updated = turbineService.updateTurbine(id, turbine);
            
            log.info("Turbine {} status updated to {}", id, status);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("message", "Invalid status value"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("message", "Turbine not found"));
        }
    }

    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<Turbine>> getTurbinesByFarm(@PathVariable String farmId) {
        log.info("GET /api/turbines/farm/{}", farmId);
        return ResponseEntity.ok(turbineService.getTurbinesByFarm(farmId));
    }

    @GetMapping("/region/{region}")
    public ResponseEntity<List<Turbine>> getTurbinesByRegion(@PathVariable String region) {
        log.info("GET /api/turbines/region/{}", region);
        return ResponseEntity.ok(turbineService.getTurbinesByRegion(region));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Turbine>> getTurbinesByStatus(@PathVariable Turbine.TurbineStatus status) {
        log.info("GET /api/turbines/status/{}", status);
        return ResponseEntity.ok(turbineService.getTurbinesByStatus(status));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Turbine>> searchTurbines(@RequestParam String q) {
        log.info("GET /api/turbines/search?q={}", q);
        return ResponseEntity.ok(turbineService.searchTurbines(q));
    }

    @GetMapping("/stats")
    public ResponseEntity<Object> getStats() {
        log.info("GET /api/turbines/stats");
        return ResponseEntity.ok(new Object() {
            public final long total = turbineService.getAllTurbines().size();
            public final long active = turbineService.countByStatus(Turbine.TurbineStatus.ACTIVE);
            public final long maintenance = turbineService.countByStatus(Turbine.TurbineStatus.MAINTENANCE);
            public final long offline = turbineService.countByStatus(Turbine.TurbineStatus.OFFLINE);
        });
    }
}
