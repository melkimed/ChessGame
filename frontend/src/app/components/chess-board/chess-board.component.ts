import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { GameService, Game, Move } from '../../services/game.service';
import { WebSocketSimpleService } from '../../services/websocket-simple.service';
import { Subscription } from 'rxjs';

interface ChessPiece {
  type: string;
  color: string;
  symbol: string;
}

interface ChessSquare {
  piece: ChessPiece | null;
  position: string;
  isSelected: boolean;
  isValidMove: boolean;
}

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.scss']
})
export class ChessBoardComponent implements OnInit, OnDestroy {
  gameId!: number;
  game: Game | null = null;
  moves: Move[] = [];
  board: ChessSquare[] = [];
  currentUser: User | null = null;
  selectedSquare: ChessSquare | null = null;
  gameStatus = '';
  message = '';
  error = false;

  private subscriptions: Subscription[] = [];

  // Chess pieces symbols
  private pieceSymbols: { [key: string]: string } = {
    'WHITE_KING': '♔', 'WHITE_QUEEN': '♕', 'WHITE_ROOK': '♖',
    'WHITE_BISHOP': '♗', 'WHITE_KNIGHT': '♘', 'WHITE_PAWN': '♙',
    'BLACK_KING': '♚', 'BLACK_QUEEN': '♛', 'BLACK_ROOK': '♜',
    'BLACK_BISHOP': '♝', 'BLACK_KNIGHT': '♞', 'BLACK_PAWN': '♟'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private gameService: GameService,
    private webSocketService: WebSocketSimpleService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
    this.initializeBoard();
    this.loadGame();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeBoard(): void {
    this.board = [];

    // Initialize empty board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const position = String.fromCharCode(97 + col) + (8 - row);
        this.board.push({
          piece: null,
          position: position,
          isSelected: false,
          isValidMove: false
        });
      }
    }

