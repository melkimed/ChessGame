package com.chess.controller;

import com.chess.dto.UserDto;
import com.chess.model.User;
import com.chess.service.UserServiceInterface;
import com.chess.service.UserNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private UserServiceInterface userService;
    
    @Autowired
    private UserNotificationService userNotificationService;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        logger.info("Registration attempt for username: {}", request.get("username"));
        
        try {
            String username = request.get("username");
            String password = request.get("password");
            
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username is required"));
            }
            
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password is required"));
            }
            
            UserDto user = userService.createUser(username, password);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", Map.of("id", user.getId(), "username", user.getUsername()));
            
            logger.info("User registered successfully: {}", username);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Registration failed for username: {}, error: {}", request.get("username"), e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        logger.info("Login attempt for username: {}", username);
        
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username is required"));
        }
        
        String password = request.get("password");
        if (password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password is required"));
        }
        
        Optional<UserDto> userOpt = userService.authenticate(username, password);
        
        if (userOpt.isPresent()) {
            UserDto user = userOpt.get();
            userService.setUserOnline(username, true);
            
            // Notifier tous les utilisateurs que cet utilisateur est en ligne
            userNotificationService.notifyUserOnline(username);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", Map.of("id", user.getId(), "username", user.getUsername()));
            
            logger.info("User logged in successfully: {}", username);
            return ResponseEntity.ok(response);
        } else {
            logger.warn("Login failed for username: {}", username);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid credentials"));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        logger.info("Logout request for username: {}", username);
        
        if (username != null && !username.trim().isEmpty()) {
            userService.setUserOnline(username, false);
            
            // Notifier tous les utilisateurs que cet utilisateur est hors ligne
            userNotificationService.notifyUserOffline(username);
            
            logger.info("User logged out successfully: {}", username);
        }
        
        return ResponseEntity.ok(Map.of("success", true));
    }
}