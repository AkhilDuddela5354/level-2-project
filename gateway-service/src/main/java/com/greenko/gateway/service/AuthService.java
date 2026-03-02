package com.greenko.gateway.service;

import com.greenko.gateway.model.User;
import com.greenko.gateway.repository.UserRepository;
import com.greenko.gateway.security.AuthRequest;
import com.greenko.gateway.security.AuthResponse;
import com.greenko.gateway.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        userRepository.updateLastLogin(user.getUsername());
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        log.info("User logged in: {}", user.getUsername());
        return new AuthResponse(token, user.getUsername(), "Login successful");
    }

    public AuthResponse signup(AuthRequest request, String email, String fullName, String role) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role != null && !role.isEmpty() ? role : "USER");
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        log.info("New user registered: {} with role: {}", user.getUsername(), user.getRole());
        return new AuthResponse(token, user.getUsername(), "Registration successful");
    }

    public void logout(String username) {
        log.info("User logged out: {}", username);
        // In a production system, you might want to blacklist the token
    }

    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