    // Set up initial pieces
    this.setupInitialPieces();
  }

  private setupInitialPieces(): void {
    // Black pieces (top of board - row 0 and 1)
    this.setPiece(0, 0, 'ROOK', 'BLACK');
    this.setPiece(0, 1, 'KNIGHT', 'BLACK');
    this.setPiece(0, 2, 'BISHOP', 'BLACK');
    this.setPiece(0, 3, 'QUEEN', 'BLACK');
    this.setPiece(0, 4, 'KING', 'BLACK');
    this.setPiece(0, 5, 'BISHOP', 'BLACK');
    this.setPiece(0, 6, 'KNIGHT', 'BLACK');
    this.setPiece(0, 7, 'ROOK', 'BLACK');

    for (let col = 0; col < 8; col++) {
      this.setPiece(1, col, 'PAWN', 'BLACK');
    }

    // White pieces (bottom of board - row 6 and 7)
    this.setPiece(7, 0, 'ROOK', 'WHITE');
    this.setPiece(7, 1, 'KNIGHT', 'WHITE');
    this.setPiece(7, 2, 'BISHOP', 'WHITE');
    this.setPiece(7, 3, 'QUEEN', 'WHITE');
    this.setPiece(7, 4, 'KING', 'WHITE');
    this.setPiece(7, 5, 'BISHOP', 'WHITE');
    this.setPiece(7, 6, 'KNIGHT', 'WHITE');
    this.setPiece(7, 7, 'ROOK', 'WHITE');

    for (let col = 0; col < 8; col++) {
      this.setPiece(6, col, 'PAWN', 'WHITE');
    }
  }

  private setPiece(row: number, col: number, type: string, color: string): void {
    const index = row * 8 + col;
    const symbol = this.pieceSymbols[`${color}_${type}`];

    this.board[index].piece = {
      type: type,
      color: color,
      symbol: symbol
    };
  }

  private loadGame(): void {
    this.gameService.getGame(this.gameId).subscribe({
      next: (response) => {
        this.game = response.game;
        this.moves = response.moves;
        
        if (this.game) {
          this.applyMovesToBoard();
          this.updateGameStatus();
        } else {
          this.showMessage('Partie non trouvée', true);
        }
      },
      error: () => {
        this.showMessage('Erreur lors du chargement de la partie', true);
      }
    });
  }

  private async connectWebSocket(): Promise<void> {
    try {
      // Set username for WebSocket authentication
      if (this.currentUser) {
        this.webSocketService.setUsername(this.currentUser.username);
      }
      
      await this.webSocketService.connect();

      // Subscribe to game moves
      const moveSub = this.webSocketService.subscribe(`/topic/game/${this.gameId}`)
        .subscribe({
          next: (move) => {
            if (move.id) {
              // New move received
              this.moves.push(move);
              this.applyMoveToBoard(move);
              this.game!.currentTurn = this.game!.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE';
              this.updateGameStatus();
            }
          },
          error: () => {
            // Handle error silently
          }
        });

      this.subscriptions.push(moveSub);

      // Join game room
      try {
        await this.webSocketService.sendMessage('/app/join-game', {
          gameId: this.gameId,
          from: this.currentUser?.username,
          type: 'JOIN'
        });
      } catch (error) {
        // Handle error silently
      }
      
    } catch (error) {
      this.showMessage('Erreur de connexion WebSocket dans le jeu', true);
    }
  }

  private applyMovesToBoard(): void {
    this.moves.forEach(move => {
      this.applyMoveToBoard(move);
    });
  }

  private applyMoveToBoard(move: Move): void {
    const fromIndex = this.positionToIndex(move.fromPosition);
    const toIndex = this.positionToIndex(move.toPosition);

    // Move piece
    this.board[toIndex].piece = this.board[fromIndex].piece;
    this.board[fromIndex].piece = null;
  }

  private positionToIndex(position: string): number {
    const col = position.charCodeAt(0) - 97; // a=0, b=1, etc.
    const row = 8 - parseInt(position[1]); // 8=0, 7=1, etc.
    return row * 8 + col;
  }

  private indexToPosition(index: number): string {
    const row = Math.floor(index / 8);
    const col = index % 8;
    return String.fromCharCode(97 + col) + (8 - row);
  }

  async onSquareClick(square: ChessSquare): Promise<void> {
    if (!this.canPlayerMove()) {
      this.showMessage('Ce n\'est pas votre tour', true);
      return;
    }

    if (this.selectedSquare) {
      if (this.selectedSquare === square) {
        // Deselect
        this.clearSelection();
      } else if (square.isValidMove) {
        // Make move
        await this.makeMove(this.selectedSquare, square);
      } else if (square.piece && this.isPlayerPiece(square.piece)) {
        // Select different piece
        this.selectSquare(square);
      } else {
        this.clearSelection();
      }
    } else if (square.piece && this.isPlayerPiece(square.piece)) {
      // Select piece
      this.selectSquare(square);
    }
  }

  private selectSquare(square: ChessSquare): void {
    this.clearSelection();
    this.selectedSquare = square;
    square.isSelected = true;

    // Highlight valid moves
    this.highlightValidMoves(square);
  }

  private clearSelection(): void {
    this.board.forEach(square => {
      square.isSelected = false;
      square.isValidMove = false;
    });
    this.selectedSquare = null;
  }

  private highlightValidMoves(square: ChessSquare): void {
    // Basic move validation - can be expanded
    const index = this.board.indexOf(square);
    const row = Math.floor(index / 8);
    const col = index % 8;

    if (square.piece?.type === 'PAWN') {
      this.highlightPawnMoves(row, col, square.piece.color);
    } else if (square.piece?.type === 'ROOK') {
      this.highlightRookMoves(row, col, square.piece.color);
    } else if (square.piece?.type === 'BISHOP') {
      this.highlightBishopMoves(row, col, square.piece.color);
    } else if (square.piece?.type === 'QUEEN') {
      this.highlightQueenMoves(row, col, square.piece.color);
    } else if (square.piece?.type === 'KING') {
      this.highlightKingMoves(row, col, square.piece.color);
    } else if (square.piece?.type === 'KNIGHT') {
      this.highlightKnightMoves(row, col, square.piece.color);
    }
  }

  private highlightPawnMoves(row: number, col: number, color: string): void {
    const direction = color === 'WHITE' ? -1 : 1; // White moves up (-1), Black moves down (+1)
    const startRow = color === 'WHITE' ? 6 : 1; // White starts at row 6, Black at row 1

    // One square forward
    const oneForward = (row + direction) * 8 + col;
    if (oneForward >= 0 && oneForward < 64 && !this.board[oneForward].piece) {
      this.board[oneForward].isValidMove = true;

      // Two squares forward from starting position
      if (row === startRow) {
        const twoForward = (row + 2 * direction) * 8 + col;
        if (twoForward >= 0 && twoForward < 64 && !this.board[twoForward].piece) {
          this.board[twoForward].isValidMove = true;
        }
      }
    }

    // Diagonal captures
    [-1, 1].forEach(colOffset => {
      const captureIndex = (row + direction) * 8 + (col + colOffset);
      if (captureIndex >= 0 && captureIndex < 64 &&
        col + colOffset >= 0 && col + colOffset < 8) {
        const targetPiece = this.board[captureIndex].piece;
        if (targetPiece && targetPiece.color !== color) {
          this.board[captureIndex].isValidMove = true;
        }
      }
    });
  }

  private highlightRookMoves(row: number, col: number, color: string): void {
    // Horizontal and vertical moves
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    directions.forEach(([dRow, dCol]) => {
      for (let i = 1; i < 8; i++) {
        const newRow = row + dRow * i;
        const newCol = col + dCol * i;
        
        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
        
        const index = newRow * 8 + newCol;
        const targetPiece = this.board[index].piece;
        
        if (!targetPiece) {
          this.board[index].isValidMove = true;
        } else {
          if (targetPiece.color !== color) {
            this.board[index].isValidMove = true;
          }
          break;
        }
      }
    });
  }

  private highlightBishopMoves(row: number, col: number, color: string): void {
    // Diagonal moves
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    directions.forEach(([dRow, dCol]) => {
      for (let i = 1; i < 8; i++) {
        const newRow = row + dRow * i;
        const newCol = col + dCol * i;
        
        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
        
        const index = newRow * 8 + newCol;
        const targetPiece = this.board[index].piece;
        
        if (!targetPiece) {
          this.board[index].isValidMove = true;
        } else {
          if (targetPiece.color !== color) {
            this.board[index].isValidMove = true;
          }
          break;
        }
      }
    });
  }

  private highlightQueenMoves(row: number, col: number, color: string): void {
    // Queen moves like both rook and bishop
    this.highlightRookMoves(row, col, color);
    this.highlightBishopMoves(row, col, color);
  }

  private highlightKingMoves(row: number, col: number, color: string): void {
    // King moves one square in any direction
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    directions.forEach(([dRow, dCol]) => {
      const newRow = row + dRow;
      const newCol = col + dCol;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const index = newRow * 8 + newCol;
        const targetPiece = this.board[index].piece;
        
        if (!targetPiece || targetPiece.color !== color) {
          this.board[index].isValidMove = true;
        }
      }
    });
  }

  private highlightKnightMoves(row: number, col: number, color: string): void {
    // Knight moves in L-shape
    const moves = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
    
    moves.forEach(([dRow, dCol]) => {
      const newRow = row + dRow;
      const newCol = col + dCol;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const index = newRow * 8 + newCol;
        const targetPiece = this.board[index].piece;
        
        if (!targetPiece || targetPiece.color !== color) {
          this.board[index].isValidMove = true;
        }
      }
    });
  }

  private async makeMove(fromSquare: ChessSquare, toSquare: ChessSquare): Promise<void> {
    const moveMessage = {
      gameId: this.gameId,
      from: fromSquare.position,
      to: toSquare.position,
      piece: fromSquare.piece!.type,
      playerColor: this.getPlayerColor(),
      moveNotation: `${fromSquare.piece!.type[0]}${fromSquare.position}-${toSquare.position}`
    };

    try {
      await this.webSocketService.sendMessage('/app/move', moveMessage);
      this.clearSelection();
    } catch (error) {
      this.showMessage('Erreur lors de l\'envoi du mouvement', true);
    }
  }

  private canPlayerMove(): boolean {
    if (!this.game || !this.currentUser) {
      return false;
    }

    const playerColor = this.getPlayerColor();
    const canMove = this.game.currentTurn === playerColor;
    
    return canMove;
  }

  private getPlayerColor(): string {
    if (!this.game || !this.currentUser) {
      return '';
    }

    const isWhitePlayer = this.game.whitePlayer?.username === this.currentUser.username;
    const isBlackPlayer = this.game.blackPlayer?.username === this.currentUser.username;

    if (isWhitePlayer) return 'WHITE';
    if (isBlackPlayer) return 'BLACK';
    
    return '';
  }

  private isPlayerPiece(piece: ChessPiece): boolean {
    return piece.color === this.getPlayerColor();
  }

  private updateGameStatus(): void {
    if (!this.game) return;

    const currentPlayer = this.game.currentTurn === 'WHITE'
      ? this.game.whitePlayer.username
      : this.game.blackPlayer.username;

    this.gameStatus = `Tour de ${currentPlayer} (${this.game.currentTurn === 'WHITE' ? 'Blanc' : 'Noir'})`;
  }

  isWhiteSquare(index: number): boolean {
    const row = Math.floor(index / 8);
    const col = index % 8;
    return (row + col) % 2 === 0;
  }

  goToLobby(): void {
    this.router.navigate(['/lobby']);
  }

  private showMessage(message: string, isError: boolean): void {
    this.message = message;
    this.error = isError;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
}