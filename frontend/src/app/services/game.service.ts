import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, tap, map } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface User {
  id: number;
  username: string;
  isOnline: boolean;
}

export interface Game {
  id: number;
  whitePlayer: User;
  blackPlayer: User;
  status: string;
  currentTurn: string;
  createdAt: string;
  updatedAt: string;
}

export interface Move {
  id: number;
  fromPosition: string;
  toPosition: string;
  pieceType: string;
  playerColor: string;
  moveNumber: number;
  moveNotation: string;
  createdAt: string;
}

export interface GameResponse {
  game: Game;
  moves: Move[];
}

export interface GameState {
  currentGame: Game | null;
  moves: Move[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly apiUrl: string;
  private gameState = new BehaviorSubject<GameState>({
    currentGame: null,
    moves: [],
    isLoading: false,
    error: null
  });

  public gameState$ = this.gameState.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.apiUrl = `${this.configService.apiUrl}/game`;
  }

  /**
   * Récupère la liste des utilisateurs en ligne
   */
  getOnlineUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/online-users`)
      .pipe(
        retry(2),
        catchError(this.handleError),
        tap(() => this.log('Fetched online users'))
      );
  }

  /**
   * Récupère une partie par son ID
   */
  getGame(gameId: number): Observable<GameResponse> {
    this.updateGameState({ isLoading: true, error: null });

    return this.http.get<GameResponse>(`${this.apiUrl}/${gameId}`)
      .pipe(
        retry(2),
        catchError(this.handleError),
        tap(response => {
          this.updateGameState({
            currentGame: response.game,
            moves: response.moves,
            isLoading: false
          });
          this.log(`Fetched game ${gameId}`);
        })
      );
  }

  /**
   * Récupère les mouvements d'une partie
   */
  getGameMoves(gameId: number): Observable<Move[]> {
    return this.http.get<Move[]>(`${this.apiUrl}/${gameId}/moves`)
      .pipe(
        retry(2),
        catchError(this.handleError),
        tap(moves => {
          this.updateGameState({ moves });
          this.log(`Fetched ${moves.length} moves for game ${gameId}`);
        })
      );
  }

  /**
   * Récupère la partie active d'un utilisateur
   */
  getActiveGame(username: string): Observable<GameResponse> {
    return this.http.get<GameResponse>(`${this.apiUrl}/active/${username}`)
      .pipe(
        retry(2),
        catchError(this.handleError),
        tap(response => {
          if (response.game) {
            this.updateGameState({
              currentGame: response.game,
              moves: response.moves
            });
            this.log(`Fetched active game for ${username}`);
          }
        })
      );
  }

  /**
   * Met à jour l'état du jeu local
   */
  updateGameState(updates: Partial<GameState>): void {
    const currentState = this.gameState.value;
    this.gameState.next({ ...currentState, ...updates });
  }

  /**
   * Ajoute un mouvement à l'état local
   */
  addMove(move: Move): void {
    const currentState = this.gameState.value;
    const updatedMoves = [...currentState.moves, move];
    this.updateGameState({ moves: updatedMoves });
  }

  /**
   * Met à jour le tour actuel
   */
  updateCurrentTurn(turn: string): void {
    const currentState = this.gameState.value;
    if (currentState.currentGame) {
      const updatedGame = { ...currentState.currentGame, currentTurn: turn };
      this.updateGameState({ currentGame: updatedGame });
    }
  }

  /**
   * Réinitialise l'état du jeu
   */
  resetGameState(): void {
    this.gameState.next({
      currentGame: null,
      moves: [],
      isLoading: false,
      error: null
    });
  }

  /**
   * Obtient l'état actuel du jeu
   */
  getCurrentGameState(): GameState {
    return this.gameState.value;
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur inconnue s\'est produite';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        case 0:
          errorMessage = 'Impossible de contacter le serveur';
          break;
        default:
          errorMessage = error.error?.message || `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    this.updateGameState({ error: errorMessage, isLoading: false });
    console.error('GameService Error:', errorMessage, error);
    
    return throwError(() => new Error(errorMessage));
  };

  /**
   * Logging conditionnel basé sur la configuration
   */
  private log(message: string): void {
    if (this.configService.enableDebugLogs) {
      console.log(`GameService: ${message}`);
    }
  }
}