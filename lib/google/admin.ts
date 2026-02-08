/**
 * Integração com Google Admin SDK
 * 
 * Usa Service Account com Domain-Wide Delegation
 * para resetar senhas de usuários do Google Workspace
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

/**
 * Configuração do Google Admin SDK
 */
interface GoogleAdminConfig {
  serviceAccountEmail: string;
  privateKey: string;
  adminEmail: string; // Email do admin do domínio para impersonation
  domain: string; // Domínio do Google Workspace
}

let adminClient: any = null;

/**
 * Inicializa cliente do Google Admin SDK
 */
function getAdminClient(): JWT {
  if (adminClient) {
    return adminClient;
  }

  const config: GoogleAdminConfig = {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    adminEmail: process.env.GOOGLE_ADMIN_EMAIL || '',
    domain: process.env.GOOGLE_DOMAIN || '',
  };

  // Validação das variáveis de ambiente
  if (!config.serviceAccountEmail || !config.privateKey || !config.adminEmail || !config.domain) {
    throw new Error('Variáveis de ambiente do Google Admin SDK não configuradas corretamente');
  }

  // Cria cliente JWT com Domain-Wide Delegation
  adminClient = new JWT({
    email: config.serviceAccountEmail,
    key: config.privateKey,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user',
    ],
    subject: config.adminEmail, // Impersonation do admin do domínio
  });

  return adminClient;
}

/**
 * Reseta a senha de um usuário no Google Workspace
 * 
 * @param userEmail Email do usuário (aluno)
 * @param novaSenha Nova senha temporária
 * @param forcarTroca Se true, força troca de senha no próximo login
 * @returns Promise com resultado da operação
 */
export async function resetarSenhaGoogle(
  userEmail: string,
  novaSenha: string,
  forcarTroca: boolean = true
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const auth = getAdminClient();
    const admin = google.admin({ version: 'directory_v1', auth });

    // Atualiza a senha do usuário
    await admin.users.update({
      userKey: userEmail,
      requestBody: {
        password: novaSenha,
        changePasswordAtNextLogin: forcarTroca,
      },
    });

    return { sucesso: true };
  } catch (error: any) {
    console.error('Erro ao resetar senha no Google:', error);
    
    // Trata erros específicos do Google API
    let mensagemErro = 'Erro desconhecido ao resetar senha';
    
    if (error.code === 404) {
      mensagemErro = 'Usuário não encontrado no Google Workspace';
    } else if (error.code === 403) {
      mensagemErro = 'Sem permissão para resetar senha (verifique Domain-Wide Delegation)';
    } else if (error.message) {
      mensagemErro = error.message;
    }

    return {
      sucesso: false,
      erro: mensagemErro,
    };
  }
}

/**
 * Verifica se um usuário existe no Google Workspace
 * 
 * @param userEmail Email do usuário
 * @returns Promise com informações do usuário ou null se não existir
 */
export async function verificarUsuarioGoogle(
  userEmail: string
): Promise<{ existe: boolean; dados?: any; erro?: string }> {
  try {
    const auth = getAdminClient();
    const admin = google.admin({ version: 'directory_v1', auth });

    const response = await admin.users.get({
      userKey: userEmail,
    });

    return {
      existe: true,
      dados: response.data,
    };
  } catch (error: any) {
    if (error.code === 404) {
      return { existe: false };
    }

    return {
      existe: false,
      erro: error.message || 'Erro ao verificar usuário',
    };
  }
}

/**
 * Lista usuários do domínio (útil para testes/debug)
 * 
 * @param maxResults Número máximo de resultados
 * @returns Promise com lista de usuários
 */
export async function listarUsuariosGoogle(
  maxResults: number = 10
): Promise<{ usuarios: any[]; erro?: string }> {
  try {
    const auth = getAdminClient();
    const admin = google.admin({ version: 'directory_v1', auth });

    const response = await admin.users.list({
      domain: process.env.GOOGLE_DOMAIN,
      maxResults,
    });

    return {
      usuarios: response.data.users || [],
    };
  } catch (error: any) {
    return {
      usuarios: [],
      erro: error.message || 'Erro ao listar usuários',
    };
  }
}
