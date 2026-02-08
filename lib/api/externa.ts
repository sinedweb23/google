/**
 * Integração com API PHP Externa
 * 
 * Consome a API oficial que retorna dados de alunos e responsáveis
 * Endpoint: https://loja.escolamorumbisul.com.br/api/importacao.php
 */

interface AlunoAPI {
  nome: string;
  prontuario: string;
  situacao: string;
  turma: string;
  responsaveis_financeiros?: ResponsavelAPI[];
  responsaveis_pedagogicos?: ResponsavelAPI[];
}

interface ResponsavelAPI {
  nome: string;
  cpf: string;
  email?: string;
  celular?: string;
}

interface RespostaAPI {
  sucesso: boolean;
  dados?: AlunoAPI[];
  erro?: string;
}

/**
 * Busca dados da API PHP externa
 * 
 * @returns Promise com lista de alunos e responsáveis
 */
export async function buscarDadosAPIExterna(): Promise<RespostaAPI> {
  const apiUrl = process.env.API_EXTERNA_URL || 'https://loja.escolamorumbisul.com.br/api/importacao.php';
  const apiKey = process.env.API_EXTERNA_KEY;

  if (!apiKey) {
    return {
      sucesso: false,
      erro: 'API_KEY não configurada',
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Timeout de 30 segundos
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        sucesso: false,
        erro: `Erro HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const dados = await response.json();

    // Valida estrutura básica da resposta
    if (!Array.isArray(dados) && !dados.alunos) {
      return {
        sucesso: false,
        erro: 'Formato de resposta inválido da API',
      };
    }

    // Normaliza para array de alunos
    const alunos = Array.isArray(dados) ? dados : dados.alunos || [];

    return {
      sucesso: true,
      dados: alunos,
    };
  } catch (error: any) {
    console.error('Erro ao buscar dados da API externa:', error);
    
    return {
      sucesso: false,
      erro: error.message || 'Erro ao conectar com a API externa',
    };
  }
}

/**
 * Sincroniza dados da API externa com o Supabase
 * 
 * Processa os dados e atualiza as tabelas:
 * - responsaveis
 * - alunos
 * - responsavel_aluno
 */
export async function sincronizarDadosAPIExterna() {
  const { buscarDadosAPIExterna } = await import('./externa');
  const { supabaseAdmin } = await import('../supabase/server');
  const { hashCPF } = await import('../utils/security');

  // Busca dados da API
  const resultado = await buscarDadosAPIExterna();

  if (!resultado.sucesso || !resultado.dados) {
    throw new Error(resultado.erro || 'Falha ao buscar dados da API');
  }

  const alunosAPI = resultado.dados;
  let alunosProcessados = 0;
  let responsaveisProcessados = 0;
  let vinculosProcessados = 0;
  const erros: string[] = [];

  // Processa cada aluno
  for (const alunoAPI of alunosAPI) {
    try {
      // 1. Cria/atualiza aluno
      const { data: aluno, error: erroAluno } = await supabaseAdmin
        .from('alunos')
        .upsert(
          {
            nome: alunoAPI.nome,
            prontuario: alunoAPI.prontuario,
            email_google: `${alunoAPI.prontuario}@${process.env.GOOGLE_DOMAIN || 'escola.com.br'}`,
            status: alunoAPI.situacao?.toLowerCase() || 'ativo',
          },
          {
            onConflict: 'prontuario',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (erroAluno || !aluno) {
        erros.push(`Erro ao processar aluno ${alunoAPI.prontuario}: ${erroAluno?.message}`);
        continue;
      }

      alunosProcessados++;

      // 2. Processa responsáveis financeiros
      const responsaveisFinanceiros = alunoAPI.responsaveis_financeiros || [];
      for (const respAPI of responsaveisFinanceiros) {
        try {
          const cpfHash = hashCPF(respAPI.cpf);

          // Cria/atualiza responsável
          const { data: responsavel, error: erroResp } = await supabaseAdmin
            .from('responsaveis')
            .upsert(
              {
                nome: respAPI.nome,
                cpf_hash: cpfHash,
                email: respAPI.email || null,
                celular: respAPI.celular || null,
              },
              {
                onConflict: 'cpf_hash',
                ignoreDuplicates: false,
              }
            )
            .select()
            .single();

          if (erroResp || !responsavel) {
            erros.push(`Erro ao processar responsável ${respAPI.nome}: ${erroResp?.message}`);
            continue;
          }

          responsaveisProcessados++;

          // Cria/atualiza vínculo
          const tipoVinculo = alunoAPI.responsaveis_pedagogicos?.some(
            (r) => r.cpf === respAPI.cpf
          )
            ? 'ambos'
            : 'financeiro';

          const { error: erroVinculo } = await supabaseAdmin
            .from('responsavel_aluno')
            .upsert(
              {
                responsavel_id: responsavel.id,
                aluno_id: aluno.id,
                tipo: tipoVinculo,
              },
              {
                onConflict: 'responsavel_id,aluno_id',
                ignoreDuplicates: false,
              }
            );

          if (erroVinculo) {
            erros.push(`Erro ao criar vínculo: ${erroVinculo.message}`);
          } else {
            vinculosProcessados++;
          }
        } catch (error: any) {
          erros.push(`Erro ao processar responsável financeiro: ${error.message}`);
        }
      }

      // 3. Processa responsáveis pedagógicos (que não são financeiros)
      const responsaveisPedagogicos = alunoAPI.responsaveis_pedagogicos || [];
      for (const respAPI of responsaveisPedagogicos) {
        try {
          // Verifica se já foi processado como financeiro
          const jaProcessado = responsaveisFinanceiros.some((r) => r.cpf === respAPI.cpf);
          if (jaProcessado) continue; // Já foi processado acima

          const cpfHash = hashCPF(respAPI.cpf);

          // Cria/atualiza responsável
          const { data: responsavel, error: erroResp } = await supabaseAdmin
            .from('responsaveis')
            .upsert(
              {
                nome: respAPI.nome,
                cpf_hash: cpfHash,
                email: respAPI.email || null,
                celular: respAPI.celular || null,
              },
              {
                onConflict: 'cpf_hash',
                ignoreDuplicates: false,
              }
            )
            .select()
            .single();

          if (erroResp || !responsavel) {
            erros.push(`Erro ao processar responsável ${respAPI.nome}: ${erroResp?.message}`);
            continue;
          }

          responsaveisProcessados++;

          // Cria/atualiza vínculo pedagógico
          const { error: erroVinculo } = await supabaseAdmin
            .from('responsavel_aluno')
            .upsert(
              {
                responsavel_id: responsavel.id,
                aluno_id: aluno.id,
                tipo: 'pedagogico',
              },
              {
                onConflict: 'responsavel_id,aluno_id',
                ignoreDuplicates: false,
              }
            );

          if (erroVinculo) {
            erros.push(`Erro ao criar vínculo: ${erroVinculo.message}`);
          } else {
            vinculosProcessados++;
          }
        } catch (error: any) {
          erros.push(`Erro ao processar responsável pedagógico: ${error.message}`);
        }
      }
    } catch (error: any) {
      erros.push(`Erro ao processar aluno ${alunoAPI.prontuario}: ${error.message}`);
    }
  }

  return {
    sucesso: true,
    resumo: {
      alunosProcessados,
      responsaveisProcessados,
      vinculosProcessados,
      erros: erros.length,
      mensagensErro: erros,
    },
  };
}
