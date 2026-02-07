// types/User.ts
export type UserRole = "admin" | "user";

export interface User {
  id: string;
  nome: string;
  email: string;
  funcao: UserRole;
  expiracao: string; // Data no formato ISO ou string da planilha
  telefone: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isExpired: boolean;
}