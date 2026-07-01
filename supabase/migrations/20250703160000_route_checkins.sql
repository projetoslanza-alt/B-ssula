-- Check-in de Rota: respostas persistentes por ciclo e tenant
CREATE TABLE one_on_one_route_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_key TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  feeling TEXT,
  wants_conversation BOOLEAN NOT NULL DEFAULT false,
  comment TEXT,
  average_score NUMERIC(4, 2) NOT NULL,
  classification TEXT NOT NULL,
  fixture_key TEXT,
  is_test_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, cycle_key)
);

CREATE INDEX idx_route_checkins_tenant_cycle ON one_on_one_route_checkins(tenant_id, cycle_key);
CREATE INDEX idx_route_checkins_user ON one_on_one_route_checkins(tenant_id, user_id);

ALTER TABLE one_on_one_route_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY route_checkins_own ON one_on_one_route_checkins FOR ALL
  USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
    AND (user_id = auth.uid() OR has_permission('one_on_one.team.view'))
  )
  WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND user_id = auth.uid()
    AND has_permission('one_on_one.view')
  );

GRANT SELECT, INSERT, UPDATE ON one_on_one_route_checkins TO authenticated;
