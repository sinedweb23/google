/**
 * API Route: Sincronizar Dados da API Externa
 * 
 * POST /api/sincronizar
 * 
 * Headers:
 * - Authorization: Bearer {API_KEY_INTERNA}
 * 
 * Sincroniza dados da API PHP externa com o Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { sincronizarDadosAPIExterna } from '@/lib/api/externa';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação (API key interna)
    const authHeader = request.headers.get('authorization');
    const apiKeyInterna = process.env.API_KEY_INTERNA;

    if (!apiKeyInterna) {
      return NextResponse.json(
        { erro: 'API_KEY_INTERNA não configurada' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { erro: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== apiKeyInterna) {
      return NextResponse.json(
        { erro: 'Token inválido' },
        { status: 401 }
      );
    }

    // Executa sincronização
    const resultado = await sincronizarDadosAPIExterna();

    return NextResponse.json({
      sucesso: resultado.sucesso,
      resumo: resultado.resumo,
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar:', error);
    
    return NextResponse.json(
      { 
        erro: 'Erro ao sincronizar dados',
        detalhes: error.message,
      },
      { status: 500 }
    );
  }
}
