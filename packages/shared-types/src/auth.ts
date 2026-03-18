export enum UserRole {
  SUPER_ADMIN = "super_admin",
  SITE_MANAGER = "site_manager",
  TECHNICIAN = "technician",
  SOCIETY_ADMIN = "society_admin",
  RESIDENT = "resident",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  siteIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface InvitePayload {
  email: string;
  name: string;
  role: UserRole;
  siteId: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  siteIds: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, "createdAt">;
}
