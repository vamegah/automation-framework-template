import 'dotenv/config';

/**
 * Environment Variable Helpers
 *
 * This module provides typed, validated access to environment variables.
 * It centralizes all env var access so you have one place to:
 *   - Define default values
 *   - Add validation
 *   - See all required configuration at a glance
 *
 * Setup:
 *   1. Copy .env.example to .env
 *   2. Fill in your environment-specific values
 *   3. Import these helpers in your tests/pages instead of reading process.env directly
 *
 * @example
 *   import { getBaseUrl, getApiBaseUrl } from '../utils/env';
 *
 *   const url = getBaseUrl();  // Returns BASE_URL or the default
 */

/**
 * Log a warning when an expected environment variable is not set.
 * This helps catch configuration issues early without failing the build.
 *
 * @param varName - The name of the missing environment variable
 * @param defaultValue - The fallback value being used
 */
function warnIfMissing(varName: string, defaultValue: string): void {
  if (!process.env[varName]) {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] WARNING: ${varName} is not set. Using default: "${defaultValue}". ` +
      `Copy .env.example to .env and set your values.`
    );
  }
}

/**
 * Get the base URL for UI tests.
 *
 * Reads from the BASE_URL environment variable.
 * Falls back to 'https://example.com' if not set.
 *
 * @returns The base URL string
 *
 * @example
 *   const baseUrl = getBaseUrl();
 *   // Returns: 'https://your-app.com' (from .env) or 'https://example.com' (default)
 */
export function getBaseUrl(): string {
  const defaultValue = 'https://parabank.parasoft.com/parabank/index.htm';
  warnIfMissing('BASE_URL', defaultValue);
  return process.env.BASE_URL || defaultValue;
}

/**
 * Get the base URL for API tests.
 *
 * Reads from the API_BASE_URL environment variable.
 * Falls back to 'https://api.example.com' if not set.
 *
 * @returns The API base URL string
 *
 * @example
 *   const apiUrl = getApiBaseUrl();
 *   // Returns: 'https://api.your-app.com' (from .env) or 'https://api.example.com' (default)
 */
export function getApiBaseUrl(): string {
  const defaultValue = 'https://parabank.parasoft.com/parabank/services/bank';
  warnIfMissing('API_BASE_URL', defaultValue);
  return process.env.API_BASE_URL || defaultValue;
}

/**
 * Get any environment variable with a typed default.
 *
 * A generic helper for reading environment variables that are not
 * covered by the specific functions above. Add new specific functions
 * (like getBaseUrl) for frequently used variables.
 *
 * @param name - The environment variable name
 * @param defaultValue - The fallback value if the variable is not set
 * @returns The environment variable value or the default
 *
 * @example
 *   const timeout = getEnvVar('TEST_TIMEOUT', '30000');
 *   const apiKey = getEnvVar('API_KEY', '');
 */
export function getEnvVar(name: string, defaultValue: string = ''): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (defaultValue === '') {
      // eslint-disable-next-line no-console
      console.warn(`[env] WARNING: ${name} is not set and no default provided.`);
    }
    return defaultValue;
  }
  return value;
}

/**
 * Check if the current environment is CI.
 *
 * Most CI systems set the CI environment variable to 'true'.
 *
 * @returns true if running in a CI environment
 *
 * @example
 *   if (isCI()) {
 *     // Skip interactive prompts, use headless mode, etc.
 *   }
 */
export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.CI === '1';
}

/**
 * Validate that all required environment variables are set.
 *
 * Call this at the start of your test suite to fail fast if
 * configuration is missing. Add variable names to the array
 * as your project grows.
 *
 * @param requiredVars - Array of environment variable names to check
 * @throws Error if any required variables are missing
 *
 * @example
 *   validateRequiredEnvVars(['BASE_URL', 'API_KEY']);
 */
export function validateRequiredEnvVars(requiredVars: string[]): void {
  const missing = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName]!.trim() === ''
  );

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variables: ${missing.join(', ')}. ` +
      `Please check your .env file.`
    );
  }
}
