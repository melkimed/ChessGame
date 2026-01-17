package com.chess.dto;

import com.chess.model.Game;
import java.time.LocalDateTime;

public class GameDto {
    private Long id;
    private UserDto whitePlayer;
    private UserDto blackPlayer;
    private String status;
    private String currentTurn;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GameDto() {}

    public GameDto(Game game) {
        this.id = game.getId();
        this.whitePlayer = game.getWhitePlayer() != null ? new UserDto(game.getWhitePlayer()) : null;
        this.blackPlayer = game.getBlackPlayer() != null ? new UserDto(game.getBlackPlayer()) : null;
        this.status = game.getStatus() != null ? game.getStatus().toString() : null;
        this.currentTurn = game.getCurrentTurn();
        this.createdAt = game.getCreatedAt();
        this.updatedAt = game.getUpdatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserDto getWhitePlayer() { return whitePlayer; }
    public void setWhitePlayer(UserDto whitePlayer) { this.whitePlayer = whitePlayer; }

    public UserDto getBlackPlayer() { return blackPlayer; }
    public void setBlackPlayer(UserDto blackPlayer) { this.blackPlayer = blackPlayer; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCurrentTurn() { return currentTurn; }
    public void setCurrentTurn(String currentTurn) { this.currentTurn = currentTurn; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}