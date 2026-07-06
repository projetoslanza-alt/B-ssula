-- Migration local: 009_gamification.sql
-- Gerado por build-local-migrations.ts

-- source: 20250702130000_gamification.sql
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
