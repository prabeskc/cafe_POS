export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  admin?: {
    id: string;
    username: string;
    last_login?: string;
  };
  message?: string;
}

export interface JWTPayload {
  adminId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
  };
}