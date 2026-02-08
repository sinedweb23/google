/**
 * API Route: Gerar Código OTP
 * 
 * POST /api/gerar-otp
 * 
 * Body:
 * - responsavel_id: string (UUID)
 * - aluno_id: string (UUID)
 * - tipo_envio: 'email' | 'sms'
 * 
 * Retorna:
 * - sucesso: boolean
 * - codigo_enviado: boolean (mock inicialmente)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { gerarOTP, extrairIP } from '@/lib/utils/security';
import { z } from 'zod';
import { addMinutes } from 'date-fns';

const schemaValidacao = z.object({
  responsavel_id: z.string().uuid(),
  aluno_id: z.string().uuid(),
  tipo_envio: z.enum(['email', 'sms']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dados = schemaValidacao.parse(body);
    const ip = extrairIP(request);

    // Verifica se responsável e aluno existem
    const { data: responsavel } = await supabaseAdmin
      .from('responsaveis')
      .select('id, email, celular')
      .eq('id', dados.responsavel_id)
      .single();

    if (!responsavel) {
      return NextResponse.json(
        { erro: 'Responsável não encontrado' },
        { status: 404 }
      );
    }

    const { data: aluno } = await supabaseAdmin
      .from('alunos')
      .select('id, nome')
      .eq('id', dados.aluno_id)
      .single();

    if (!aluno) {
      return NextResponse.json(
        { erro: 'Aluno não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se tem email/celular conforme tipo de envio
    if (dados.tipo_envio === 'email' && !responsavel.email) {
      return NextResponse.json(
        { erro: 'Responsável não possui email cadastrado' },
        { status: 400 }
      );
    }

    if (dados.tipo_envio === 'sms' && !responsavel.celular) {
      return NextResponse.json(
        { erro: 'Responsável não possui celular cadastrado' },
        { status: 400 }
      );
    }

    // Invalida OTPs anteriores não usados
    await supabaseAdmin
      .from('otp_codes')
      .update({ usado: true })
      .eq('responsavel_id', dados.responsavel_id)
      .eq('aluno_id', dados.aluno_id)
      .eq('usado', false);

    // Gera novo código OTP
    const codigo = gerarOTP();
    const expiraEm = addMinutes(new Date(), 10); // Expira em 10 minutos

    // Salva no banco
    const { error: erroOTP } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        responsavel_id: dados.responsavel_id,
        aluno_id: dados.aluno_id,
        codigo,
        tipo_envio: dados.tipo_envio,
        expira_em: expiraEm.toISOString(),
      });

    if (erroOTP) {
      console.error('Erro ao salvar OTP:', erroOTP);
      return NextResponse.json(
        { erro: 'Erro ao gerar código' },
        { status: 500 }
      );
    }

    // TODO: Implementar envio real de email/SMS
    // Por enquanto, apenas loga (em produção, usar serviço de email/SMS)
    console.log(`[OTP] Código gerado para ${responsavel.email || responsavel.celular}: ${codigo}`);
    
    // Em desenvolvimento, pode retornar o código (REMOVER EM PRODUÇÃO)
    const codigoEmDev = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      sucesso: true,
      codigo_enviado: true,
      // REMOVER EM PRODUÇÃO - apenas para desenvolvimento
      ...(codigoEmDev && { codigo_debug: codigo }),
    });
  } catch (error: any) {
    console.error('Erro ao gerar OTP:', error);
    
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
