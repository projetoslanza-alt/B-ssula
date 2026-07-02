-- Kanban de Chamados: colunas configuráveis, posição no quadro e novos status operacionais

ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'blocked';
ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'waiting_validation';

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

ALTER TABLE support_kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_kanban_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_kanban_columns_tenant ON support_kanban_columns FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.board.configure'));

CREATE POLICY support_kanban_transitions_tenant ON support_kanban_transitions FOR ALL
  USING (tenant_id = user_active_tenant_id() AND has_permission('support.view'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('support.board.configure'));

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
