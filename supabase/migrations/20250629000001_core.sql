-- Core: organizações, usuários, permissões e auditoria
-- Plataforma Bússola — Fundação multi-tenant

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE membership_status AS ENUM ('active', 'invited', 'suspended', 'removed');
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'archived');

-- Organizações
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status organization_status NOT NULL DEFAULT 'active',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  terms_required BOOLEAN NOT NULL DEFAULT false,
  terms_url TEXT,
  default_locale TEXT NOT NULL DEFAULT 'pt-BR',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Perfis (espelho de auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  status membership_status NOT NULL DEFAULT 'active',
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estrutura organizacional
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES units(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  manager_id UUID REFERENCES profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- Membros da organização
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  status membership_status NOT NULL DEFAULT 'active',
  is_primary BOOLEAN NOT NULL DEFAULT true,
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_memberships_tenant ON organization_memberships(tenant_id);
CREATE INDEX idx_memberships_user ON organization_memberships(user_id);
CREATE INDEX idx_memberships_team ON organization_memberships(team_id);

-- Contexto de organização ativa por sessão
CREATE TABLE user_organization_context (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  active_tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RBAC
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE membership_roles (
  membership_id UUID NOT NULL REFERENCES organization_memberships(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (membership_id, role_id)
);

-- Feature flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- Convites
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  role_ids UUID[] NOT NULL DEFAULT '{}',
  unit_id UUID REFERENCES units(id),
  team_id UUID REFERENCES teams(id),
  position_id UUID REFERENCES positions(id),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auditoria
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  affected_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  origin TEXT NOT NULL DEFAULT 'web',
  ip_address INET,
  user_agent TEXT,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_tenant ON audit_events(tenant_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_events(actor_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);

-- Notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at DESC);

-- Outbox de eventos para integrações futuras
CREATE TABLE domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  source_module TEXT NOT NULL DEFAULT 'learning',
  source_entity_type TEXT,
  source_entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_domain_events_pending ON domain_events(created_at) WHERE processed_at IS NULL;

-- Função updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER organization_memberships_updated_at BEFORE UPDATE ON organization_memberships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: criar profile ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Permissões iniciais
INSERT INTO permissions (code, name, module) VALUES
  ('learning.catalog.read', 'Ler catálogo', 'learning'),
  ('learning.course.read', 'Ler curso', 'learning'),
  ('learning.course.start', 'Iniciar curso', 'learning'),
  ('learning.course.favorite', 'Favoritar curso', 'learning'),
  ('learning.course.review', 'Avaliar curso', 'learning'),
  ('learning.progress.read_own', 'Ler próprio progresso', 'learning'),
  ('learning.certificate.read_own', 'Ler próprios certificados', 'learning'),
  ('learning.team.read', 'Ler equipe', 'learning'),
  ('learning.assignment.create', 'Criar atribuição', 'learning'),
  ('learning.assignment.waive', 'Dispensar atribuição', 'learning'),
  ('learning.course.create', 'Criar curso', 'learning'),
  ('learning.course.update_own', 'Editar próprio curso', 'learning'),
  ('learning.course.publish', 'Publicar curso', 'learning'),
  ('learning.course.archive', 'Arquivar curso', 'learning'),
  ('learning.category.manage', 'Gerenciar categorias', 'learning'),
  ('learning.path.manage', 'Gerenciar trilhas', 'learning'),
  ('learning.assessment.manage', 'Gerenciar avaliações', 'learning'),
  ('learning.reports.read', 'Ler relatórios', 'learning'),
  ('learning.reports.read_sensitive', 'Ler relatórios sensíveis', 'learning'),
  ('learning.settings.manage', 'Gerenciar configurações', 'learning'),
  ('learning.instructor.manage', 'Gerenciar instrutores', 'learning'),
  ('platform.organization.manage', 'Gerenciar organização', 'platform'),
  ('platform.users.manage', 'Gerenciar usuários', 'platform'),
  ('platform.global_content.manage', 'Gerenciar conteúdo global', 'platform'),
  ('platform.audit.read', 'Ler auditoria', 'platform');

-- Papéis globais do sistema
INSERT INTO roles (id, tenant_id, code, name, is_system, is_global) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'student', 'Aluno', true, true),
  ('00000000-0000-0000-0000-000000000002', NULL, 'manager', 'Gestor', true, true),
  ('00000000-0000-0000-0000-000000000003', NULL, 'instructor', 'Instrutor', true, true),
  ('00000000-0000-0000-0000-000000000004', NULL, 'learning_admin', 'Administrador da Universidade', true, true),
  ('00000000-0000-0000-0000-000000000005', NULL, 'director', 'Diretoria', true, true),
  ('00000000-0000-0000-0000-000000000006', NULL, 'org_admin', 'Administrador da organização', true, true),
  ('00000000-0000-0000-0000-000000000007', NULL, 'platform_admin', 'Administrador da plataforma', true, true);

-- Permissões por papel
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'student' AND p.code IN (
  'learning.catalog.read', 'learning.course.read', 'learning.course.start',
  'learning.course.favorite', 'learning.course.review', 'learning.progress.read_own',
  'learning.certificate.read_own'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'manager' AND p.code IN (
  'learning.catalog.read', 'learning.course.read', 'learning.course.start',
  'learning.progress.read_own', 'learning.team.read', 'learning.assignment.create',
  'learning.reports.read'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'instructor' AND p.code IN (
  'learning.catalog.read', 'learning.course.read', 'learning.course.create',
  'learning.course.update_own', 'learning.course.publish'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'learning_admin' AND p.code LIKE 'learning.%';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'director' AND p.code IN (
  'learning.catalog.read', 'learning.reports.read', 'learning.reports.read_sensitive'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'org_admin' AND (p.code LIKE 'learning.%' OR p.code LIKE 'platform.%');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'platform_admin';
