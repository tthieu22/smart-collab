export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY: '/auth/verify',
  DASHBOARD: '/dashboard',
  PROFILE: '/auth/profile',
  SETTINGS: '/auth/settings',
  GOOGLE_CALLBACK: '/auth/google/callback',
  ADMIN_AI_AUTO_POST: '/admin/ai-auto-post',
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
  PROJECT: {
    CREATE: '/projects',
    UPDATE: '/projects/update',
    DELETE: '/projects/delete',
    AI_BUILD: '/projects/ai-build',
    CARD_AI_GENERATE: '/projects/cards/:cardId/ai-generate',
    ADD_MEMBER: '/projects/add-member',
    REMOVE_MEMBER: '/projects/remove-member',
    UPDATE_MEMBER_ROLE: '/projects/update-member-role',
    FIND_ALL: '/projects/get-all',
    GET: '/projects/get',
    COLUMN: {
      GET :'/projects/column',
      GET_BY_PROJECT: '/projects/columns/project',
      GET_BY_BOARD: '/projects/columns/board',
      UPDATE: '/projects/columns/update',
      DELETE: '/projects/columns/delete',
      
      CARD: {
        GET: '/projects/card',
        PUT: '/projects/card',
      }
    }
  },
  HOME: {
    ADMIN_AUTO_POST_SETTINGS: '/home/admin/auto-post/settings',
    ADMIN_AUTO_POST_RUN_NOW: '/home/admin/auto-post/run-now',
  },
} as const;

export const APP_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AuthNexus',
} as const;

export const UI_CONFIG = {
  CONTAINER: "mx-auto w-full transition-all duration-500",
  PAGE_SPACING: "space-y-4 md:space-y-6 pb-6 md:pb-10",
  MAX_WIDTH: {
    NARROW: "max-w-3xl",
    STANDARD: "max-w-5xl",
    WIDE: "max-w-7xl",
    FULL: "max-w-none"
  },
  GRID: {
    NEWS: {
      1: "flex flex-col gap-4",
      2: "grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6",
      3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6",
    }
  },
  CARD: {
    PADDING: "p-5 md:p-6",
    LIST_PADDING: "p-5 md:p-8",
    RADIUS: "rounded-[32px]",
    BORDER: "border border-gray-100 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5",
    BG: "bg-white/80 dark:bg-neutral-950 backdrop-blur-xl",
    SHADOW: "shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5",
  },
  ANIMATION: {
    FADE_IN: "animate-in fade-in duration-500",
    SLIDE_UP: "animate-in slide-in-from-bottom-4 duration-500",
  },
  PHOTOBOOTH: {
    TITLE: "Smart Photobooth",
    SUBTITLE: "Hệ thống chụp ảnh AI chất lượng cao",
    ACTION_TEXT: "Chạm để bắt đầu",
    STATION: "Station_01",
    LOCATION: "Smart Office"
  }
} as const;
