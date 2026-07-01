-- Gamificação: ledger imutável, campanhas, missões, conquistas e ranking
-- Plataforma Bússola by VendasComCiência

CREATE TYPE gamification_campaign_status AS ENUM ('draft', 'published', 'paused', 'closed');
CREATE TYPE gamification_event_source AS ENUM (
  'learning_lesson_completed',
  'learning_assessment_passed',
  'learning_course_completed',
  'learning_certificate_issued',
  'learning_path_completed',
  'manual_adjustment',
  'campaign_rule',
  'mission_completed',
  'achievement_unlocked'
);

CREATE TABLE gamification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fixture_key TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status gamification_campaign_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  published_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug),
  UNIQUE (tenant_id, fixture_key)
);

CREATE TABLE gamification_campaign_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES gamification_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (campaign_id, user_id)
);

CREATE TABLE gamification_campaign_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES gamification_campaigns(id) ON DELETE CASCADE,
  event_source gamification_event_source NOT NULL,
  points INTEGER NOT NULL CHECK (points >= 0),
  max_occurrences INTEGER,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gamification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES gamification_campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_source gamification_event_source NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  idempotency_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE gamification_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES gamification_campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES gamification_events(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES gamification_campaign_rules(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  balance_after INTEGER,
  source gamification_event_source NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  compensates_ledger_id UUID REFERENCES gamification_points_ledger(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gamification_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES gamification_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_points INTEGER,
  settings JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gamification_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES gamification_missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  progress_value INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, user_id)
);

CREATE TABLE gamification_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES gamification_campaigns(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_reward INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE gamification_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES gamification_achievements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (achievement_id, user_id)
);

CREATE TABLE gamification_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES gamification_campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gamification_rank_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES gamification_campaigns(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rankings JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE gamification_manual_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES gamification_campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ledger_id UUID REFERENCES gamification_points_ledger(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gamification_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gamification_ledger_user ON gamification_points_ledger (tenant_id, user_id, created_at DESC);
CREATE INDEX idx_gamification_ledger_campaign ON gamification_points_ledger (campaign_id, created_at DESC);
CREATE INDEX idx_gamification_events_user ON gamification_events (tenant_id, user_id, occurred_at DESC);

-- Permissões de gamificação
INSERT INTO permissions (code, name, module, description) VALUES
  ('gamification.view', 'Visualizar gamificação', 'gamification', 'Acesso ao módulo'),
  ('gamification.view_own', 'Visualizar gamificação própria', 'gamification', 'Campanha e pontos próprios'),
  ('gamification.view_team', 'Visualizar gamificação da equipe', 'gamification', 'Ranking e progresso da equipe'),
  ('gamification.view_all', 'Visualizar toda gamificação', 'gamification', 'Visão completa do tenant'),
  ('gamification.ranking.view', 'Visualizar ranking', 'gamification', 'Pódio e posições'),
  ('gamification.missions.view', 'Visualizar missões', 'gamification', 'Missões ativas'),
  ('gamification.achievements.view', 'Visualizar conquistas', 'gamification', 'Conquistas desbloqueadas'),
  ('gamification.campaign.create', 'Criar campanha', 'gamification', 'Nova campanha'),
  ('gamification.campaign.edit', 'Editar campanha', 'gamification', 'Regras e participantes'),
  ('gamification.campaign.publish', 'Publicar campanha', 'gamification', 'Ativar campanha'),
  ('gamification.campaign.pause', 'Pausar campanha', 'gamification', 'Pausar campanha'),
  ('gamification.campaign.close', 'Encerrar campanha', 'gamification', 'Fechar campanha'),
  ('gamification.points.adjust', 'Ajustar pontuação', 'gamification', 'Lançamento compensatório'),
  ('gamification.rewards.manage', 'Gerir premiações', 'gamification', 'Recompensas'),
  ('gamification.audit.view', 'Auditoria gamificação', 'gamification', 'Logs administrativos'),
  ('gamification.export', 'Exportar gamificação', 'gamification', 'Exportar ranking')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE gamification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_campaign_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_rank_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_manual_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_audit_events ENABLE ROW LEVEL SECURITY;

-- RLS básico por tenant
CREATE POLICY gamification_campaigns_tenant ON gamification_campaigns
  FOR ALL USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

CREATE POLICY gamification_ledger_read ON gamification_points_ledger
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND is_member_of_tenant(tenant_id)
    AND (
      user_id = auth.uid()
      OR has_permission('gamification.view_all')
      OR has_permission('gamification.view_team')
    )
  );

CREATE POLICY gamification_ledger_insert ON gamification_points_ledger
  FOR INSERT WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('gamification.points.adjust'));

CREATE POLICY gamification_participants_tenant ON gamification_campaign_participants
  FOR ALL USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

CREATE POLICY gamification_events_tenant ON gamification_events
  FOR ALL USING (tenant_id = user_active_tenant_id() AND is_member_of_tenant(tenant_id));

CREATE POLICY gamification_missions_tenant ON gamification_missions
  FOR SELECT USING (tenant_id = user_active_tenant_id());

CREATE POLICY gamification_mission_progress_own ON gamification_mission_progress
  FOR ALL USING (tenant_id = user_active_tenant_id() AND (user_id = auth.uid() OR has_permission('gamification.view_all')));

CREATE POLICY gamification_achievements_tenant ON gamification_achievements
  FOR SELECT USING (tenant_id = user_active_tenant_id());

CREATE POLICY gamification_user_achievements_own ON gamification_user_achievements
  FOR SELECT USING (tenant_id = user_active_tenant_id() AND (user_id = auth.uid() OR has_permission('gamification.view_all')));

CREATE POLICY gamification_audit_admin ON gamification_audit_events
  FOR SELECT USING (tenant_id = user_active_tenant_id() AND has_permission('gamification.audit.view'));
