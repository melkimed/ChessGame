package com.chess.dto;

public class MoveMessage {
    private Long gameId;
    private String from;
    private String to;
    private String piece;
    private String playerColor;
    private String moveNotation;

    public MoveMessage() {}

    // Getters and Setters
    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getPiece() { return piece; }
    public void setPiece(String piece) { this.piece = piece; }

    public String getPlayerColor() { return playerColor; }
    public void setPlayerColor(String playerColor) { this.playerColor = playerColor; }

    public String getMoveNotation() { return moveNotation; }
    public void setMoveNotation(String moveNotation) { this.moveNotation = moveNotation; }
}