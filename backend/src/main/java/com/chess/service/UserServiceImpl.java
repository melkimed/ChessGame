package com.chess.service;

import com.chess.dto.UserDto;
import com.chess.exception.UserAlreadyExistsException;
import com.chess.model.User;
import com.chess.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserServiceInterface {
    
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public UserDto createUser(String username, String password) {
        logger.info("Creating new user: {}", username);
        
        if (userRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException("Username already exists: " + username);
        }
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setOnline(false);
        
        User savedUser = userRepository.save(user);
        logger.info("User created successfully: {}", savedUser.getUsername());
        
        return new UserDto(savedUser);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserDto> authenticate(String username, String password) {
        logger.debug("Authenticating user: {}", username);
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            logger.info("User authenticated successfully: {}", username);
            return Optional.of(new UserDto(userOpt.get()));
        }
        
        logger.warn("Authentication failed for user: {}", username);
        return Optional.empty();
    }
    
    @Override
    public void setUserOnline(String username, boolean online) {
        logger.debug("Setting user {} online status to: {}", username, online);
        
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setOnline(online);
            userRepository.save(user);
            logger.info("User {} online status updated to: {}", username, online);
        });
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getOnlineUsers() {
        logger.debug("Getting all online users");
        
        List<User> onlineUsers = userRepository.findByIsOnlineTrue();
        return onlineUsers.stream()
                         .map(UserDto::new)
                         .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        logger.debug("Finding user by username: {}", username);
        return userRepository.findByUsername(username);
    }
}