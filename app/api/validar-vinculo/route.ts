/**
 * API Route: Validar Vínculo Responsável ↔ Aluno
 * 
 * POST /api/validar-vinculo
 * 
 * Body:
 * - cpf: string (CPF do responsável)
 * - prontuario: string (Prontuário do aluno) OU email: string
 * 
 * Retorna:
 * - vinculoValido: boolean
 * - responsavel: { id, nome, email, celular }
 * - aluno: { id, nome, prontuario, email_google }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashCPF, validarCPF, extrairIP, sanitizarString } from '@/lib/utils/security';
import { verificarBloqueio, registrarTentativa } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const schemaValidacao = z.object({
  cpf: z.string().min(11).max(14),
  prontuario: z.string().optional(),
  email: z.string().email().optional(),
}).refine((data) => data.prontuario || data.email, {
  message: 'Deve fornecer prontuario ou email do aluno',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Valida schema
    const dados = schemaValidacao.parse(body);
    
    // Valida CPF
    if (!validarCPF(dados.cpf)) {
      return NextResponse.json(
        { erro: 'CPF inválido' },
        { status: 400 }
      );
    }

    // Rate limiting por CPF
    const cpfHash = hashCPF(dados.cpf);
    const ip = extrairIP(request);
    
    const bloqueioCPF = await verificarBloqueio(cpfHash, 'cpf');
    if (bloqueioCPF.bloqueado) {
      return NextResponse.json(
        {
          erro: 'Muitas tentativas. Tente novamente mais tarde.',
          bloqueadoAte: bloqueioCPF.bloqueadoAte,
        },
        { status: 429 }
      );
    }

    const bloqueioIP = await verificarBloqueio(ip, 'ip');
    if (bloqueioIP.bloqueado) {
      return NextResponse.json(
        {
          erro: 'Muitas tentativas deste IP. Tente novamente mais tarde.',
          bloqueadoAte: bloqueioIP.bloqueadoAte,
        },
        { status: 429 }
      );
    }

    // Busca responsável
    const { data: responsavel, error: erroResp } = await supabaseAdmin
      .from('responsaveis')
      .select('*')
      .eq('cpf_hash', cpfHash)
      .single();

    if (erroResp || !responsavel) {
      await registrarTentativa(cpfHash, 'cpf');
      await registrarTentativa(ip, 'ip');
      
      return NextResponse.json(
        { erro: 'Responsável não encontrado' },
        { status: 404 }
      );
    }

    // Busca aluno
    let queryAluno = supabaseAdmin
      .from('alunos')
      .select('*');

    if (dados.prontuario) {
      queryAluno = queryAluno.eq('prontuario', sanitizarString(dados.prontuario));
    } else if (dados.email) {
      queryAluno = queryAluno.eq('email_google', sanitizarString(dados.email));
    }

    const { data: aluno, error: erroAluno } = await queryAluno.single();

    if (erroAluno || !aluno) {
      await registrarTentativa(cpfHash, 'cpf');
      await registrarTentativa(ip, 'ip');
      
      return NextResponse.json(
        { erro: 'Aluno não encontrado' },
        { status: 404 }
      );
    }

    // Verifica vínculo
    const { data: vinculo, error: erroVinculo } = await supabaseAdmin
      .from('responsavel_aluno')
      .select('*')
      .eq('responsavel_id', responsavel.id)
      .eq('aluno_id', aluno.id)
      .single();

    if (erroVinculo || !vinculo) {
      await registrarTentativa(cpfHash, 'cpf');
      await registrarTentativa(ip, 'ip');
      
      return NextResponse.json(
        { erro: 'Vínculo não encontrado. Este responsável não está vinculado a este aluno.' },
        { status: 403 }
      );
    }

    // Vínculo válido - retorna dados (sem expor CPF completo)
    return NextResponse.json({
      vinculoValido: true,
      responsavel: {
        id: responsavel.id,
        nome: responsavel.nome,
        email: responsavel.email,
        celular: responsavel.celular,
      },
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        prontuario: aluno.prontuario,
        email_google: aluno.email_google,
      },
      tipoVinculo: vinculo.tipo,
    });
  } catch (error: any) {
    console.error('Erro ao validar vínculo:', error);
    
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
