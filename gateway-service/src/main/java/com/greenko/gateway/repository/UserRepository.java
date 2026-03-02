package com.greenko.gateway.repository;

import com.greenko.gateway.model.User;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class UserRepository {
    
    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final Map<String, User> usersByUsername = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public UserRepository() {
        // Add default admin user
        User admin = new User();
        admin.setId(idGenerator.getAndIncrement());
        admin.setUsername("admin");
        admin.setPassword("$2a$10$xN.8YLiKf0mP4xtWW5fXl.Qr7z8Z7QJ5qE5Gk8RwJ5N7L9X6K8M9O"); // BCrypt hash of "admin123"
        admin.setEmail("admin@greenko.com");
        admin.setFullName("System Administrator");
        admin.setRole("ADMIN");
        admin.setCreatedAt(LocalDateTime.now());
        
        users.put(admin.getId(), admin);
        usersByUsername.put(admin.getUsername(), admin);

        // Add default operator user
        User operator = new User();
        operator.setId(idGenerator.getAndIncrement());
        operator.setUsername("operator");
        operator.setPassword("$2a$10$xN.8YLiKf0mP4xtWW5fXl.Qr7z8Z7QJ5qE5Gk8RwJ5N7L9X6K8M9O"); // BCrypt hash of "operator123"
        operator.setEmail("operator@greenko.com");
        operator.setFullName("Operations Engineer");
        operator.setRole("OPERATOR");
        operator.setCreatedAt(LocalDateTime.now());
        
        users.put(operator.getId(), operator);
        usersByUsername.put(operator.getUsername(), operator);
    }

    public User save(User user) {
        if (user.getId() == null) {
            user.setId(idGenerator.getAndIncrement());
        }
        users.put(user.getId(), user);
        usersByUsername.put(user.getUsername(), user);
        return user;
    }

    public Optional<User> findByUsername(String username) {
        return Optional.ofNullable(usersByUsername.get(username));
    }

    public Optional<User> findById(Long id) {
        return Optional.ofNullable(users.get(id));
    }

    public boolean existsByUsername(String username) {
        return usersByUsername.containsKey(username);
    }

    public void updateLastLogin(String username) {
        findByUsername(username).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            save(user);
        });
    }
}
