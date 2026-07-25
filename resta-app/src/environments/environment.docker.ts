export const environment = {
  production: true,
  /** Public API host (Caddy → localhost:8081). Must be https when the app is served over https. */
  apiBaseUrl: 'https://api.muruenterprises.info',
  apiVersion: 'v1',
  appName: 'Resta POS',
} as const;

export type Environment = typeof environment;
