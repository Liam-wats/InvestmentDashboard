import { User, LoginData } from "@shared/schema";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const AUTH_STORAGE_KEY = "investwise_auth";

export function getStoredAuth(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user,
        isAuthenticated: !!parsed.user,
      };
    }
  } catch (error) {
    console.error("Error parsing stored auth:", error);
  }
  
  return {
    user: null,
    isAuthenticated: false,
  };
}

export function setStoredAuth(user: User | null): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
  } catch (error) {
    console.error("Error storing auth:", error);
  }
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function simulateLogin(credentials: LoginData): Promise<User> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For demo purposes, create a user from email
  const user: User = {
    id: 1,
    email: credentials.email,
    name: credentials.email.split('@')[0].charAt(0).toUpperCase() + credentials.email.split('@')[0].slice(1),
    password: "", // Don't store password in client
    createdAt: new Date(),
  };
  
  return user;
}
