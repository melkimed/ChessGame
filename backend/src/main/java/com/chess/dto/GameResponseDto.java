package com.chess.dto;

import java.util.List;

public class GameResponseDto {
    private GameDto game;
    private List<MoveDto> moves;

    public GameResponseDto() {}

    public GameResponseDto(GameDto game, List<MoveDto> moves) {
        this.game = game;
        this.moves = moves;
    }

    // Getters and Setters
    public GameDto getGame() { return game; }
    public void setGame(GameDto game) { this.game = game; }

    public List<MoveDto> getMoves() { return moves; }
    public void setMoves(List<MoveDto> moves) { this.moves = moves; }
}