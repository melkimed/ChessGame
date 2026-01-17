package com.chess.controller;

import com.chess.dto.GameDto;
import com.chess.dto.GameResponseDto;
import com.chess.dto.MoveDto;
import com.chess.dto.UserDto;
import com.chess.model.User;
import com.chess.service.GameServiceInterface;
import com.chess.service.UserServiceInterface;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {
    
    private static final Logger logger = LoggerFactory.getLogger(GameController.class);
    
    @Autowired
    private GameServiceInterface gameService;
    
    @Autowired
    private UserServiceInterface userService;
    
    @GetMapping("/online-users")
    public ResponseEntity<List<UserDto>> getOnlineUsers() {
        logger.info("Getting online users");
        List<UserDto> onlineUsers = userService.getOnlineUsers();
        return ResponseEntity.ok(onlineUsers);
    }
    
    @GetMapping("/{gameId}")
    public ResponseEntity<GameResponseDto> getGame(@PathVariable("gameId") Long gameId) {
        logger.info("Getting game with ID: {}", gameId);
        
        Optional<GameDto> gameOpt = gameService.findGameById(gameId);
        if (gameOpt.isPresent()) {
            GameDto game = gameOpt.get();
            List<MoveDto> moves = gameService.getGameMoves(gameId);
            
            GameResponseDto response = new GameResponseDto(game, moves);
            return ResponseEntity.ok(response);
        } else {
            logger.warn("Game not found with ID: {}", gameId);
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{gameId}/moves")
    public ResponseEntity<List<MoveDto>> getGameMoves(@PathVariable("gameId") Long gameId) {
        logger.info("Getting moves for game: {}", gameId);
        List<MoveDto> moves = gameService.getGameMoves(gameId);
        return ResponseEntity.ok(moves);
    }
    
    @GetMapping("/test/{username}")
    public ResponseEntity<String> testEndpoint(@PathVariable("username") String username) {
        logger.debug("Test endpoint called for user: {}", username);
        return ResponseEntity.ok("Hello " + username);
    }
    
    @GetMapping("/active/{username}")
    public ResponseEntity<GameResponseDto> getActiveGame(@PathVariable("username") String username) {
        logger.info("Getting active game for user: {}", username);
        
        Optional<User> userOpt = userService.findByUsername(username);
        if (userOpt.isEmpty()) {
            logger.warn("User not found: {}", username);
            return ResponseEntity.notFound().build();
        }
        
        Optional<GameDto> activeGameOpt = gameService.findActiveGameByPlayer(userOpt.get());
        if (activeGameOpt.isPresent()) {
            GameDto game = activeGameOpt.get();
            List<MoveDto> moves = gameService.getGameMoves(game.getId());
            GameResponseDto response = new GameResponseDto(game, moves);
            return ResponseEntity.ok(response);
        } else {
            // Return empty response when no active game
            GameResponseDto response = new GameResponseDto(null, List.of());
            return ResponseEntity.ok(response);
        }
    }
}