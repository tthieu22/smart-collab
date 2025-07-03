// App constants
export const APP_NAME = "AuthNexus";
export const APP_VERSION = "1.0.0";

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  DASHBOARD: "/dashboard",
  CALLBACK: "/auth/callback",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    GOOGLE: "/auth/google",
    ME: "/auth/me",
    VERIFY_EMAIL: "/auth/verify-email",
    REFRESH: "/auth/refresh",
  },
  USERS: {
    PROFILE: "/users/profile",
    UPDATE: "/users/update",
    AVATAR: "/users/avatar",
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  THEME: "theme",
  LANGUAGE: "language",
} as const;

// Validation rules
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  EMAIL: {
    MAX_LENGTH: 254,
  },
} as const;

// UI constants
export const UI = {
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    "2XL": 1536,
  },
  COLORS: {
    PRIMARY: "#1677ff",
    SUCCESS: "#52c41a",
    WARNING: "#faad14",
    ERROR: "#ff4d4f",
    INFO: "#1890ff",
  },
  SPACING: {
    XS: "4px",
    SM: "8px",
    MD: "16px",
    LG: "24px",
    XL: "32px",
    "2XL": "48px",
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng thử lại.",
  UNAUTHORIZED: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.",
  FORBIDDEN: "Bạn không có quyền truy cập vào tài nguyên này.",
  NOT_FOUND: "Không tìm thấy tài nguyên yêu cầu.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  SERVER_ERROR: "Lỗi máy chủ. Vui lòng thử lại sau.",
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Đăng nhập thành công!",
  REGISTER_SUCCESS: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
  LOGOUT_SUCCESS: "Đăng xuất thành công!",
  UPDATE_SUCCESS: "Cập nhật thành công!",
  DELETE_SUCCESS: "Xóa thành công!",
  EMAIL_VERIFIED: "Email đã được xác thực thành công!",
} as const;
