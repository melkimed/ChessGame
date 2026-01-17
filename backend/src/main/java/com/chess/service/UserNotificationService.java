package com.chess.service;

import com.chess.dto.GameMessage;
import com.chess.dto.UserDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserNotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserNotificationService.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private UserServiceInterface userService;
    
    /**
     * Notifie tous les utilisateurs connectés qu'un utilisateur s'est connecté
     */
    public void notifyUserOnline(String username) {
        logger.info("Notifying all users that {} is now online", username);
        
        try {
            List<UserDto> onlineUsers = userService.getOnlineUsers();
            
            GameMessage notification = new GameMessage("USER_ONLINE", "system", "all");
            notification.setContent(username);
            notification.setData(onlineUsers);
            
            // Envoyer à tous les utilisateurs connectés
            messagingTemplate.convertAndSend("/topic/users", notification);
            
            logger.info("User online notification sent for: {}", username);
        } catch (Exception e) {
            logger.error("Failed to send user online notification for {}: {}", username, e.getMessage());
        }
    }
    
    /**
     * Notifie tous les utilisateurs connectés qu'un utilisateur s'est déconnecté
     */
    public void notifyUserOffline(String username) {
        logger.info("Notifying all users that {} is now offline", username);
        
        try {
            List<UserDto> onlineUsers = userService.getOnlineUsers();
            
            GameMessage notification = new GameMessage("USER_OFFLINE", "system", "all");
            notification.setContent(username);
            notification.setData(onlineUsers);
            
            // Envoyer à tous les utilisateurs connectés
            messagingTemplate.convertAndSend("/topic/users", notification);
            
            logger.info("User offline notification sent for: {}", username);
        } catch (Exception e) {
            logger.error("Failed to send user offline notification for {}: {}", username, e.getMessage());
        }
    }
}