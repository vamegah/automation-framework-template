// This file is imported to load .env variables (already loaded in config)
// You can add helper functions if needed
export const getEnv = (key: string, defaultValue?: string): string => {
  return process.env[key] || defaultValue || '';
};