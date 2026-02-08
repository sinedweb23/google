'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function OTPPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const responsavelId = searchParams.get('responsavel_id');
  const alunoId = searchParams.get('aluno_id');

  const [tipoEnvio, setTipoEnvio] = useState<'email' | 'sms'>('email');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOTP, setLoadingOTP] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!responsavelId || !alunoId) {
      router.push('/');
    }
  }, [responsavelId, alunoId, router]);

  const gerarOTP = async () => {
    if (!responsavelId || !alunoId) return;

    setLoadingOTP(true);
    setErro('');

    try {
      const response = await fetch('/api/gerar-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responsavel_id: responsavelId,
          aluno_id: alunoId,
          tipo_envio: tipoEnvio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Erro ao gerar código');
        return;
      }

      setSucesso(true);
      
      // Em desenvolvimento, mostra o código (remover em produção)
      if (data.codigo_debug) {
        alert(`Código OTP (apenas em desenvolvimento): ${data.codigo_debug}`);
      }
    } catch (error: any) {
      setErro('Erro ao conectar com o servidor');
      console.error(error);
    } finally {
      setLoadingOTP(false);
    }
  };

  const validarOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsavelId || !alunoId) return;

    setLoading(true);
    setErro('');

    try {
      const response = await fetch('/api/validar-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responsavel_id: responsavelId,
          aluno_id: alunoId,
          codigo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Código inválido');
        return;
      }

      // Redireciona para reset de senha com o token
      router.push(`/reset?token=${data.token}`);
    } catch (error: any) {
      setErro('Erro ao conectar com o servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!responsavelId || !alunoId) {
    return null;
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Validação por Código</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Escolha como deseja receber o código de verificação.
        </p>

        {!sucesso ? (
          <>
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  checked={tipoEnvio === 'email'}
                  onChange={() => setTipoEnvio('email')}
                  style={{ marginRight: '0.5rem' }}
                />
                Enviar por Email
              </label>
              <label style={{ marginLeft: '1rem' }}>
                <input
                  type="radio"
                  checked={tipoEnvio === 'sms'}
                  onChange={() => setTipoEnvio('sms')}
                  style={{ marginRight: '0.5rem' }}
                />
                Enviar por SMS
              </label>
            </div>

            <button
              type="button"
              className="button"
              onClick={gerarOTP}
              disabled={loadingOTP}
            >
              {loadingOTP ? 'Enviando...' : 'Enviar Código'}
            </button>
          </>
        ) : (
          <form onSubmit={validarOTP}>
            <div className="alert alert-info">
              Código enviado por {tipoEnvio === 'email' ? 'email' : 'SMS'}.
              Digite o código de 6 dígitos abaixo.
            </div>

            <div className="form-group">
              <label className="label" htmlFor="codigo">
                Código de Verificação
              </label>
              <input
                id="codigo"
                type="text"
                className="input"
                placeholder="000000"
                value={codigo}
                onChange={(e) => {
                  const valor = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCodigo(valor);
                }}
                required
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              />
            </div>

            {erro && <div className="alert alert-error">{erro}</div>}

            <button type="submit" className="button" disabled={loading || codigo.length !== 6}>
              {loading ? 'Validando...' : 'Validar Código'}
            </button>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setSucesso(false);
                setCodigo('');
              }}
              style={{ marginTop: '1rem' }}
            >
              Reenviar Código
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
