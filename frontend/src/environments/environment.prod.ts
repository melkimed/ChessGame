export const environment = {
  production: true,
  name: 'production',
  apiUrl: `${window.location.protocol}//${window.location.host}/api`,
  wsUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/websocket`,
  enableDebugLogs: false,
  enableWebSocketDebug: false,
  httpTimeout: 15000,
  reconnectAttempts: 3,
  reconnectDelay: 5000,
  heartbeatInterval: 10000,
  features: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true
  },
  chess: {
    moveValidation: true,
    allowSpectators: true,
    gameTimeout: 3600000, // 60 minutes
    moveTimeout: 600000   // 10 minutes
  }
};