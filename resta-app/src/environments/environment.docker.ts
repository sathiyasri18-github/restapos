export const environment = {
  production: true,
  /** Direct API port mapped in docker-compose (API_PORT, default 8081). */
  apiBaseUrl: 'http://localhost:8081',
  apiVersion: 'v1',
  appName: 'Resta POS',
} as const;

export type Environment = typeof environment;
