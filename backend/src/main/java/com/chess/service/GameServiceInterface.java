package com.chess.service;

import com.chess.dto.GameDto;
import com.chess.dto.MoveDto;
import com.chess.model.User;
import java.util.List;
import java.util.Optional;

public interface GameServiceInterface {
    
    /**
     * Crée une nouvelle partie d'échecs
     */
    GameDto createGame(User whitePlayer, User blackPlayer);
    
    /**
     * Trouve une partie active pour un joueur donné
     */
    Optional<GameDto> findActiveGameByPlayer(User player);
    
    /**
     * Trouve une partie par son ID
     */
    Optional<GameDto> findGameById(Long gameId);
    
    /**
     * Effectue un mouvement dans une partie
     */
    MoveDto makeMove(Long gameId, String from, String to, String piece, String playerColor);
    
    /**
     * Récupère tous les mouvements d'une partie
     */
    List<MoveDto> getGameMoves(Long gameId);
}