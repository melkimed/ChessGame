import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  production: boolean;
  name: string;
  enableDebugLogs: boolean;
  enableWebSocketDebug: boolean;
  httpTimeout: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  features: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
  };
  chess: {
    moveValidation: boolean;
    allowSpectators: boolean;
    gameTimeout: number;
    moveTimeout: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = { ...environment };
    this.logEnvironmentInfo();
  }

  private logEnvironmentInfo(): void {
    if (this.config.enableDebugLogs) {
      console.log(`🚀 Chess App started in ${this.config.name} mode`);
      console.log('📋 Configuration:', {
        apiUrl: this.config.apiUrl,
        wsUrl: this.config.wsUrl,
        production: this.config.production,
        features: this.config.features
      });
    }
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get wsUrl(): string {
    return this.config.wsUrl;
  }

  get isProduction(): boolean {
    return this.config.production;
  }

  get environmentName(): string {
    return this.config.name;
  }

  get enableDebugLogs(): boolean {
    return this.config.enableDebugLogs;
  }

  get enableWebSocketDebug(): boolean {
    return this.config.enableWebSocketDebug;
  }

  get httpTimeout(): number {
    return this.config.httpTimeout;
  }

  get reconnectAttempts(): number {
    return this.config.reconnectAttempts;
  }

  get reconnectDelay(): number {
    return this.config.reconnectDelay;
  }

  get heartbeatInterval(): number {
    return this.config.heartbeatInterval;
  }

  get features() {
    return { ...this.config.features };
  }

  get chessConfig() {
    return { ...this.config.chess };
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Vérifie si une fonctionnalité est activée
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Obtient une configuration spécifique aux échecs
   */
  getChessConfig<K extends keyof AppConfig['chess']>(key: K): AppConfig['chess'][K] {
    return this.config.chess[key];
  }

  /**
   * Détermine si on est en mode développement
   */
  isDevelopment(): boolean {
    return this.config.name === 'development';
  }

  /**
   * Détermine si on est en mode test
   */
  isTest(): boolean {
    return this.config.name === 'test';
  }

  /**
   * Détermine si on est en mode staging
   */
  isStaging(): boolean {
    return this.config.name === 'staging';
  }
}