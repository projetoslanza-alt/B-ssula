-- Migration local: 006_support.sql
-- Gerado por build-local-migrations.ts

-- source: 20250704140000_user_ui_preferences.sql
CREATE TABLE IF NOT EXISTS user_ui_preferences (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pref_key TEXT NOT NULL,
  pref_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id, pref_key)
);







ALTER TABLE support_kanban_transitions
  ADD COLUMN IF NOT EXISTS rules JSONB NOT NULL DEFAULT '{}'::jsonb;
