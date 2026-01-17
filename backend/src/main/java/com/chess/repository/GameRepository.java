package com.chess.repository;

import com.chess.model.Game;
import com.chess.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    
    @Query("SELECT g FROM Game g WHERE (g.whitePlayer = ?1 OR g.blackPlayer = ?1) AND g.status = 'ACTIVE'")
    Optional<Game> findActiveGameByPlayer(User player);
    
    @Query("SELECT g FROM Game g WHERE (g.whitePlayer = ?1 OR g.blackPlayer = ?1)")
    List<Game> findGamesByPlayer(User player);
    
    List<Game> findByStatus(Game.GameStatus status);
}