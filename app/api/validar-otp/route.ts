/**
 * API Route: Validar Código OTP
 * 
 * POST /api/validar-otp
 * 
 * Body:
 * - responsavel_id: string (UUID)
 * - aluno_id: string (UUID)
 * - codigo: string (6 dígitos)
 * 
 * Retorna:
 * - valido: boolean
 * - token: string (token temporário para reset, válido por 5 minutos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const schemaValidacao = z.object({
  responsavel_id: z.string().uuid(),
  aluno_id: z.string().uuid(),
  codigo: z.string().length(6).regex(/^\d+$/),
});

// Armazena tokens temporários em memória (em produção, usar Redis)
const tokensTemporarios = new Map<string, { responsavel_id: string; aluno_id: string; expira_em: Date }>();

// Limpa tokens expirados periodicamente
setInterval(() => {
  const agora = new Date();
  for (const [token, dados] of tokensTemporarios.entries()) {
    if (dados.expira_em < agora) {
      tokensTemporarios.delete(token);
    }
  }
}, 60000); // A cada 1 minuto

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dados = schemaValidacao.parse(body);

    // Busca OTP no banco
    const { data: otp, error: erroOTP } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('responsavel_id', dados.responsavel_id)
      .eq('aluno_id', dados.aluno_id)
      .eq('codigo', dados.codigo)
      .eq('usado', false)
      .single();

    if (erroOTP || !otp) {
      return NextResponse.json(
        { erro: 'Código inválido ou já utilizado' },
        { status: 400 }
      );
    }

    // Verifica se expirou
    const expiraEm = new Date(otp.expira_em);
    if (expiraEm < new Date()) {
      return NextResponse.json(
        { erro: 'Código expirado' },
        { status: 400 }
      );
    }

    // Marca OTP como usado
    await supabaseAdmin
      .from('otp_codes')
      .update({ usado: true })
      .eq('id', otp.id);

    // Gera token temporário (válido por 5 minutos)
    const token = nanoid(32);
    const expiraEm = new Date();
    expiraEm.setMinutes(expiraEm.getMinutes() + 5);

    tokensTemporarios.set(token, {
      responsavel_id: dados.responsavel_id,
      aluno_id: dados.aluno_id,
      expira_em: expiraEm,
    });

    return NextResponse.json({
      valido: true,
      token,
      expira_em: expiraEm.toISOString(),
    });
  } catch (error: any) {
    console.error('Erro ao validar OTP:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Valida token temporário (usado internamente)
 */
export function validarTokenTemporario(token: string): { valido: boolean; responsavel_id?: string; aluno_id?: string } {
  const dados = tokensTemporarios.get(token);
  
  if (!dados) {
    return { valido: false };
  }

  if (dados.expira_em < new Date()) {
    tokensTemporarios.delete(token);
    return { valido: false };
  }

  return {
    valido: true,
    responsavel_id: dados.responsavel_id,
    aluno_id: dados.aluno_id,
  };
}
