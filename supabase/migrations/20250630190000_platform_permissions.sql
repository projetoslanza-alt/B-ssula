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
