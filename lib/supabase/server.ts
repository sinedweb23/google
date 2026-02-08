/**
 * Cliente Supabase para Server-Side
 * 
 * Usa service role key para acesso total ao banco
 * NUNCA exponha esta key no frontend
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
}

/**
 * Cliente Supabase com service role (acesso total)
 * Usado apenas no backend
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Tipos TypeScript para as tabelas
 */
export interface Responsavel {
  id: string;
  nome: string;
  cpf_hash: string;
  email: string | null;
  celular: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Aluno {
  id: string;
  nome: string;
  prontuario: string;
  email_google: string;
  status: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ResponsavelAluno {
  id: string;
  responsavel_id: string;
  aluno_id: string;
  tipo: 'financeiro' | 'pedagogico' | 'ambos';
  criado_em: string;
}

export interface PasswordResetLog {
  id: string;
  aluno_id: string;
  responsavel_id: string;
  ip: string | null;
  user_agent: string | null;
  status: 'pendente' | 'sucesso' | 'falha';
  erro_mensagem: string | null;
  criado_em: string;
}

export interface OTPCode {
  id: string;
  responsavel_id: string;
  aluno_id: string;
  codigo: string;
  tipo_envio: 'email' | 'sms';
  usado: boolean;
  expira_em: string;
  criado_em: string;
}

export interface RateLimit {
  id: string;
  identificador: string;
  tipo: 'cpf' | 'ip';
  tentativas: number;
  bloqueado_ate: string | null;
  criado_em: string;
  atualizado_em: string;
}
