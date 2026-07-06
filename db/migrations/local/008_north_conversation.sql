-- Migration local: 008_north_conversation.sql
-- Gerado por build-local-migrations.ts

-- source: 20250703160000_route_checkins.sql
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

-- source: 20250706120000_support_north_completion.sql
-- Conclusão: anexos privados, admin chamados, autoavaliação imutável

ALTER TABLE support_question_templates
  ADD COLUMN IF NOT EXISTS help_text TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE support_ticket_attachments
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

CREATE TABLE IF NOT EXISTS support_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  queue_slug TEXT,
  category_id UUID REFERENCES support_categories(id) ON DELETE SET NULL,
  audience TEXT NOT NULL DEFAULT 'internal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  fixture_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_queue_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  queue_slug TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  backup_assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scope TEXT,
  schedule_note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  fixture_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, queue_slug, assignee_id)
);

CREATE TABLE IF NOT EXISTS one_on_one_self_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES one_on_one_meetings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id),
  responses JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, employee_id, version)
);



CREATE INDEX IF NOT EXISTS idx_support_canned_tenant ON support_canned_responses(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_support_queue_assignees ON support_queue_assignees(tenant_id, queue_slug);
CREATE INDEX IF NOT EXISTS idx_ooo_self_assessment_meeting ON one_on_one_self_assessments(meeting_id);
