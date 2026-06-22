export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:51269',
  apiVersion: 'v1',
  appName: 'NT System',
} as const;

export type Environment = typeof environment;
