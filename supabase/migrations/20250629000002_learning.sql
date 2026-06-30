-- Domínio Universidade: catálogo, cursos, progresso e atribuições

CREATE TYPE course_status AS ENUM ('draft', 'in_review', 'published', 'suspended', 'archived');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE visibility_rule_type AS ENUM ('organization', 'position', 'team', 'unit', 'user', 'manager', 'director');
CREATE TYPE content_type AS ENUM ('text', 'video', 'audio', 'image', 'pdf', 'presentation', 'file', 'link', 'checklist', 'assessment', 'live', 'interactive');
CREATE TYPE lesson_completion_rule AS ENUM ('manual', 'text_read', 'video_percent', 'file_accessed', 'link_accessed', 'checklist', 'assessment', 'term_accepted');
CREATE TYPE enrollment_status AS ENUM ('not_started', 'in_progress', 'completed', 'overdue', 'waived', 'failed', 'expired');
CREATE TYPE enrollment_origin AS ENUM ('voluntary', 'manager', 'action_plan', 'one_on_one', 'automation', 'position', 'team', 'onboarding', 'admin', 'recommendation');
CREATE TYPE assignment_target_type AS ENUM ('user', 'team', 'position', 'unit', 'organization', 'new_hire');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');

-- Categorias
CREATE TABLE learning_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  slug TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

CREATE UNIQUE INDEX idx_learning_categories_slug ON learning_categories (
  COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), slug
);

-- Trilhas
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES learning_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  image_url TEXT,
  target_audience TEXT,
  sequential BOOLEAN NOT NULL DEFAULT false,
  certificate_enabled BOOLEAN NOT NULL DEFAULT false,
  status course_status NOT NULL DEFAULT 'draft',
  is_global BOOLEAN NOT NULL DEFAULT false,
  workload_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  archived_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_learning_paths_slug ON learning_paths (
  COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), slug
);

-- Cursos (identidade estável)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES learning_categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  current_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  archived_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_courses_slug ON courses (
  COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), slug
);

-- Versões de curso
CREATE TABLE course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_url TEXT,
  objectives TEXT,
  target_audience TEXT,
  prerequisites TEXT,
  instructor_id UUID REFERENCES profiles(id),
  level course_level NOT NULL DEFAULT 'beginner',
  workload_minutes INTEGER NOT NULL DEFAULT 0,
  passing_score NUMERIC(5,2) CHECK (passing_score IS NULL OR (passing_score >= 0 AND passing_score <= 100)),
  certificate_enabled BOOLEAN NOT NULL DEFAULT false,
  certificate_validity_days INTEGER,
  visibility_type TEXT NOT NULL DEFAULT 'organization',
  status course_status NOT NULL DEFAULT 'draft',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  format TEXT NOT NULL DEFAULT 'online',
  completion_rules JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE (course_id, version_number)
);

ALTER TABLE courses ADD CONSTRAINT fk_courses_current_version
  FOREIGN KEY (current_version_id) REFERENCES course_versions(id) ON DELETE SET NULL;

-- Trilha ↔ Cursos
CREATE TABLE learning_path_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (learning_path_id, course_id)
);

-- Módulos (ligados à versão)
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  course_version_id UUID NOT NULL REFERENCES course_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aulas
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type TEXT NOT NULL DEFAULT 'content',
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  completion_rule lesson_completion_rule NOT NULL DEFAULT 'manual',
  completion_config JSONB NOT NULL DEFAULT '{"min_video_percent": 90}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conteúdos da aula
CREATE TABLE lesson_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content_type content_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  file_url TEXT,
  external_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL
);

CREATE TABLE course_tags (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, tag_id)
);

-- Visibilidade
CREATE TABLE course_visibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rule_type visibility_rule_type NOT NULL,
  target_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instrutores
CREATE TABLE course_instructors (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (course_id, instructor_id)
);

-- Pré-requisitos
CREATE TABLE course_prerequisites (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, prerequisite_course_id),
  CHECK (course_id != prerequisite_course_id)
);

-- Vínculo técnico usuário-curso (course_enrollments)
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_version_id UUID NOT NULL REFERENCES course_versions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_origin enrollment_origin NOT NULL DEFAULT 'voluntary',
  assigned_by UUID REFERENCES profiles(id),
  mandatory BOOLEAN NOT NULL DEFAULT false,
  due_at TIMESTAMPTZ,
  status enrollment_status NOT NULL DEFAULT 'not_started',
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_access_at TIMESTAMPTZ,
  last_lesson_id UUID REFERENCES lessons(id),
  last_content_id UUID REFERENCES lesson_contents(id),
  waived_at TIMESTAMPTZ,
  waived_by UUID REFERENCES profiles(id),
  waive_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, course_id, course_version_id)
);

