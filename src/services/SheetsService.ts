// services/SheetsService.ts
import { SPREADSHEET_CONFIG } from '@/config';
import { User, UserRole } from '@/Types/User';

interface SheetRow {
  [key: string]: string;
}

class SheetsService {
  private static instance: SheetsService;
  private apiKey: string = ''; // Será configurado via método init()
  
  private constructor() {}

  static getInstance(): SheetsService {
    if (!SheetsService.instance) {
      SheetsService.instance = new SheetsService();
    }
    return SheetsService.instance;
  }

  /**
   * Inicializa o serviço com a API Key
   * Em produção, use process.env.REACT_APP_GOOGLE_SHEETS_API_KEY
   */
  init(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Busca todas as linhas da planilha de usuários
   */
  private async fetchSheetData(): Promise<string[][]> {
    if (!this.apiKey) {
      throw new Error('API Key não configurada. Execute init() primeiro.');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_CONFIG.SPREADSHEET_ID}/values/${SPREADSHEET_CONFIG.USERS_SHEET_NAME}?key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.statusText}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Erro ao conectar com Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Converte uma linha da planilha em objeto User
   */
  private rowToUser(row: string[]): User | null {
    const { COLUMNS } = SPREADSHEET_CONFIG;

    // Verifica se a linha tem dados mínimos
    if (row.length < 4) return null;

    const id = row[COLUMNS.ID] || '';
    const nome = row[COLUMNS.NOME] || '';
    const email = row[COLUMNS.EMAIL] || '';
    const funcao = (row[COLUMNS.FUNCAO] || 'user').toLowerCase() as UserRole;
    const expiracao = row[COLUMNS.EXPIRACAO] || '';
    const telefone = row[COLUMNS.TELEFONE] || '';

    // Valida campos obrigatórios
    if (!id || !email || !nome) return null;

    return {
      id,
      nome,
      email,
      funcao,
      expiracao,
      telefone,
    };
  }

  /**
   * Verifica se a conta do usuário está expirada
   */
  private isAccountExpired(expirationDate: string): boolean {
    if (!expirationDate) return false;

    try {
      const expDate = new Date(expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas a data
      
      return expDate < today;
    } catch {
      return false;
    }
  }

  /**
   * Autentica um usuário verificando email e senha na planilha
   * Retorna os dados do usuário se autenticado com sucesso
   */
  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      const rows = await this.fetchSheetData();
      
      // Pula a primeira linha (cabeçalho)
      for (const row of rows.slice(1)) {
        const { COLUMNS } = SPREADSHEET_CONFIG;
        
        const rowEmail = row[COLUMNS.EMAIL];
        const rowPassword = row[COLUMNS.SENHA];

        // Verifica se email e senha correspondem
        if (rowEmail === email && rowPassword === password) {
          const user = this.rowToUser(row);
          
          if (!user) return null;

          // Verifica se a conta está expirada
          if (this.isAccountExpired(user.expiracao)) {
            throw new Error('Sua conta expirou. Entre em contato com o administrador.');
          }

          return user;
        }
      }

      return null; // Usuário não encontrado
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw error;
    }
  }

  /**
   * Busca usuário pelo email (sem validação de senha)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const rows = await this.fetchSheetData();
      
      for (const row of rows.slice(1)) {
        const { COLUMNS } = SPREADSHEET_CONFIG;
        
        if (row[COLUMNS.EMAIL] === email) {
          return this.rowToUser(row);
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  /**
   * Lista todos os usuários (apenas para admin)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const rows = await this.fetchSheetData();
      const users: User[] = [];

      for (const row of rows.slice(1)) {
        const user = this.rowToUser(row);
        if (user) users.push(user);
      }

      return users;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return [];
    }
  }
}

export default SheetsService.getInstance();