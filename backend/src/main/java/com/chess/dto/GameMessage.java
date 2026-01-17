package com.chess.dto;

public class GameMessage {
    private String type;
    private String from;
    private String to;
    private String content;
    private Long gameId;
    private Object data;

    public GameMessage() {}

    public GameMessage(String type, String from, String to) {
        this.type = type;
        this.from = from;
        this.to = to;
    }

    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Long getGameId() { return gameId; }
    public void setGameId(Long gameId) { this.gameId = gameId; }

    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }
}