CREATE INDEX idx_enrollments_user ON course_enrollments(tenant_id, user_id, status);
CREATE INDEX idx_enrollments_course ON course_enrollments(tenant_id, course_id);

-- Atribuições
CREATE TABLE course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  target_type assignment_target_type NOT NULL,
  target_id UUID,
  mandatory BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  course_version_id UUID REFERENCES course_versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (course_id IS NOT NULL OR learning_path_id IS NOT NULL)
);

-- Progresso por aula
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status progress_status NOT NULL DEFAULT 'not_started',
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  video_position_seconds INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_access_at TIMESTAMPTZ,
  UNIQUE (enrollment_id, lesson_id)
);

-- Progresso por conteúdo
CREATE TABLE content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES lesson_contents(id) ON DELETE CASCADE,
  status progress_status NOT NULL DEFAULT 'not_started',
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  video_position_seconds INTEGER NOT NULL DEFAULT 0,
  accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (enrollment_id, content_id)
);

-- Sessões de estudo
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Favoritos
CREATE TABLE course_favorites (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

-- Avaliações de curso (reviews)
CREATE TABLE course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_score SMALLINT CHECK (content_score BETWEEN 1 AND 5),
  clarity_score SMALLINT CHECK (clarity_score BETWEEN 1 AND 5),
  usefulness TEXT CHECK (usefulness IN ('yes', 'partial', 'no')),
  recommendation BOOLEAN,
  comment TEXT,
  hidden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, course_id, user_id)
);

-- Modelos preparatórios (fases futuras)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  course_version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assessment_type TEXT NOT NULL,
  passing_score NUMERIC(5,2),
  max_attempts INTEGER,
  time_limit_minutes INTEGER,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_config JSONB NOT NULL DEFAULT '{}',
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  learning_path_id UUID REFERENCES learning_paths(id),
  course_version_id UUID REFERENCES course_versions(id),
  validation_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'expired')),
  file_url TEXT,
  template_id UUID REFERENCES certificate_templates(id),
  UNIQUE (tenant_id, user_id, course_id, course_version_id)
);

CREATE TABLE learning_action_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_module TEXT NOT NULL,
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Busca textual
ALTER TABLE course_versions ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(short_description, '')), 'C')
  ) STORED;

CREATE INDEX idx_course_versions_search ON course_versions USING GIN (search_vector);
CREATE INDEX idx_course_versions_tenant_status ON course_versions(tenant_id, status);
CREATE INDEX idx_courses_tenant ON courses(tenant_id);

-- Função: calcular progresso do curso
CREATE OR REPLACE FUNCTION recalculate_enrollment_progress(p_enrollment_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_percent NUMERIC;
  v_enrollment course_enrollments%ROWTYPE;
BEGIN
  SELECT * INTO v_enrollment FROM course_enrollments WHERE id = p_enrollment_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  SELECT COUNT(*) INTO v_total
  FROM lessons l
  JOIN course_modules m ON m.id = l.module_id
  WHERE m.course_version_id = v_enrollment.course_version_id AND l.required = true;

  IF v_total = 0 THEN RETURN 0; END IF;

  SELECT COUNT(*) INTO v_completed
  FROM lesson_progress lp
  JOIN lessons l ON l.id = lp.lesson_id
  WHERE lp.enrollment_id = p_enrollment_id
    AND lp.status = 'completed'
    AND l.required = true;

  v_percent := ROUND((v_completed::NUMERIC / v_total::NUMERIC) * 100, 2);

  UPDATE course_enrollments SET
    progress_percentage = GREATEST(progress_percentage, v_percent),
    status = CASE
      WHEN v_percent >= 100 THEN 'completed'::enrollment_status
      WHEN v_percent > 0 THEN 'in_progress'::enrollment_status
      ELSE status
    END,
    completed_at = CASE WHEN v_percent >= 100 AND completed_at IS NULL THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_enrollment_id;

  RETURN v_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: atualizar status atrasado
CREATE OR REPLACE FUNCTION update_overdue_enrollments()
RETURNS void AS $$
BEGIN
  UPDATE course_enrollments
  SET status = 'overdue', updated_at = now()
  WHERE mandatory = true
    AND due_at IS NOT NULL
    AND due_at < now()
    AND status IN ('not_started', 'in_progress');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER course_versions_updated_at BEFORE UPDATE ON course_versions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER course_enrollments_updated_at BEFORE UPDATE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
