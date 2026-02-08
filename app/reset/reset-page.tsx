'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [dadosSucesso, setDadosSucesso] = useState<{
    aluno: { nome: string; email: string };
    senha_temporaria: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/');
    }
  }, [token, router]);

  const resetarSenha = async () => {
    if (!token) return;

    setLoading(true);
    setErro('');

    try {
      const response = await fetch('/api/resetar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Erro ao resetar senha');
        return;
      }

      setSucesso(true);
      setDadosSucesso(data);
    } catch (error: any) {
      setErro('Erro ao conectar com o servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      resetarSenha();
    }
  }, [token]);

  if (!token) {
    return null;
  }

  if (sucesso && dadosSucesso) {
    return (
      <div className="container">
        <div className="card">
          <h1>Senha Resetada com Sucesso!</h1>
          <div className="alert alert-success">
            <strong>Sucesso!</strong> A senha do aluno foi resetada com sucesso.
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Aluno:</strong> {dadosSucesso.aluno.nome}</p>
            <p><strong>Email:</strong> {dadosSucesso.aluno.email}</p>
          </div>

          <div className="alert alert-info">
            <strong>Importante:</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li>A senha temporária foi gerada e configurada no Google Workspace.</li>
              <li>O aluno será <strong>forçado a trocar a senha</strong> no próximo login.</li>
              <li>Guarde a senha temporária em local seguro e compartilhe apenas com o aluno.</li>
            </ul>
          </div>

          {dadosSucesso.senha_temporaria && (
            <div style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              marginTop: '1rem',
              textAlign: 'center',
            }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Senha Temporária:</p>
              <p style={{
                fontSize: '1.5rem',
                fontFamily: 'monospace',
                letterSpacing: '0.2rem',
                color: '#0070f3',
                fontWeight: 'bold',
              }}>
                {dadosSucesso.senha_temporaria}
              </p>
            </div>
          )}

          <button
            className="button"
            onClick={() => router.push('/')}
            style={{ marginTop: '1rem' }}
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Resetando Senha</h1>
        
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem' }}>Processando reset de senha...</p>
          </div>
        ) : erro ? (
          <>
            <div className="alert alert-error">{erro}</div>
            <button
              className="button"
              onClick={() => router.push('/')}
            >
              Voltar ao Início
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
