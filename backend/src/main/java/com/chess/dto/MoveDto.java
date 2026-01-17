package com.chess.dto;

import com.chess.model.Move;
import java.time.LocalDateTime;

public class MoveDto {
    private Long id;
    private String fromPosition;
    private String toPosition;
    private String pieceType;
    private String playerColor;
    private Integer moveNumber;
    private String moveNotation;
    private LocalDateTime createdAt;

    public MoveDto() {}

    public MoveDto(Move move) {
        this.id = move.getId();
        this.fromPosition = move.getFromPosition();
        this.toPosition = move.getToPosition();
        this.pieceType = move.getPieceType();
        this.playerColor = move.getPlayerColor();
        this.moveNumber = move.getMoveNumber();
        this.moveNotation = move.getMoveNotation();
        this.createdAt = move.getCreatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFromPosition() { return fromPosition; }
    public void setFromPosition(String fromPosition) { this.fromPosition = fromPosition; }

    public String getToPosition() { return toPosition; }
    public void setToPosition(String toPosition) { this.toPosition = toPosition; }

    public String getPieceType() { return pieceType; }
    public void setPieceType(String pieceType) { this.pieceType = pieceType; }

    public String getPlayerColor() { return playerColor; }
    public void setPlayerColor(String playerColor) { this.playerColor = playerColor; }

    public Integer getMoveNumber() { return moveNumber; }
    public void setMoveNumber(Integer moveNumber) { this.moveNumber = moveNumber; }

    public String getMoveNotation() { return moveNotation; }
    public void setMoveNotation(String moveNotation) { this.moveNotation = moveNotation; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}