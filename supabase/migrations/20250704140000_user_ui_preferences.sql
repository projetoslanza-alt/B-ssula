CREATE TABLE IF NOT EXISTS user_ui_preferences (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pref_key TEXT NOT NULL,
  pref_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id, pref_key)
);

ALTER TABLE user_ui_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_ui_preferences_own ON user_ui_preferences FOR ALL
  USING (user_id = auth.uid() AND tenant_id = user_active_tenant_id())
  WITH CHECK (user_id = auth.uid() AND tenant_id = user_active_tenant_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON user_ui_preferences TO authenticated;

ALTER TABLE support_kanban_transitions
  ADD COLUMN IF NOT EXISTS rules JSONB NOT NULL DEFAULT '{}'::jsonb;
