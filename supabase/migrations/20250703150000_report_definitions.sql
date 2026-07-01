-- Relatórios personalizados: definições, versões e RLS
CREATE TYPE report_definition_status AS ENUM ('draft', 'active', 'inactive');

CREATE TABLE report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fixture_key TEXT,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  status report_definition_status NOT NULL DEFAULT 'draft',
  layout JSONB NOT NULL DEFAULT '{}',
  filters JSONB NOT NULL DEFAULT '{}',
  blocks JSONB NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, fixture_key)
);

CREATE TABLE report_definition_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id, version)
);

CREATE INDEX idx_report_definitions_tenant_status ON report_definitions(tenant_id, status);
CREATE TRIGGER report_definitions_updated_at
  BEFORE UPDATE ON report_definitions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_definition_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_definitions_read ON report_definitions FOR SELECT
  USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
    AND has_permission('reports.view')
  );

CREATE POLICY report_definitions_write ON report_definitions FOR ALL
  USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
    AND has_permission('reports.view')
  )
  WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND has_permission('reports.view')
  );

CREATE POLICY report_versions_read ON report_definition_versions FOR SELECT
  USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
    AND has_permission('reports.view')
  );

CREATE POLICY report_versions_write ON report_definition_versions FOR ALL
  USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
    AND has_permission('reports.view')
  )
  WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND has_permission('reports.view')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON report_definitions TO authenticated;
GRANT SELECT, INSERT ON report_definition_versions TO authenticated;
