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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  52428800,
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'application/pdf',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_support_canned_tenant ON support_canned_responses(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_support_queue_assignees ON support_queue_assignees(tenant_id, queue_slug);
CREATE INDEX IF NOT EXISTS idx_ooo_self_assessment_meeting ON one_on_one_self_assessments(meeting_id);

ALTER TABLE support_canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_queue_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_self_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_canned_tenant ON support_canned_responses FOR ALL
  USING (tenant_id = user_active_tenant_id());

CREATE POLICY support_queue_assignees_tenant ON support_queue_assignees FOR ALL
  USING (tenant_id = user_active_tenant_id());

CREATE POLICY ooo_self_assessment_tenant ON one_on_one_self_assessments FOR ALL
  USING (tenant_id = user_active_tenant_id());
