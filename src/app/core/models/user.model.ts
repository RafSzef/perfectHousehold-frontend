export interface UserPreferences {
  darkMode: boolean;
  palette: 'sage' | 'olive' | 'eucalyptus' | 'matcha' | 'pine' | 'custom';
  customHue?: number;
  customSaturation?: number;
  customHarmony?: 'complementary' | 'analogous' | 'split' | 'triadic' | 'monochrome';
  darkTint?: 'organic' | 'neutral' | 'oled';
  tableDensity?: 'spacious' | 'compact';
}

export interface User {
  id?: number;
  username: string;
  email?: string;
  role: 'ROLE_ADMIN' | 'ROLE_USER' | string;
  enabled?: boolean;
  password?: string;
  passwordHash?: string; // used by backend User entity
  preferences?: UserPreferences;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType?: string;
  token?: string; // fallback
}
