-- Migration local: 015_first_access_password.sql
-- Primeiro acesso: troca obrigatória de senha temporária.
-- Não destrutiva — apenas adiciona colunas em user_credentials.

ALTER TABLE user_credentials
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE user_credentials
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN user_credentials.must_change_password IS
  'Quando true, o usuário deve trocar a senha temporária no primeiro acesso antes de usar a plataforma.';
COMMENT ON COLUMN user_credentials.password_changed_at IS
  'Data/hora da última troca de senha feita pelo próprio usuário.';
