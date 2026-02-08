/**
 * API Route: Resetar Senha do Aluno
 * 
 * POST /api/resetar-senha
 * 
 * Body:
 * - token: string (token temporário do OTP)
 * 
 * Retorna:
 * - sucesso: boolean
 * - senha_temporaria?: string (apenas uma vez, em produção considerar não retornar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { gerarSenhaTemporaria, extrairIP } from '@/lib/utils/security';
import { resetarSenhaGoogle } from '@/lib/google/admin';
import { validarTokenTemporario } from '../validar-otp/route';
import { resetarTentativas } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const schemaValidacao = z.object({
  token: z.string().min(32),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dados = schemaValidacao.parse(body);
    const ip = extrairIP(request);
    const userAgent = request.headers.get('user-agent') || null;

    // Valida token temporário
    const validacaoToken = validarTokenTemporario(dados.token);
    if (!validacaoToken.valido || !validacaoToken.responsavel_id || !validacaoToken.aluno_id) {
      return NextResponse.json(
        { erro: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const { responsavel_id, aluno_id } = validacaoToken;

    // Busca dados do aluno
    const { data: aluno, error: erroAluno } = await supabaseAdmin
      .from('alunos')
      .select('*')
      .eq('id', aluno_id)
      .single();

    if (erroAluno || !aluno) {
      return NextResponse.json(
        { erro: 'Aluno não encontrado' },
        { status: 404 }
      );
    }

    // Cria log de tentativa (status: pendente)
    const { data: log, error: erroLog } = await supabaseAdmin
      .from('password_resets_log')
      .insert({
        aluno_id,
        responsavel_id,
        ip,
        user_agent: userAgent,
        status: 'pendente',
      })
      .select()
      .single();

    if (erroLog) {
      console.error('Erro ao criar log:', erroLog);
    }

    // Gera senha temporária forte
    const senhaTemporaria = gerarSenhaTemporaria();

    // Reseta senha no Google Workspace
    const resultadoGoogle = await resetarSenhaGoogle(
      aluno.email_google,
      senhaTemporaria,
      true // Força troca no próximo login
    );

    if (!resultadoGoogle.sucesso) {
      // Atualiza log com falha
      if (log) {
        await supabaseAdmin
          .from('password_resets_log')
          .update({
            status: 'falha',
            erro_mensagem: resultadoGoogle.erro || 'Erro desconhecido',
          })
          .eq('id', log.id);
      }

      return NextResponse.json(
        { 
          erro: 'Falha ao resetar senha no Google Workspace',
          detalhes: resultadoGoogle.erro,
        },
        { status: 500 }
      );
    }

    // Atualiza log com sucesso
    if (log) {
      await supabaseAdmin
        .from('password_resets_log')
        .update({
          status: 'sucesso',
        })
        .eq('id', log.id);
    }

    // Reseta tentativas de rate limiting (sucesso)
    const cpfHash = (await supabaseAdmin
      .from('responsaveis')
      .select('cpf_hash')
      .eq('id', responsavel_id)
      .single()).data?.cpf_hash;

    if (cpfHash) {
      await resetarTentativas(cpfHash, 'cpf');
    }
    await resetarTentativas(ip, 'ip');

    // Retorna sucesso
    // IMPORTANTE: Em produção, considere não retornar a senha
    // e enviar por email/SMS separadamente
    return NextResponse.json({
      sucesso: true,
      mensagem: 'Senha resetada com sucesso. O aluno será forçado a trocar a senha no próximo login.',
      senha_temporaria: senhaTemporaria, // TODO: Remover ou enviar por canal seguro
      aluno: {
        nome: aluno.nome,
        email: aluno.email_google,
      },
    });
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    
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
