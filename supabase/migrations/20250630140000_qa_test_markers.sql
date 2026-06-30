-- Marcadores para dados e contas de teste (QA / homologação)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS fixture_key TEXT,
  ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS test_environment TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_fixture_key
  ON organizations (fixture_key) WHERE fixture_key IS NOT NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fixture_key TEXT,
  ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS test_environment TEXT,
  ADD COLUMN IF NOT EXISTS test_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by_provisioner BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_fixture_key
  ON profiles (fixture_key) WHERE fixture_key IS NOT NULL;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS fixture_key TEXT,
  ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_fixture_key
  ON courses (fixture_key) WHERE fixture_key IS NOT NULL;

COMMENT ON COLUMN profiles.fixture_key IS 'Chave estável para fixtures de QA (ex: aluno.norte)';
COMMENT ON COLUMN organizations.fixture_key IS 'Chave estável do tenant de teste (ex: tenant.north)';
