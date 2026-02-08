'use client';

import { useState } from 'react';
import { mascararCPF, validarCPF } from '@/lib/utils/security-client';

interface ValidacaoResponse {
  vinculoValido: boolean;
  responsavel: {
    id: string;
    nome: string;
    email: string | null;
    celular: string | null;
  };
  aluno: {
    id: string;
    nome: string;
    prontuario: string;
    email_google: string;
  };
  tipoVinculo: string;
}

export default function Home() {
  const [cpf, setCpf] = useState('');
  const [prontuario, setProntuario] = useState('');
  const [email, setEmail] = useState('');
  const [usarEmail, setUsarEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [dadosValidacao, setDadosValidacao] = useState<ValidacaoResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setDadosValidacao(null);

    // Valida CPF
    if (!validarCPF(cpf)) {
      setErro('CPF inválido');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/validar-vinculo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf,
          ...(usarEmail ? { email } : { prontuario }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Erro ao validar vínculo');
        setLoading(false);
        return;
      }

      setDadosValidacao(data);
    } catch (error: any) {
      setErro('Erro ao conectar com o servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
      setCpf(valor);
    }
  };

  if (dadosValidacao) {
    return (
      <div className="container">
        <div className="card">
          <h1>Vínculo Validado</h1>
          <div className="alert alert-success">
            <strong>Sucesso!</strong> Vínculo confirmado entre responsável e aluno.
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Responsável:</strong> {dadosValidacao.responsavel.nome}</p>
            <p><strong>Aluno:</strong> {dadosValidacao.aluno.nome}</p>
            <p><strong>Prontuário:</strong> {dadosValidacao.aluno.prontuario}</p>
            <p><strong>Tipo de Vínculo:</strong> {dadosValidacao.tipoVinculo}</p>
          </div>

          <a href={`/otp?responsavel_id=${dadosValidacao.responsavel.id}&aluno_id=${dadosValidacao.aluno.id}`}>
            <button className="button">Continuar com Reset de Senha</button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Reset de Senha - Alunos</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Informe seu CPF e o prontuário ou email do aluno para validar o vínculo.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="cpf">
              CPF do Responsável
            </label>
            <input
              id="cpf"
              type="text"
              className="input"
              placeholder="000.000.000-00"
              value={mascararCPF(cpf)}
              onChange={handleCpfChange}
              required
              maxLength={14}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="radio"
                checked={!usarEmail}
                onChange={() => setUsarEmail(false)}
                style={{ marginRight: '0.5rem' }}
              />
              Prontuário do Aluno
            </label>
            <label style={{ marginLeft: '1rem' }}>
              <input
                type="radio"
                checked={usarEmail}
                onChange={() => setUsarEmail(true)}
                style={{ marginRight: '0.5rem' }}
              />
              Email do Aluno
            </label>
          </div>

          {!usarEmail ? (
            <div className="form-group">
              <label className="label" htmlFor="prontuario">
                Prontuário
              </label>
              <input
                id="prontuario"
                type="text"
                className="input"
                placeholder="Ex: 12345"
                value={prontuario}
                onChange={(e) => setProntuario(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="label" htmlFor="email">
                Email do Aluno
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="aluno@escola.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {erro && <div className="alert alert-error">{erro}</div>}

          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Validando...' : 'Validar Vínculo'}
          </button>
        </form>
      </div>
    </div>
  );
}
