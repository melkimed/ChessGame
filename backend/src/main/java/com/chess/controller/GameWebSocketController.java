package com.chess.controller;

import com.chess.dto.GameDto;
import com.chess.dto.GameMessage;
import com.chess.dto.MoveDto;
import com.chess.dto.MoveMessage;
import com.chess.model.User;
import com.chess.service.GameServiceInterface;
import com.chess.service.UserServiceInterface;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.Optional;

@Controller
public class GameWebSocketController {
    
    private static final Logger logger = LoggerFactory.getLogger(GameWebSocketController.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private UserServiceInterface userService;
    
    @Autowired
    private GameServiceInterface gameService;
    
    @MessageMapping("/invite")
    public void sendInvite(GameMessage message) {
        logger.info("User {} sending invite to {}", message.getFrom(), message.getTo());
        
        // Validate that from and to are provided
        if (message.getFrom() == null || message.getTo() == null) {
            logger.error("Invalid invite message: from={}, to={}", message.getFrom(), message.getTo());
            return;
        }
        
        // Debug: Log the message being sent
        logger.debug("Sending message to user '{}': {}", message.getTo(), message);
        
        try {
            // Try both approaches: user-specific and topic-based
            messagingTemplate.convertAndSendToUser(
                message.getTo(), 
                "/queue/invites", 
                message
            );
            
            // Also send to a topic that the user can subscribe to
            messagingTemplate.convertAndSend(
                "/topic/invites/" + message.getTo(),
                message
            );
            
            logger.info("Invite sent successfully from {} to {} (both user queue and topic)", message.getFrom(), message.getTo());
        } catch (Exception e) {
            logger.error("Error sending invite from {} to {}: {}", message.getFrom(), message.getTo(), e.getMessage(), e);
        }
    }
    
    @MessageMapping("/invite-response")
    public void handleInviteResponse(GameMessage message) {
        logger.info("User {} responding to invite from {} with: {}", 
                   message.getTo(), message.getFrom(), message.getType());
        
        if ("ACCEPT".equals(message.getType())) {
            try {
                // Create new game
                Optional<User> inviter = userService.findByUsername(message.getFrom());
                Optional<User> invitee = userService.findByUsername(message.getTo());
                
                if (inviter.isPresent() && invitee.isPresent()) {
                    GameDto game = gameService.createGame(inviter.get(), invitee.get());
                    
                    GameMessage gameStart = new GameMessage("GAME_START", message.getTo(), message.getFrom());
                    gameStart.setGameId(game.getId());
                    gameStart.setData(game);
                    
                    logger.info("Sending GAME_START to both players: {} and {}", message.getFrom(), message.getTo());
                    
                    // Notify both players via user queue and topic
                    try {
                        messagingTemplate.convertAndSendToUser(message.getFrom(), "/queue/game", gameStart);
                        messagingTemplate.convertAndSend("/topic/game/" + message.getFrom(), gameStart);
                        logger.info("GAME_START sent to inviter: {}", message.getFrom());
                    } catch (Exception e) {
                        logger.error("Error sending GAME_START to inviter {}: {}", message.getFrom(), e.getMessage());
                    }
                    
                    try {
                        messagingTemplate.convertAndSendToUser(message.getTo(), "/queue/game", gameStart);
                        messagingTemplate.convertAndSend("/topic/game/" + message.getTo(), gameStart);
                        logger.info("GAME_START sent to invitee: {}", message.getTo());
                    } catch (Exception e) {
                        logger.error("Error sending GAME_START to invitee {}: {}", message.getTo(), e.getMessage());
                    }
                    
                    logger.info("Game {} created and players notified", game.getId());
                } else {
                    logger.error("Could not find users for game creation: inviter={}, invitee={}", 
                               message.getFrom(), message.getTo());
                }
            } catch (Exception e) {
                logger.error("Error creating game: {}", e.getMessage(), e);
                sendErrorMessage(message.getTo(), "Erreur lors de la création de la partie");
            }
        } else {
            // Decline invitation
            try {
                messagingTemplate.convertAndSendToUser(
                    message.getFrom(), 
                    "/queue/invites", 
                    new GameMessage("DECLINE", message.getTo(), message.getFrom())
                );
                messagingTemplate.convertAndSend(
                    "/topic/invites/" + message.getFrom(),
                    new GameMessage("DECLINE", message.getTo(), message.getFrom())
                );
                logger.info("Invite declined by {}", message.getTo());
            } catch (Exception e) {
                logger.error("Error sending decline message: {}", e.getMessage());
            }
        }
    }
    
    @MessageMapping("/move")
    public void handleMove(MoveMessage moveMessage) {
        logger.info("Processing move in game {}: {} to {}", 
                   moveMessage.getGameId(), 
                   moveMessage.getFrom(), moveMessage.getTo());
        
        try {
            MoveDto move = gameService.makeMove(
                moveMessage.getGameId(),
                moveMessage.getFrom(),
                moveMessage.getTo(),
                moveMessage.getPiece(),
                moveMessage.getPlayerColor()
            );
            
            // Broadcast move to game room
            messagingTemplate.convertAndSend(
                "/topic/game/" + moveMessage.getGameId(),
                move
            );
            
            logger.info("Move completed and broadcasted: {}", move.getMoveNotation());
            
        } catch (Exception e) {
            logger.error("Error processing move: {}", e.getMessage());
            // Send error to game room
            messagingTemplate.convertAndSend(
                "/topic/game/" + moveMessage.getGameId(),
                new GameMessage("ERROR", "system", "all")
            );
        }
    }
    
    @MessageMapping("/join-game")
    public void joinGame(GameMessage message) {
        logger.info("User {} joining game {}", message.getFrom(), message.getGameId());
        
        // Player joins game room for real-time updates
        messagingTemplate.convertAndSend(
            "/topic/game/" + message.getGameId(),
            new GameMessage("PLAYER_JOINED", message.getFrom(), "all")
        );
    }
    
    private void sendErrorMessage(String username, String errorMessage) {
        GameMessage error = new GameMessage("ERROR", "system", username);
        error.setContent(errorMessage);
        messagingTemplate.convertAndSendToUser(username, "/queue/errors", error);
    }
}