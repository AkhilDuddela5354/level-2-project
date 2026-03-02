package com.greenko.turbineservice.controller;

import com.greenko.turbineservice.model.User;
import com.greenko.turbineservice.security.AuthRequest;
import com.greenko.turbineservice.security.AuthResponse;
import com.greenko.turbineservice.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> request) {
        try {
            AuthRequest authRequest = new AuthRequest(
                    request.get("username"),
                    request.get("password")
            );
            AuthResponse response = authService.signup(
                    authRequest,
                    request.get("email"),
                    request.get("fullName"),
                    request.get("role")
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Signup failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Username", required = false) String username) {
        
        // Extract username from JWT if not provided in header
        if (username == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                com.greenko.turbineservice.security.JwtUtil jwtUtil = new com.greenko.turbineservice.security.JwtUtil();
                username = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                log.error("Failed to extract username from token: {}", e.getMessage());
            }
        }
        
        if (username != null) {
            authService.logout(username);
            log.info("User logged out: {}", username);
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Username", required = false) String username) {
        
        // Extract username from JWT if not provided in header
        if (username == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                com.greenko.turbineservice.security.JwtUtil jwtUtil = new com.greenko.turbineservice.security.JwtUtil();
                username = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                log.error("Failed to extract username from token: {}", e.getMessage());
                Map<String, String> error = new HashMap<>();
                error.put("message", "Invalid or expired token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
        }
        
        if (username == null) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Authentication required");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        
        try {
            User user = authService.getCurrentUser(username);
            Map<String, String> response = new HashMap<>();
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("role", user.getRole());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "auth");
        return ResponseEntity.ok(response);
    }
}
