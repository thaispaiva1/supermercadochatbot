import { UserSession, UserRole } from '../types/inventory.ts';

const SESSION_KEY = 'super_estoque_session_v2';

export interface PredefinedAccount {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  storeName: string;
}

// Contas do sistema: Gestor (acesso geral) e Operador (exclusivo caixa PDV)
export const SYSTEM_ACCOUNTS: PredefinedAccount[] = [
  {
    email: 'gestor@supermercado.com.br',
    password: 'gestor123',
    name: 'Gestor Geral',
    role: 'gerente',
    storeName: 'Supermercado Central',
  },
  {
    email: 'supervisor@supermercado.com.br',
    password: 'supervisor123',
    name: 'Gestor de Operações',
    role: 'gerente',
    storeName: 'Supermercado Central',
  },
  {
    email: 'operador@supermercado.com.br',
    password: 'caixa123',
    name: 'Operador de Caixa 01',
    role: 'operador',
    storeName: 'Supermercado Central',
  },
  {
    email: 'caixa@supermercado.com.br',
    password: 'caixa123',
    name: 'Operador de Caixa 01',
    role: 'operador',
    storeName: 'Supermercado Central',
  },
];

export class AuthService {
  static getCurrentUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(SESSION_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data) as UserSession;

      // Verificar se o usuário pertence a uma conta válida
      const isValid = SYSTEM_ACCOUNTS.some(
        (acc) => acc.email.toLowerCase() === parsed.email.toLowerCase()
      );

      if (!isValid) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  static login(email: string, pass: string): { success: boolean; session?: UserSession; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Localizar conta autorizada
    const account = SYSTEM_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === cleanEmail
    );

    if (!account) {
      return {
        success: false,
        error: 'E-mail não autorizado para acesso ao sistema.',
      };
    }

    // Validar senha
    if (cleanPass !== account.password) {
      return {
        success: false,
        error: 'Senha incorreta para esta conta.',
      };
    }

    const session: UserSession = {
      id: `user-${account.role}-${Date.now()}`,
      name: account.name,
      email: account.email,
      role: account.role,
      storeName: account.storeName,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return { success: true, session };
  }

  static logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
  }
}
