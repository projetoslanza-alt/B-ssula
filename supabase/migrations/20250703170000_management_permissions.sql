-- Permissões operacionais para Master/Gestão (escopo tenant)

INSERT INTO permissions (code, name, module) VALUES
  ('platform.users.status', 'Ativar e inativar usuários', 'platform'),
  ('gamification.mission.manage', 'Gerenciar missões de campanha', 'gamification'),
  ('support.ticket.archive', 'Arquivar e reativar chamados', 'support')
ON CONFLICT (code) DO NOTHING;

-- Gestão pode atualizar status de membership sem platform.users.manage completo
DROP POLICY IF EXISTS memberships_manage ON organization_memberships;
CREATE POLICY memberships_manage ON organization_memberships FOR ALL
  USING (
    tenant_id = user_active_tenant_id()
    AND (
      has_permission('platform.users.manage')
      OR has_permission('platform.users.status')
    )
  )
  WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND (
      has_permission('platform.users.manage')
      OR has_permission('platform.users.status')
    )
  );

-- Status arquivado para chamados
ALTER TYPE support_ticket_status ADD VALUE IF NOT EXISTS 'archived';

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

-- Master/Gestão podem ler perfis do tenant para listagem de usuários
DROP POLICY IF EXISTS profiles_select_tenant_admin ON profiles;
CREATE POLICY profiles_select_tenant_admin ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM organization_memberships om
      WHERE om.user_id = profiles.id
        AND om.tenant_id = user_active_tenant_id()
    )
    AND (
      has_permission('platform.users.manage')
      OR has_permission('platform.users.status')
    )
  );

-- Papéis de membership visíveis para quem administra usuários
DROP POLICY IF EXISTS membership_roles_admin_read ON membership_roles;
CREATE POLICY membership_roles_admin_read ON membership_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.id = membership_roles.membership_id
        AND om.tenant_id = user_active_tenant_id()
        AND (
          has_permission('platform.users.manage')
          OR has_permission('platform.users.status')
        )
    )
  );
