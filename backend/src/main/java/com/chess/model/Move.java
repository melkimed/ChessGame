package com.chess.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "moves")
public class Move {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "game_id")
    @JsonBackReference
    private Game game;
    
    @Column(name = "move_number")
    private Integer moveNumber;
    
    @Column(name = "player_color")
    private String playerColor; // "WHITE" or "BLACK"
    
    @Column(name = "from_position")
    private String fromPosition; // e.g., "e2"
    
    @Column(name = "to_position")
    private String toPosition; // e.g., "e4"
    
    @Column(name = "piece_type")
    private String pieceType; // "PAWN", "ROOK", "KNIGHT", etc.
    
    @Column(name = "captured_piece")
    private String capturedPiece;
    
    @Column(name = "move_notation")
    private String moveNotation; // Standard chess notation
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public Move() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Game getGame() { return game; }
    public void setGame(Game game) { this.game = game; }
    
    public Integer getMoveNumber() { return moveNumber; }
    public void setMoveNumber(Integer moveNumber) { this.moveNumber = moveNumber; }
    
    public String getPlayerColor() { return playerColor; }
    public void setPlayerColor(String playerColor) { this.playerColor = playerColor; }
    
    public String getFromPosition() { return fromPosition; }
    public void setFromPosition(String fromPosition) { this.fromPosition = fromPosition; }
    
    public String getToPosition() { return toPosition; }
    public void setToPosition(String toPosition) { this.toPosition = toPosition; }
    
    public String getPieceType() { return pieceType; }
    public void setPieceType(String pieceType) { this.pieceType = pieceType; }
    
    public String getCapturedPiece() { return capturedPiece; }
    public void setCapturedPiece(String capturedPiece) { this.capturedPiece = capturedPiece; }
    
    public String getMoveNotation() { return moveNotation; }
    public void setMoveNotation(String moveNotation) { this.moveNotation = moveNotation; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}