/**
 * Utilitário de Rate Limiting
 * 
 * Controla tentativas por CPF e IP para prevenir abuso
 */

import { supabaseAdmin, RateLimit } from '../supabase/server';

interface RateLimitConfig {
  maxTentativas: number;
  janelaMinutos: number;
  bloqueioMinutos: number;
}

const CONFIG: RateLimitConfig = {
  maxTentativas: 5, // Máximo de tentativas
  janelaMinutos: 15, // Janela de tempo (15 minutos)
  bloqueioMinutos: 60, // Bloqueio após exceder (1 hora)
};

/**
 * Verifica se um identificador (CPF ou IP) está bloqueado
 */
export async function verificarBloqueio(
  identificador: string,
  tipo: 'cpf' | 'ip'
): Promise<{ bloqueado: boolean; bloqueadoAte?: Date; tentativas: number }> {
  const { data, error } = await supabaseAdmin
    .from('rate_limits')
    .select('*')
    .eq('identificador', identificador)
    .eq('tipo', tipo)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = não encontrado (OK)
    console.error('Erro ao verificar bloqueio:', error);
    return { bloqueado: false, tentativas: 0 };
  }

  if (!data) {
    return { bloqueado: false, tentativas: 0 };
  }

  const rateLimit = data as RateLimit;

  // Verifica se ainda está bloqueado
  if (rateLimit.bloqueado_ate) {
    const bloqueadoAte = new Date(rateLimit.bloqueado_ate);
    if (bloqueadoAte > new Date()) {
      return {
        bloqueado: true,
        bloqueadoAte,
        tentativas: rateLimit.tentativas,
      };
    }
    // Bloqueio expirou, remove
    await supabaseAdmin
      .from('rate_limits')
      .update({ bloqueado_ate: null, tentativas: 0 })
      .eq('id', rateLimit.id);
  }

  return {
    bloqueado: false,
    tentativas: rateLimit.tentativas || 0,
  };
}

/**
 * Registra uma tentativa e verifica se deve bloquear
 */
export async function registrarTentativa(
  identificador: string,
  tipo: 'cpf' | 'ip'
): Promise<{ permitido: boolean; bloqueadoAte?: Date; tentativas: number }> {
  // Verifica bloqueio atual
  const status = await verificarBloqueio(identificador, tipo);

  if (status.bloqueado) {
    return {
      permitido: false,
      bloqueadoAte: status.bloqueadoAte,
      tentativas: status.tentativas,
    };
  }

  // Busca ou cria registro
  const { data: existing } = await supabaseAdmin
    .from('rate_limits')
    .select('*')
    .eq('identificador', identificador)
    .eq('tipo', tipo)
    .single();

  let novasTentativas = (existing?.tentativas || 0) + 1;
  let bloqueadoAte: Date | null = null;

  // Se excedeu o limite, bloqueia
  if (novasTentativas >= CONFIG.maxTentativas) {
    bloqueadoAte = new Date();
    bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + CONFIG.bloqueioMinutos);
  }

  // Atualiza ou cria registro
  if (existing) {
    await supabaseAdmin
      .from('rate_limits')
      .update({
        tentativas: novasTentativas,
        bloqueado_ate: bloqueadoAte?.toISOString() || null,
      })
      .eq('id', existing.id);
  } else {
    await supabaseAdmin.from('rate_limits').insert({
      identificador,
      tipo,
      tentativas: novasTentativas,
      bloqueado_ate: bloqueadoAte?.toISOString() || null,
    });
  }

  return {
    permitido: novasTentativas < CONFIG.maxTentativas,
    bloqueadoAte: bloqueadoAte || undefined,
    tentativas: novasTentativas,
  };
}

/**
 * Reseta tentativas de um identificador (útil após sucesso)
 */
export async function resetarTentativas(
  identificador: string,
  tipo: 'cpf' | 'ip'
): Promise<void> {
  await supabaseAdmin
    .from('rate_limits')
    .update({ tentativas: 0, bloqueado_ate: null })
    .eq('identificador', identificador)
    .eq('tipo', tipo);
}
