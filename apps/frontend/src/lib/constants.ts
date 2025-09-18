export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY: '/auth/verify',
  DASHBOARD: '/dashboard',
  PROFILE: '/auth/profile',
  SETTINGS: '/auth/settings',
  GOOGLE_CALLBACK: '/auth/google/callback',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    ME: '/auth/me',
    GOOGLE: '/auth/google',
    GOOGLE_REDIRECT: '/auth/google/redirect',
    OAUTH_EXCHANGE: '/auth/oauth/exchange',
    VERIFY_EMAIL: '/auth/verify-email',
    VALIDATE_USER: '/auth/validate-user',
    REGISTER: '/auth/register',
  },
  USER: {
    CREATE: '/users',
    FIND_ALL: '/users',
    GET_ME: '/users/me',
    UPDATE_ME: '/users/me',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    RESEND_VERIFICATION: '/users/resend-verification-code',
    VERIFY_EMAIL: '/users/verify-email',
    CHANGE_PASSWORD: '/users/me/change-password',
  },
} as const;

export const APP_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AuthNexus',
} as const;
