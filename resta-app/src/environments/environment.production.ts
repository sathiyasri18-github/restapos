export const environment = {
  production: true,
  apiBaseUrl: 'http://103.186.120.73:2027/',
  apiVersion: 'v1',
  appName: 'NT System',
} as const;

export type Environment = typeof environment;
