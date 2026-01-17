import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketSimpleService {
  private client!: Client;
  private connected = new BehaviorSubject<boolean>(false);
  private connectionError = new Subject<any>();
  private destroy$ = new Subject<void>();
  
  public connected$ = this.connected.asObservable();
  public connectionError$ = this.connectionError.asObservable();

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient(): void {
    // Utiliser WebSocket natif au lieu de SockJS
    const wsUrl = this.configService.wsUrl;
    
    this.client = new Client({
      brokerURL: wsUrl,
      
      // Add connection headers with username
      connectHeaders: {},
      
      debug: undefined,
      
      onConnect: (frame) => {
        this.connected.next(true);
      },
      
      onDisconnect: (frame) => {
        this.connected.next(false);
      },
      
      onStompError: (frame) => {
        this.connected.next(false);
        this.connectionError.next(frame);
      },
      
      onWebSocketError: (event) => {
        this.connected.next(false);
        this.connectionError.next(event);
      },
      
      reconnectDelay: this.configService.reconnectDelay,
      heartbeatIncoming: this.configService.heartbeatInterval,
      heartbeatOutgoing: this.configService.heartbeatInterval
    });
  }

  /**
   * Set username for WebSocket authentication
   */
  setUsername(username: string): void {
    this.client.connectHeaders = {
      'username': username
    };
  }

  /**
   * Établit la connexion WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client.connected) {
        resolve();
        return;
      }

      if (this.client.active) {
        // Already connecting, wait for connection
        const connectionSub = this.connected$
          .pipe(
            filter(connected => connected),
            takeUntil(this.destroy$)
          )
          .subscribe(() => {
            connectionSub.unsubscribe();
            resolve();
          });

        // Set timeout for connection
        setTimeout(() => {
          connectionSub.unsubscribe();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        return;
      }

      // Écouter la connexion
      const connectionSub = this.connected$
        .pipe(
          filter(connected => connected),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          connectionSub.unsubscribe();
          resolve();
        });

      // Écouter les erreurs
      const errorSub = this.connectionError$
        .pipe(takeUntil(this.destroy$))
        .subscribe(error => {
          connectionSub.unsubscribe();
          errorSub.unsubscribe();
          reject(error);
        });

      // Set timeout for connection
      setTimeout(() => {
        connectionSub.unsubscribe();
        errorSub.unsubscribe();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      try {
        this.client.activate();
      } catch (error) {
        connectionSub.unsubscribe();
        errorSub.unsubscribe();
        reject(error);
      }
    });
  }

  /**
   * Ferme la connexion WebSocket
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.client.active) {
        resolve();
        return;
      }

      const disconnectionSub = this.connected$
        .pipe(
          filter(connected => !connected),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          disconnectionSub.unsubscribe();
          resolve();
        });

      this.client.deactivate();
    });
  }

  /**
   * Envoie un message via WebSocket
   */
  async sendMessage(destination: string, message: any): Promise<void> {
    // Vérifier la connexion et reconnecter si nécessaire
    if (!this.client.connected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.client.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        this.client.publish({
          destination: destination,
          body: JSON.stringify(message)
        });
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * S'abonne à un topic WebSocket
   */
  subscribe(destination: string): Observable<any> {
    return new Observable(observer => {
      let subscription: any;

      const setupSubscription = () => {
        if (this.client.connected) {
          subscription = this.client.subscribe(destination, (message) => {
            try {
              const parsedMessage = JSON.parse(message.body);
              observer.next(parsedMessage);
            } catch (error) {
              observer.error(error);
            }
          });
        }
      };

      // Si déjà connecté, s'abonner immédiatement
      if (this.client.connected) {
        setupSubscription();
      } else {
        // Attendre la connexion
        const connectSub = this.connected$
          .pipe(
            filter(connected => connected),
            takeUntil(this.destroy$)
          )
          .subscribe(() => {
            setupSubscription();
            connectSub.unsubscribe();
          });
      }

      // Cleanup function
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    });
  }

  /**
   * Vérifie si la connexion est active
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * Force la reconnexion WebSocket
   */
  async forceReconnect(): Promise<void> {
    try {
      await this.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.connect();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Nettoie les ressources
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}