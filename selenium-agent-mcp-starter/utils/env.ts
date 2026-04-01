import 'dotenv/config';

export function getEnvVar(name: string, defaultValue = ''): string {
  return process.env[name] ?? defaultValue;
}

export function getBaseUrl(): string {
  return getEnvVar('BASE_URL', 'https://www.saucedemo.com/');
}

export function isHeadless(): boolean {
  return getEnvVar('HEADLESS', 'true') === 'true';
}

export function getSauceDemoUsername(): string {
  return getEnvVar('SAUCEDEMO_USERNAME', 'standard_user');
}

export function getSauceDemoPassword(): string {
  return getEnvVar('SAUCEDEMO_PASSWORD', 'secret_sauce');
}
