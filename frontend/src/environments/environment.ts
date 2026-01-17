export const environment = {
  production: false,
  name: 'development',
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:8080/websocket', // Use native WebSocket endpoint
  enableDebugLogs: true,
  enableWebSocketDebug: true,
  httpTimeout: 30000,
  reconnectAttempts: 5,
  reconnectDelay: 3000,
  heartbeatInterval: 4000,
  features: {
    enableAnalytics: false,
    enableErrorReporting: false,
    enablePerformanceMonitoring: false
  },
  chess: {
    moveValidation: true,
    allowSpectators: true,
    gameTimeout: 1800000, // 30 minutes
    moveTimeout: 300000    // 5 minutes
  }
};