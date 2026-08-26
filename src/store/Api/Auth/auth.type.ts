export interface LoginPayload {
  email: string;
  password?: string;
}

export interface SignupPayload {
  email: string;
  password?: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
