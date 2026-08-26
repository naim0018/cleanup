export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}
