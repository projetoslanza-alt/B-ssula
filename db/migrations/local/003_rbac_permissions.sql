-- Migration local: 003_rbac_permissions.sql
-- Gerado por build-local-migrations.ts

-- source: 20250630170000_membership_roles_read.sql
-- Permite que usuários leiam seus próprios papéis (necessário para getSessionContext)

-- source: 20250630190000_platform_permissions.sql
-- Permissões dos módulos da Etapa 4

INSERT INTO permissions (code, name, module) VALUES
  ('crm.view', 'Visualizar CRM', 'crm'),
  ('crm.manage', 'Gerenciar CRM', 'crm'),
  ('crm.pipeline.manage', 'Gerenciar funil', 'crm'),
  ('crm.opportunity.create', 'Criar oportunidade', 'crm'),
  ('crm.opportunity.edit', 'Editar oportunidade', 'crm'),
  ('crm.opportunity.delete', 'Excluir oportunidade', 'crm'),
  ('one_on_one.view', 'Visualizar One a One', 'one_on_one'),
  ('one_on_one.team.view', 'Visualizar equipe One a One', 'one_on_one'),
  ('one_on_one.meeting.create', 'Criar reunião One a One', 'one_on_one'),
  ('one_on_one.meeting.manage', 'Gerenciar reuniões One a One', 'one_on_one'),
  ('one_on_one.action_plan.manage', 'Gerenciar planos de ação', 'one_on_one'),
  ('support.view', 'Visualizar chamados', 'support'),
  ('support.ticket.create', 'Abrir chamado', 'support'),
  ('support.ticket.manage_own', 'Gerenciar próprios chamados', 'support'),
  ('support.ticket.manage_all', 'Gerenciar todos os chamados', 'support'),
  ('support.settings.manage', 'Configurar chamados', 'support'),
  ('reports.view', 'Visualizar relatórios', 'reports'),
  ('reports.crm.view', 'Relatórios CRM', 'reports'),
  ('reports.one_on_one.view', 'Relatórios One a One', 'reports'),
  ('reports.learning.view', 'Relatórios Universidade', 'reports'),
  ('reports.support.view', 'Relatórios Chamados', 'reports'),
  ('platform.teams.manage', 'Gerenciar equipes', 'platform'),
  ('platform.roles.manage', 'Gerenciar papéis', 'platform')
ON CONFLICT (code) DO NOTHING;

-- Student: chamados próprios
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'student' AND p.code IN (
  'support.view', 'support.ticket.create', 'support.ticket.manage_own'
)
ON CONFLICT DO NOTHING;

-- Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'manager' AND p.code IN (
  'crm.view', 'crm.opportunity.create', 'crm.opportunity.edit',
  'one_on_one.view', 'one_on_one.team.view', 'one_on_one.meeting.create',
  'one_on_one.meeting.manage', 'one_on_one.action_plan.manage',
  'support.view', 'support.ticket.create', 'support.ticket.manage_own',
  'reports.view', 'reports.crm.view', 'reports.one_on_one.view', 'reports.learning.view'
)
ON CONFLICT DO NOTHING;

-- Director
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'director' AND p.code IN (
  'crm.view', 'one_on_one.view', 'support.view',
  'reports.view', 'reports.crm.view', 'reports.one_on_one.view',
  'reports.learning.view', 'reports.support.view'
)
ON CONFLICT DO NOTHING;

-- Org admin: todos os módulos do tenant
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'org_admin' AND (
  p.code LIKE 'crm.%' OR p.code LIKE 'one_on_one.%' OR p.code LIKE 'support.%'
  OR p.code LIKE 'reports.%' OR p.code = 'platform.teams.manage' OR p.code = 'platform.roles.manage'
)
ON CONFLICT DO NOTHING;

-- Platform admin: tudo
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'platform_admin'
ON CONFLICT DO NOTHING;

-- source: 20250702140000_access_groups_media_status.sql
-- Grupos de acesso comerciais (Master, Gerente, SDR, Closer)

CREATE TABLE IF NOT EXISTS access_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fixture_key TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, fixture_key)
);

CREATE TABLE IF NOT EXISTS access_group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, permission_id)
);

CREATE TABLE IF NOT EXISTS membership_access_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES organization_memberships(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (membership_id, group_id)
);

CREATE TABLE IF NOT EXISTS access_group_permission_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  previous_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- source: 20250703170000_management_permissions.sql
-- Permissões operacionais para Master/Gestão (escopo tenant)

INSERT INTO permissions (code, name, module) VALUES
  ('platform.users.status', 'Ativar e inativar usuários', 'platform'),
  ('gamification.mission.manage', 'Gerenciar missões de campanha', 'gamification'),
  ('support.ticket.archive', 'Arquivar e reativar chamados', 'support')
ON CONFLICT (code) DO NOTHING;

-- Gestão pode atualizar status de membership
-- (RLS removido — autorização no servidor)

-- fixture_key para notificações e auditoria QA
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS fixture_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_tenant_fixture
  ON notifications (tenant_id, fixture_key) WHERE fixture_key IS NOT NULL;

ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS fixture_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_events_tenant_fixture
  ON audit_events (tenant_id, fixture_key) WHERE fixture_key IS NOT NULL;

-- Permissões operacionais para papel Gestão/Gerente (fallback quando sem grupo de acesso)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'manager' AND p.code IN (
  'platform.users.status',
  'gamification.campaign.publish',
  'gamification.campaign.pause',
  'gamification.campaign.close',
  'gamification.campaign.edit',
  'gamification.mission.manage',
  'support.ticket.manage_all',
  'support.ticket.archive',
  'support.settings.manage'
)
ON CONFLICT DO NOTHING;

-- Papéis de membership visíveis para quem administra usuários
-- (RLS removido)
