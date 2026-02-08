-- ============================================
-- ESQUEMA DO BANCO DE DADOS - RESET DE SENHA
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELA: responsaveis
-- Armazena dados dos responsáveis legais
-- ============================================
CREATE TABLE IF NOT EXISTS responsaveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cpf_hash VARCHAR(255) NOT NULL UNIQUE, -- Hash SHA-256 do CPF (LGPD)
  email VARCHAR(255),
  celular VARCHAR(20),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por CPF hash
CREATE INDEX IF NOT EXISTS idx_responsaveis_cpf_hash ON responsaveis(cpf_hash);
CREATE INDEX IF NOT EXISTS idx_responsaveis_email ON responsaveis(email);
CREATE INDEX IF NOT EXISTS idx_responsaveis_celular ON responsaveis(celular);

-- ============================================
-- TABELA: alunos
-- Armazena dados dos alunos
-- ============================================
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  prontuario VARCHAR(50) NOT NULL UNIQUE,
  email_google VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'ativo', -- ativo, inativo, transferido
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_alunos_prontuario ON alunos(prontuario);
CREATE INDEX IF NOT EXISTS idx_alunos_email_google ON alunos(email_google);
CREATE INDEX IF NOT EXISTS idx_alunos_status ON alunos(status);

-- ============================================
-- TABELA: responsavel_aluno
-- Relacionamento muitos-para-muitos entre responsáveis e alunos
-- ============================================
CREATE TABLE IF NOT EXISTS responsavel_aluno (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  responsavel_id UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('financeiro', 'pedagogico', 'ambos')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(responsavel_id, aluno_id)
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_responsavel_aluno_responsavel ON responsavel_aluno(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_responsavel_aluno_aluno ON responsavel_aluno(aluno_id);
CREATE INDEX IF NOT EXISTS idx_responsavel_aluno_tipo ON responsavel_aluno(tipo);

-- ============================================
-- TABELA: password_resets_log
-- Log de auditoria de todos os resets de senha
-- ============================================
CREATE TABLE IF NOT EXISTS password_resets_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE SET NULL,
  responsavel_id UUID NOT NULL REFERENCES responsaveis(id) ON DELETE SET NULL,
  ip VARCHAR(45), -- Suporta IPv6
  user_agent TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'sucesso', 'falha')),
  erro_mensagem TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auditoria e análise
CREATE INDEX IF NOT EXISTS idx_password_resets_log_aluno ON password_resets_log(aluno_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_log_responsavel ON password_resets_log(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_log_ip ON password_resets_log(ip);
CREATE INDEX IF NOT EXISTS idx_password_resets_log_criado_em ON password_resets_log(criado_em);
CREATE INDEX IF NOT EXISTS idx_password_resets_log_status ON password_resets_log(status);

-- ============================================
-- TABELA: otp_codes
-- Códigos OTP temporários para validação
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  responsavel_id UUID NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  codigo VARCHAR(6) NOT NULL,
  tipo_envio VARCHAR(10) NOT NULL CHECK (tipo_envio IN ('email', 'sms')),
  usado BOOLEAN DEFAULT FALSE,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_otp_codes_responsavel_aluno ON otp_codes(responsavel_id, aluno_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_codigo ON otp_codes(codigo);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expira_em ON otp_codes(expira_em);

-- ============================================
-- TABELA: rate_limits
-- Controle de rate limiting por CPF/IP
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identificador VARCHAR(255) NOT NULL, -- CPF hash ou IP
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('cpf', 'ip')),
  tentativas INTEGER DEFAULT 1,
  bloqueado_ate TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identificador, tipo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rate_limits_identificador ON rate_limits(identificador, tipo);
CREATE INDEX IF NOT EXISTS idx_rate_limits_bloqueado_ate ON rate_limits(bloqueado_ate);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_responsaveis_updated_at
  BEFORE UPDATE ON responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON alunos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsavel_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Apenas service role pode acessar (backend)
-- Frontend não acessa diretamente o banco, apenas via API

-- Service role tem acesso total (usado pelo backend)
CREATE POLICY "Service role full access" ON responsaveis
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON alunos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON responsavel_aluno
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON password_resets_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON otp_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- COMENTÁRIOS DAS TABELAS (Documentação)
-- ============================================

COMMENT ON TABLE responsaveis IS 'Armazena dados dos responsáveis legais dos alunos';
COMMENT ON TABLE alunos IS 'Armazena dados dos alunos do Google Workspace';
COMMENT ON TABLE responsavel_aluno IS 'Relacionamento entre responsáveis e alunos';
COMMENT ON TABLE password_resets_log IS 'Log de auditoria de resets de senha';
COMMENT ON TABLE otp_codes IS 'Códigos OTP temporários para validação';
COMMENT ON TABLE rate_limits IS 'Controle de rate limiting por CPF/IP';
