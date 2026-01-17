package com.chess.service;

import com.chess.dto.GameDto;
import com.chess.dto.MoveDto;
import com.chess.exception.GameNotFoundException;
import com.chess.exception.InvalidMoveException;
import com.chess.model.Game;
import com.chess.model.Move;
import com.chess.model.User;
import com.chess.repository.GameRepository;
import com.chess.repository.MoveRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class GameServiceImpl implements GameServiceInterface {
    
    private static final Logger logger = LoggerFactory.getLogger(GameServiceImpl.class);
    
    @Autowired
    private GameRepository gameRepository;
    
    @Autowired
    private MoveRepository moveRepository;
    
    @Override
    public GameDto createGame(User whitePlayer, User blackPlayer) {
        logger.info("Creating new game between {} (white) and {} (black)", 
                   whitePlayer.getUsername(), blackPlayer.getUsername());
        
        Game game = new Game();
        game.setWhitePlayer(whitePlayer);
        game.setBlackPlayer(blackPlayer);
        game.setStatus(Game.GameStatus.ACTIVE);
        game.setCurrentTurn("WHITE");
        game.setCreatedAt(LocalDateTime.now());
        game.setUpdatedAt(LocalDateTime.now());
        
        Game savedGame = gameRepository.save(game);
        logger.info("Game created successfully with ID: {}", savedGame.getId());
        
        return new GameDto(savedGame);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<GameDto> findActiveGameByPlayer(User player) {
        logger.debug("Finding active game for player: {}", player.getUsername());
        
        Optional<Game> gameOpt = gameRepository.findActiveGameByPlayer(player);
        return gameOpt.map(GameDto::new);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<GameDto> findGameById(Long gameId) {
        logger.debug("Finding game by ID: {}", gameId);
        
        Optional<Game> gameOpt = gameRepository.findById(gameId);
        return gameOpt.map(GameDto::new);
    }
    
    @Override
    public MoveDto makeMove(Long gameId, String from, String to, String piece, String playerColor) {
        logger.info("Making move in game {}: {} {} from {} to {}", 
                   gameId, playerColor, piece, from, to);
        
        Game game = gameRepository.findById(gameId)
            .orElseThrow(() -> new GameNotFoundException("Game not found with ID: " + gameId));
        
        // Validate game status
        if (game.getStatus() != Game.GameStatus.ACTIVE) {
            throw new InvalidMoveException("Game is not active");
        }
        
        // Validate turn
        if (!game.getCurrentTurn().equals(playerColor)) {
            throw new InvalidMoveException("Not your turn. Current turn: " + game.getCurrentTurn());
        }
        
        // Validate move format
        if (!isValidMoveFormat(from, to, piece)) {
            throw new InvalidMoveException("Invalid move format");
        }
        
        // Create move
        Move move = new Move();
        move.setGame(game);
        move.setFromPosition(from);
        move.setToPosition(to);
        move.setPieceType(piece);
        move.setPlayerColor(playerColor);
        move.setMoveNumber(game.getMoves().size() + 1);
        move.setMoveNotation(generateMoveNotation(from, to, piece));
        move.setCreatedAt(LocalDateTime.now());
        
        Move savedMove = moveRepository.save(move);
        
        // Switch turn
        game.setCurrentTurn(playerColor.equals("WHITE") ? "BLACK" : "WHITE");
        game.setUpdatedAt(LocalDateTime.now());
        gameRepository.save(game);
        
        logger.info("Move completed successfully: {}", savedMove.getMoveNotation());
        return new MoveDto(savedMove);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<MoveDto> getGameMoves(Long gameId) {
        logger.debug("Getting moves for game: {}", gameId);
        
        if (!gameRepository.existsById(gameId)) {
            throw new GameNotFoundException("Game not found with ID: " + gameId);
        }
        
        List<Move> moves = moveRepository.findByGameIdOrderByMoveNumberAsc(gameId);
        return moves.stream()
                   .map(MoveDto::new)
                   .collect(Collectors.toList());
    }
    
    private boolean isValidMoveFormat(String from, String to, String piece) {
        // Basic validation - can be expanded with chess rules
        return from != null && from.matches("[a-h][1-8]") &&
               to != null && to.matches("[a-h][1-8]") &&
               piece != null && !piece.trim().isEmpty();
    }
    
    private String generateMoveNotation(String from, String to, String piece) {
        // Simple notation for now - can be improved with proper chess notation
        return piece.charAt(0) + from + "-" + to;
    }
}