import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { GameService } from '../../services/game.service';
import { WebSocketSimpleService } from '../../services/websocket-simple.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-lobby.component.html',
  styleUrls: ['./game-lobby.component.scss']
})
export class GameLobbyComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  onlineUsers: any[] = [];
  pendingInvites: any[] = [];
  activeGame: any = null;
  message = '';
  error = false;
  showInvitations = false; // Pour contrôler l'affichage des invitations

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    public webSocketService: WebSocketSimpleService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.connectWebSocket();
    this.loadOnlineUsers();
    this.checkActiveGame();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.webSocketService.disconnect();
  }

  private async connectWebSocket(): Promise<void> {
    try {
      // Set username for WebSocket authentication
      if (this.currentUser) {
        this.webSocketService.setUsername(this.currentUser.username);
      }

      await this.webSocketService.connect();

      // Subscribe to invitations (both user queue and topic)
      const inviteSub = this.webSocketService.subscribe(`/user/queue/invites`)
        .subscribe({
          next: (message) => {
            if (message && message.type === 'INVITE') {
              this.pendingInvites.push(message);
              this.showInvitations = true; // Ouvrir automatiquement les invitations
              this.showMessage(`${message.from} vous invite à jouer!`, false);
            } else if (message && message.type === 'DECLINE') {
              this.showMessage(`${message.from} a refusé votre invitation`, true);
            }
          },
          error: () => {
            // Handle error silently
          }
        });

      // Also subscribe to topic-based invitations
      const topicPath = `/topic/invites/${this.currentUser?.username}`;
      const topicInviteSub = this.webSocketService.subscribe(topicPath)
        .subscribe({
          next: (message) => {
            if (message && message.type === 'INVITE') {
              // Check if we already have this invite to avoid duplicates
              const existingInvite = this.pendingInvites.find(invite =>
                invite.from === message.from && invite.to === message.to
              );
              if (!existingInvite) {
                this.pendingInvites.push(message);
                this.showInvitations = true; // Ouvrir automatiquement les invitations
                this.showMessage(`${message.from} vous invite à jouer! (topic)`, false);
              }
            } else if (message && message.type === 'DECLINE') {
              this.showMessage(`${message.from} a refusé votre invitation (topic)`, true);
            }
          },
          error: () => {
            // Handle error silently
          }
        });

      // Subscribe to game events (both user queue and topic)
      const gameSub = this.webSocketService.subscribe(`/user/queue/game`)
        .subscribe({
          next: (message) => {
            if (message && message.type === 'GAME_START') {
              this.router.navigate(['/game', message.gameId]);
            }
          },
          error: () => {
            // Handle error silently
          }
        });

      // Also subscribe to topic-based game events
      const gameTopicPath = `/topic/game/${this.currentUser?.username}`;
      const gameTopicSub = this.webSocketService.subscribe(gameTopicPath)
        .subscribe({
          next: (message) => {
            if (message && message.type === 'GAME_START') {
              this.router.navigate(['/game', message.gameId]);
            }
          },
          error: () => {
            // Handle error silently
          }
        });

      // Subscribe to user online/offline notifications
      const usersSub = this.webSocketService.subscribe('/topic/users')
        .subscribe({
          next: (message) => {
            if (message && (message.type === 'USER_ONLINE' || message.type === 'USER_OFFLINE')) {
              // Mettre à jour la liste des utilisateurs en ligne
              if (message.data && Array.isArray(message.data)) {
                this.onlineUsers = message.data;
              }

              // Afficher une notification
              if (message.type === 'USER_ONLINE') {
                this.showMessage(`${message.content} s'est connecté`, false);
              } else {
                this.showMessage(`${message.content} s'est déconnecté`, false);
              }
            }
          },
          error: () => {
            // Handle error silently
          }
        });

      this.subscriptions.push(inviteSub, topicInviteSub, gameSub, gameTopicSub, usersSub);

    } catch (error) {
      this.showMessage('Erreur de connexion WebSocket. Rechargez la page.', true);
    }
  }

  private loadOnlineUsers(): void {
    this.gameService.getOnlineUsers().subscribe({
      next: (users) => {
        this.onlineUsers = users;
      },
      error: () => {
        this.showMessage('Erreur lors du chargement des utilisateurs', true);
      }
    });
  }

  private checkActiveGame(): void {
    if (this.currentUser) {
      this.gameService.getActiveGame(this.currentUser.username).subscribe({
        next: (response) => {
          this.activeGame = response.game;
        },
        error: () => {
          // Handle error silently
        }
      });
    }
  }

  async invitePlayer(username: string): Promise<void> {
    if (!this.webSocketService.isConnected()) {
      this.showMessage('Connexion WebSocket en cours... Veuillez réessayer dans quelques secondes.', true);

      // Essayer de reconnecter
      try {
        await this.webSocketService.connect();
      } catch (error) {
        return;
      }
    }

    const invite = {
      type: 'INVITE',
      from: this.currentUser?.username,
      to: username,
      content: 'Invitation à jouer aux échecs'
    };

    try {
      await this.webSocketService.sendMessage('/app/invite', invite);
      this.showMessage(`Invitation envoyée à ${username}`, false);
    } catch (error) {
      this.showMessage('Erreur lors de l\'envoi de l\'invitation', true);
    }
  }

  async acceptInvite(invite: any): Promise<void> {
    const response = {
      type: 'ACCEPT',
      from: invite.from,
      to: this.currentUser?.username
    };

    try {
      await this.webSocketService.sendMessage('/app/invite-response', response);
      this.pendingInvites = this.pendingInvites.filter(i => i !== invite);
    } catch (error) {
      this.showMessage('Erreur lors de l\'acceptation de l\'invitation', true);
    }
  }

  async declineInvite(invite: any): Promise<void> {
    const response = {
      type: 'DECLINE',
      from: invite.from,
      to: this.currentUser?.username
    };

    try {
      await this.webSocketService.sendMessage('/app/invite-response', response);
      this.pendingInvites = this.pendingInvites.filter(i => i !== invite);
    } catch (error) {
      this.showMessage('Erreur lors du refus de l\'invitation', true);
    }
  }

  resumeGame(): void {
    if (this.activeGame) {
      this.router.navigate(['/game', this.activeGame.id]);
    }
  }

  getOpponentName(): string {
    if (!this.activeGame || !this.currentUser) return '';

    return this.activeGame.whitePlayer.username === this.currentUser.username
      ? this.activeGame.blackPlayer.username
      : this.activeGame.whitePlayer.username;
  }

  toggleInvitations(): void {
    this.showInvitations = !this.showInvitations;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.authService.clearCurrentUser();
      this.router.navigate(['/login']);
    });
  }

  private showMessage(message: string, isError: boolean): void {
    this.message = message;
    this.error = isError;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}