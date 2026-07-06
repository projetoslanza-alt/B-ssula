-- Migration local: 007_support_kanban_intake.sql
-- Gerado por build-local-migrations.ts

-- source: 20250704120000_support_kanban.sql
-- Kanban de Chamados: colunas configuráveis, posição no quadro e novos status operacionais

ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'blocked';
ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'waiting_validation';
ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'archived';

CREATE TABLE IF NOT EXISTS support_kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#38bdf8',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status_key TEXT NOT NULL,
  is_initial BOOLEAN NOT NULL DEFAULT false,
  is_final BOOLEAN NOT NULL DEFAULT false,
  wip_limit INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS support_kanban_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_column_id UUID NOT NULL REFERENCES support_kanban_columns(id) ON DELETE CASCADE,
  to_column_id UUID NOT NULL REFERENCES support_kanban_columns(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, from_column_id, to_column_id)
);

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS kanban_column_id UUID REFERENCES support_kanban_columns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kanban_position INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_board_move_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_support_tickets_kanban_column
  ON support_tickets (tenant_id, kanban_column_id, kanban_position);

CREATE INDEX IF NOT EXISTS idx_support_kanban_columns_tenant
  ON support_kanban_columns (tenant_id, sort_order);








-- Permissões de movimentação e configuração do quadro
INSERT INTO permissions (code, name, module, description) VALUES
  ('support.ticket.assign', 'Atribuir chamados', 'support', 'Permite atribuir responsável a chamados no escopo autorizado.'),
  ('support.ticket.move_own', 'Mover próprios chamados', 'support', 'Permite mover chamados próprios entre colunas operacionais.'),
  ('support.ticket.move_team', 'Mover chamados da equipe', 'support', 'Permite mover chamados da equipe no Kanban.'),
  ('support.ticket.move_all', 'Mover todos os chamados', 'support', 'Permite mover qualquer chamado do tenant no Kanban.'),
  ('support.ticket.block', 'Bloquear chamados', 'support', 'Permite bloquear e desbloquear chamados.'),
  ('support.ticket.resolve', 'Resolver chamados', 'support', 'Permite marcar chamados como resolvidos.'),
  ('support.board.configure', 'Configurar fluxo Kanban', 'support', 'Permite configurar colunas e transições do quadro.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('org_admin', 'platform_admin')
  AND p.code IN (
    'support.ticket.assign',
    'support.ticket.move_own',
    'support.ticket.move_team',
    'support.ticket.move_all',
    'support.ticket.block',
    'support.ticket.resolve',
    'support.board.configure'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'support.ticket.assign',
  'support.ticket.move_team',
  'support.ticket.move_all',
  'support.ticket.block',
  'support.ticket.resolve',
  'support.board.configure'
)
WHERE r.code = 'manager'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('support.ticket.move_own')
WHERE r.code IN ('student', 'manager')
ON CONFLICT DO NOTHING;

-- source: 20250705120000_support_intake_north_methodology.sql
-- Intake guiado de Chamados + metodologia Conversa de Norte (Venda ComCiência)

-- Status draft para reuniões em andamento
ALTER TYPE one_on_one_meeting_status ADD VALUE IF NOT EXISTS 'draft';

-- Filas de atendimento
CREATE TABLE IF NOT EXISTS support_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  fixture_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- Extensões em categorias
ALTER TABLE support_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE support_categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE support_categories ADD COLUMN IF NOT EXISTS examples TEXT;
ALTER TABLE support_categories ADD COLUMN IF NOT EXISTS required_permission TEXT;
ALTER TABLE support_categories ADD COLUMN IF NOT EXISTS default_queue_slug TEXT;
ALTER TABLE support_categories ADD COLUMN IF NOT EXISTS default_priority support_priority;
ALTER TABLE support_categories ADD COLUMN IF NOT EXISTS default_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE support_subcategories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE support_subcategories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE support_subcategories ADD COLUMN IF NOT EXISTS fixture_key TEXT;
ALTER TABLE support_subcategories ADD COLUMN IF NOT EXISTS default_queue_slug TEXT;
ALTER TABLE support_subcategories ADD COLUMN IF NOT EXISTS examples TEXT;

-- Perguntas dinâmicas
CREATE TABLE IF NOT EXISTS support_question_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES support_categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES support_subcategories(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'category' CHECK (scope IN ('universal', 'category', 'subcategory', 'impact', 'context')),
  question_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'textarea', 'select', 'multiselect', 'boolean', 'date', 'number', 'url')),
  options JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  fixture_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_question_templates_key
  ON support_question_templates (
    tenant_id,
    question_key,
    COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE TABLE IF NOT EXISTS support_ticket_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, question_key)
);

-- Regras de atribuição
CREATE TABLE IF NOT EXISTS support_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES support_categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES support_subcategories(id) ON DELETE CASCADE,
  queue_slug TEXT,
  priority support_priority,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  fixture_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS suggested_priority support_priority;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS queue_slug TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS impact_data JSONB NOT NULL DEFAULT '{}';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS protocol TEXT;

-- Metodologia Conversa de Norte
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS company_snapshot TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS meeting_type TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS employee_role TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS cycle_key TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS methodology_version TEXT NOT NULL DEFAULT 'venda-com-ciencia-1';
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS calculated_score NUMERIC(4,2);
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS classification TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS classification_override TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS classification_override_reason TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS classification_override_by UUID REFERENCES profiles(id);
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS classification_override_at TIMESTAMPTZ;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE one_on_one_meetings ADD COLUMN IF NOT EXISTS initial_status_label TEXT;

CREATE TABLE IF NOT EXISTS one_on_one_meeting_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES one_on_one_meetings(id) ON DELETE CASCADE,
  block_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, block_key)
);

CREATE TABLE IF NOT EXISTS one_on_one_meeting_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES one_on_one_meetings(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  rule_key TEXT NOT NULL,
  message TEXT NOT NULL,
  recommendation TEXT,
  evidence JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS one_on_one_meeting_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES one_on_one_meetings(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_question_templates_category ON support_question_templates(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_answers_ticket ON support_ticket_answers(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ooo_meeting_blocks_meeting ON one_on_one_meeting_blocks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_ooo_meeting_insights_meeting ON one_on_one_meeting_insights(meeting_id);
