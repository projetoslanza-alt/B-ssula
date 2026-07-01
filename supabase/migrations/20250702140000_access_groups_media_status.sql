-- Grupos de acesso comerciais (Master, Gerente, SDR, Closer) e status de mídia

ALTER TABLE learning_media_assets
  ADD COLUMN IF NOT EXISTS media_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (media_status IN ('pending', 'pending_external_storage', 'uploading', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'staging';

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

ALTER TABLE access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_group_permission_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_groups_tenant ON access_groups
  FOR SELECT USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

CREATE POLICY access_groups_manage ON access_groups
  FOR ALL USING (tenant_id = user_active_tenant_id() AND has_permission('platform.users.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('platform.users.manage'));

CREATE POLICY access_group_permissions_read ON access_group_permissions
  FOR SELECT USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

CREATE POLICY access_group_permissions_manage ON access_group_permissions
  FOR ALL USING (tenant_id = user_active_tenant_id() AND has_permission('platform.users.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('platform.users.manage'));

CREATE POLICY membership_access_groups_read ON membership_access_groups
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND (
      has_permission('platform.users.manage')
      OR membership_id IN (
        SELECT id FROM organization_memberships WHERE user_id = auth.uid() AND tenant_id = user_active_tenant_id()
      )
    )
  );

CREATE POLICY membership_access_groups_manage ON membership_access_groups
  FOR ALL USING (tenant_id = user_active_tenant_id() AND has_permission('platform.users.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('platform.users.manage'));

CREATE POLICY access_group_audit_read ON access_group_permission_audit
  FOR SELECT USING (tenant_id = user_active_tenant_id() AND has_permission('platform.audit.read'));
