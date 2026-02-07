// config.ts
// Configurações da aplicação

// IMPORTANTE: Em produção, mova estas informações para variáveis de ambiente (.env)
// e adicione o arquivo .env ao .gitignore

export const SPREADSHEET_CONFIG = {
  // Substitua pelo ID da sua planilha do Google Sheets
  // O ID está na URL: https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit
  SPREADSHEET_ID: '1FES3MkkPe3zxURCD7U0Fpnh8pIGe-HeI1jB251-KDLw',
  
  // Nome da aba/worksheet que contém os dados de usuários
  USERS_SHEET_NAME: 'usuarios',
  
  // Mapeamento das colunas (índice baseado em 0)
  COLUMNS: {
    ID: 0,
    NOME: 1,
    EMAIL: 2,
    SENHA: 3,
    FUNCAO: 4,
    EXPIRACAO: 5,
    TELEFONE: 6,
  }
};

// Para usar variáveis de ambiente (recomendado em produção):
// export const SPREADSHEET_CONFIG = {
//   SPREADSHEET_ID: process.env.REACT_APP_SPREADSHEET_ID || '',
//   USERS_SHEET_NAME: process.env.REACT_APP_USERS_SHEET_NAME || 'usuarios',
// };