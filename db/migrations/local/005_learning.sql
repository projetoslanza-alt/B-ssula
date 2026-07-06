-- Migration local: 005_learning.sql
-- Gerado por build-local-migrations.ts

-- source: 20250629000002_learning.sql
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
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', '

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

-- source: 20250629130000_etapa3_versioning_security.sql
-- Etapa 3: versionamento de cursos, publicação transacional e reforços multi-tenant
-- Nota: 20250629120000_security_fixes.sql usa timestamp jun/2025 herdado da sequência inicial;
-- este arquivo (20250629130000) mantém ordenação cronológica sem renomear migrations já aplicadas.

ALTER TYPE course_status ADD VALUE IF NOT EXISTS 'superseded' AFTER 'published';

-- Capa: armazenar referência de storage (não URL assinada permanente)
ALTER TABLE course_versions
  ADD COLUMN IF NOT EXISTS cover_bucket TEXT,
  ADD COLUMN IF NOT EXISTS cover_path TEXT;

COMMENT ON COLUMN course_versions.cover_url IS 'Legado ou URL externa; preferir cover_bucket + cover_path';
COMMENT ON COLUMN course_versions.cover_bucket IS 'Bucket Supabase Storage da capa';
COMMENT ON COLUMN course_versions.cover_path IS 'Path no bucket da capa';

-- Impedir módulo apontando para versão de outro tenant (via trigger existente + CHECK indireto)
CREATE OR REPLACE FUNCTION enforce_module_version_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_version_tenant UUID;
BEGIN
  SELECT tenant_id INTO v_version_tenant
  FROM course_versions WHERE id = NEW.course_version_id;
  IF v_version_tenant IS NULL THEN
    RAISE EXCEPTION 'versão de curso inexistente';
  END IF;
  IF NEW.tenant_id IS NOT NULL AND NEW.tenant_id != v_version_tenant THEN
    RAISE EXCEPTION 'módulo não pertence ao tenant da versão';
  END IF;
  NEW.tenant_id := v_version_tenant;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_modules_version_tenant ON course_modules;
CREATE TRIGGER course_modules_version_tenant
  BEFORE INSERT OR UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION enforce_module_version_tenant();

-- Progresso: enrollment não aceita percentual arbitrário do cliente
CREATE OR REPLACE FUNCTION protect_enrollment_progress_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.progress_percentage IS DISTINCT FROM OLD.progress_percentage
       AND NEW.progress_percentage > OLD.progress_percentage + 0.01
       AND current_setting('bussola.internal_progress', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'progress_percentage só pode ser atualizado pelo servidor';
    END IF;
    IF NEW.completed_at IS DISTINCT FROM OLD.completed_at
       AND NEW.status = 'completed'
       AND current_setting('bussola.internal_progress', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'conclusão só pode ser definida pelo servidor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_progress_protect ON course_enrollments;
CREATE TRIGGER enrollment_progress_protect
  BEFORE UPDATE ON course_enrollments
  FOR EACH ROW EXECUTE FUNCTION protect_enrollment_progress_fields();

-- recalculate com flag interna
CREATE OR REPLACE FUNCTION recalculate_enrollment_progress(p_enrollment_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_percent NUMERIC;
  v_enrollment course_enrollments%ROWTYPE;
BEGIN
  SELECT * INTO v_enrollment FROM course_enrollments WHERE id = p_enrollment_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_enrollment.user_id IS DISTINCT FROM NULL::uuid
     AND NOT has_permission('learning.team.read')
     AND NOT has_permission('learning.reports.read') THEN
    RETURN 0;
  END IF;

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

  PERFORM set_config('bussola.internal_progress', 'true', true);
  UPDATE course_enrollments SET
    progress_percentage = v_percent,
    status = CASE
      WHEN v_percent >= 100 THEN 'completed'::enrollment_status
      WHEN v_percent > 0 THEN 'in_progress'::enrollment_status
      ELSE status
    END,
    completed_at = CASE WHEN v_percent >= 100 AND completed_at IS NULL THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_enrollment_id;
  PERFORM set_config('bussola.internal_progress', 'false', true);

  RETURN v_percent;
END;
$$;

-- Copia estrutura da versão publicada vigente para novo rascunho (idempotente)
CREATE OR REPLACE FUNCTION create_course_draft_from_published(p_course_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course courses%ROWTYPE;
  v_source course_versions%ROWTYPE;
  v_existing_draft UUID;
  v_new_version_id UUID;
  v_module RECORD;
  v_new_module_id UUID;
  v_lesson RECORD;
  v_new_lesson_id UUID;
  v_content RECORD;
BEGIN
  IF NOT has_permission('learning.course.create') THEN
    RAISE EXCEPTION 'sem permissão para editar curso';
  END IF;

  SELECT * INTO v_course FROM courses
  WHERE id = p_course_id AND tenant_id = user_active_tenant_id()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'curso não encontrado'; END IF;

  SELECT id INTO v_existing_draft FROM course_versions
  WHERE course_id = p_course_id AND status IN ('draft', 'in_review')
  ORDER BY version_number DESC LIMIT 1;

  IF v_existing_draft IS NOT NULL THEN
    RETURN v_existing_draft;
  END IF;

  SELECT * INTO v_source FROM course_versions
  WHERE id = v_course.current_version_id AND status = 'published';

  IF NOT FOUND THEN
    IF v_course.current_version_id IS NOT NULL THEN
      SELECT * INTO v_source FROM course_versions WHERE id = v_course.current_version_id;
      IF v_source.status IN ('draft', 'in_review') THEN
        RETURN v_source.id;
      END IF;
    END IF;
    RAISE EXCEPTION 'nenhuma versão publicada para copiar';
  END IF;

  INSERT INTO course_versions (
    tenant_id, course_id, version_number, title, description, short_description,
    cover_url, cover_bucket, cover_path, objectives, target_audience, prerequisites,
    instructor_id, level, workload_minutes, passing_score, certificate_enabled,
    certificate_validity_days, visibility_type, status, language, format, completion_rules,
    created_by
  )
  VALUES (
    v_source.tenant_id, p_course_id, v_source.version_number + 1,
    v_source.title, v_source.description, v_source.short_description,
    v_source.cover_url, v_source.cover_bucket, v_source.cover_path,
    v_source.objectives, v_source.target_audience, v_source.prerequisites,
    v_source.instructor_id, v_source.level, v_source.workload_minutes, v_source.passing_score,
    v_source.certificate_enabled, v_source.certificate_validity_days, v_source.visibility_type,
    'draft', v_source.language, v_source.format, v_source.completion_rules,
    NULL::uuid
  )
  RETURNING id INTO v_new_version_id;

  FOR v_module IN
    SELECT * FROM course_modules WHERE course_version_id = v_source.id ORDER BY sort_order
  LOOP
    INSERT INTO course_modules (tenant_id, course_version_id, title, description, sort_order, required)
    VALUES (v_module.tenant_id, v_new_version_id, v_module.title, v_module.description, v_module.sort_order, v_module.required)
    RETURNING id INTO v_new_module_id;

    FOR v_lesson IN
      SELECT * FROM lessons WHERE module_id = v_module.id ORDER BY sort_order
    LOOP
      INSERT INTO lessons (
        tenant_id, module_id, title, description, lesson_type, duration_minutes,
        required, completion_rule, completion_config, sort_order
      )
      VALUES (
        v_lesson.tenant_id, v_new_module_id, v_lesson.title, v_lesson.description,
        v_lesson.lesson_type, v_lesson.duration_minutes, v_lesson.required,
        v_lesson.completion_rule, v_lesson.completion_config, v_lesson.sort_order
      )
      RETURNING id INTO v_new_lesson_id;

      FOR v_content IN
        SELECT * FROM lesson_contents WHERE lesson_id = v_lesson.id ORDER BY sort_order
      LOOP
        INSERT INTO lesson_contents (
          tenant_id, lesson_id, content_type, title, content, file_path, file_url,
          external_url, metadata, sort_order, required
        )
        VALUES (
          v_content.tenant_id, v_new_lesson_id, v_content.content_type, v_content.title,
          v_content.content, v_content.file_path, v_content.file_url, v_content.external_url,
          v_content.metadata, v_content.sort_order, v_content.required
        );
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN v_new_version_id;
END;
$$;

-- Publicação transacional com supersede da versão anterior
CREATE OR REPLACE FUNCTION publish_course_version(p_course_id UUID, p_version_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course courses%ROWTYPE;
  v_version_id UUID;
  v_version course_versions%ROWTYPE;
  v_old_published UUID;
  v_module_count INTEGER;
  v_lesson_count INTEGER;
BEGIN
  IF NOT has_permission('learning.course.publish') THEN
    RAISE EXCEPTION 'sem permissão para publicar';
  END IF;

  SELECT * INTO v_course FROM courses
  WHERE id = p_course_id AND tenant_id = user_active_tenant_id()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'curso não encontrado'; END IF;

  v_version_id := COALESCE(p_version_id, v_course.current_version_id);

  SELECT * INTO v_version FROM course_versions
  WHERE id = v_version_id AND course_id = p_course_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'versão não encontrada'; END IF;

  IF v_version.status NOT IN ('draft', 'in_review') THEN
    RAISE EXCEPTION 'apenas rascunhos podem ser publicados';
  END IF;

  SELECT COUNT(*) INTO v_module_count FROM course_modules WHERE course_version_id = v_version_id;
  IF v_module_count < 1 THEN RAISE EXCEPTION 'adicione pelo menos um módulo'; END IF;

  SELECT COUNT(*) INTO v_lesson_count
  FROM lessons l
  JOIN course_modules m ON m.id = l.module_id
  WHERE m.course_version_id = v_version_id;

  IF v_lesson_count < 1 THEN RAISE EXCEPTION 'adicione pelo menos uma aula'; END IF;

  SELECT id INTO v_old_published FROM course_versions
  WHERE course_id = p_course_id AND status = 'published' AND id != v_version_id
  LIMIT 1;

  IF v_old_published IS NOT NULL THEN
    UPDATE course_versions SET status = 'superseded', updated_at = now()
    WHERE id = v_old_published;
  END IF;

  UPDATE course_versions SET
    status = 'published',
    published_at = now(),
    updated_at = now()
  WHERE id = v_version_id;

  UPDATE courses SET current_version_id = v_version_id, updated_at = now()
  WHERE id = p_course_id;

  RETURN v_version_id;
END;
$$;

-- source: 20250701120000_learning_video_assessments_certificates.sql
-- Vídeo progress detalhado, avaliações estruturadas, certificados com snapshot e buckets dedicados

-- Perfil: assinatura do instrutor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_storage_path TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Versão do curso: publicador
ALTER TABLE course_versions ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES profiles(id);

-- Mídia importada (idempotência de vídeos)
CREATE TABLE IF NOT EXISTS learning_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fixture_key TEXT,
  bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  checksum_sha256 TEXT,
  import_status TEXT NOT NULL DEFAULT 'pending' CHECK (import_status IN ('pending', 'uploading', 'ready', 'failed')),
  import_source TEXT,
  import_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, fixture_key),
  UNIQUE (bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_learning_media_assets_tenant ON learning_media_assets(tenant_id);

-- Progresso de vídeo detalhado
CREATE TABLE IF NOT EXISTS learning_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES lesson_contents(id) ON DELETE CASCADE,
  media_asset_id UUID REFERENCES learning_media_assets(id) ON DELETE SET NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  current_position_seconds INTEGER NOT NULL DEFAULT 0,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  watch_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (watch_percentage >= 0 AND watch_percentage <= 100),
  started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_video_progress_user ON learning_video_progress(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_learning_video_progress_enrollment ON learning_video_progress(enrollment_id);

-- Questões de avaliação
CREATE TABLE IF NOT EXISTS learning_assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, sort_order)
);

CREATE TABLE IF NOT EXISTS learning_assessment_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES learning_assessment_questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  feedback TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, sort_order)
);

CREATE TABLE IF NOT EXISTS learning_assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  score NUMERIC(5,2),
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, assessment_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_learning_assessment_attempts_user ON learning_assessment_attempts(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS learning_assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES learning_assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES learning_assessment_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES learning_assessment_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

-- Certificados: snapshots e storage
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_name_snapshot TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_title_snapshot TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS workload_hours_snapshot INTEGER;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS instructor_user_id UUID REFERENCES profiles(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS instructor_name_snapshot TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS instructor_role_snapshot TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS instructor_signature_snapshot TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS institution_snapshot TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS city_snapshot TEXT DEFAULT 'Belo Horizonte';
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS final_score_snapshot NUMERIC(5,2);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS file_bucket TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS 
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS 
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS 

-- Buckets dedicados

-- Permissões adicionais
INSERT INTO permissions (code, name, module, description) VALUES
  ('learning.media.manage', 'Gerenciar mídias', 'learning', 'Upload e importação de vídeos'),
  ('learning.media.view', 'Visualizar mídias', 'learning', 'Acesso a mídias de aprendizagem'),
  ('learning.assessment.take', 'Realizar avaliações', 'learning', 'Responder avaliações'),
  ('learning.assessment.results.view_own', 'Ver próprios resultados', 'learning', 'Ver notas e tentativas próprias'),
  ('learning.assessment.results.view_team', 'Ver resultados da equipe', 'learning', 'Ver notas da equipe autorizada'),
  ('learning.assessment.results.view_all', 'Ver todos resultados', 'learning', 'Ver notas do tenant'),
  ('learning.certificate.view_own', 'Ver próprios certificados', 'learning', 'Visualizar certificados próprios'),
  ('learning.certificate.view_team', 'Ver certificados da equipe', 'learning', 'Visualizar certificados da equipe'),
  ('learning.certificate.view_all', 'Ver todos certificados', 'learning', 'Visualizar certificados do tenant'),
  ('learning.certificate.issue', 'Emitir certificados', 'learning', 'Emitir certificados autorizados'),
  ('learning.certificate.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'student' AND p.code IN (
  'learning.assessment.take', 'learning.assessment.results.view_own',
  'learning.certificate.view_own', 'learning.media.view',
  'profile.view_own', 'profile.update_own'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'instructor' AND p.code IN (
  'learning.media.manage', 'learning.media.view', 'learning.assessment.manage',
  'learning.assessment.results.view_team', 'learning.certificate.view_team',
  'learning.course.assign_instructor', 'learning.enrollment.manage'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'learning_admin' AND p.code LIKE 'learning.%'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'org_admin' AND p.code LIKE 'learning.%'
ON CONFLICT DO NOTHING;

-- Storage policies

-- Cálculo de nota agregada (melhor tentativa por avaliação)
CREATE OR REPLACE FUNCTION calculate_course_score(p_enrollment_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment course_enrollments%ROWTYPE;
  v_total_questions INTEGER := 0;
  v_correct INTEGER := 0;
  v_assessment assessments%ROWTYPE;
  v_best_correct INTEGER;
  v_assessment_questions INTEGER;
BEGIN
  SELECT * INTO v_enrollment FROM course_enrollments WHERE id = p_enrollment_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_enrollment.user_id IS DISTINCT FROM NULL::uuid
     AND NOT has_permission('learning.reports.read')
     AND NOT has_permission('learning.assessment.results.view_team') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_assessment IN
    SELECT a.* FROM assessments a
    WHERE a.course_version_id = v_enrollment.course_version_id
  LOOP
    SELECT COUNT(*) INTO v_assessment_questions
    FROM learning_assessment_questions q WHERE q.assessment_id = v_assessment.id;

    v_total_questions := v_total_questions + v_assessment_questions;

    SELECT COALESCE(MAX(att.correct_count), 0) INTO v_best_correct
    FROM learning_assessment_attempts att
    WHERE att.enrollment_id = p_enrollment_id
      AND att.assessment_id = v_assessment.id
      AND att.status = 'submitted';

    v_correct := v_correct + v_best_correct;
  END LOOP;

  IF v_total_questions = 0 THEN RETURN 0; END IF;
  RETURN ROUND((v_correct::NUMERIC / v_total_questions::NUMERIC) * 100, 2);
END;
$$;

-- Elegibilidade para certificado
CREATE OR REPLACE FUNCTION evaluate_certificate_eligibility(p_enrollment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment course_enrollments%ROWTYPE;
  v_version course_versions%ROWTYPE;
  v_final_score NUMERIC;
  v_missing_lessons JSONB := '[]'::jsonb;
  v_missing_assessments JSONB := '[]'::jsonb;
  v_missing_videos JSONB := '[]'::jsonb;
  v_min_video_percent NUMERIC := 90;
  v_min_score NUMERIC := 70;
  v_lesson RECORD;
  v_assessment RECORD;
  v_submitted_count INTEGER;
  v_required_assessments INTEGER;
BEGIN
  SELECT * INTO v_enrollment FROM course_enrollments WHERE id = p_enrollment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'enrollment_not_found');
  END IF;

  IF v_enrollment.user_id IS DISTINCT FROM NULL::uuid
     AND NOT has_permission('learning.certificate.issue') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_version FROM course_versions WHERE id = v_enrollment.course_version_id;
  IF v_version.status IS DISTINCT FROM 'published' OR NOT v_version.certificate_enabled THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'course_not_certifiable');
  END IF;

  v_min_score := COALESCE(v_version.passing_score, 70);

  FOR v_lesson IN
    SELECT l.id, l.title, l.completion_config
    FROM lessons l
    JOIN course_modules m ON m.id = l.module_id
    WHERE m.course_version_id = v_enrollment.course_version_id AND l.required = true
  LOOP
  v_min_video_percent := COALESCE((v_lesson.completion_config->>'min_video_percent')::NUMERIC, 90);

    IF NOT EXISTS (
      SELECT 1 FROM lesson_progress lp
      WHERE lp.enrollment_id = p_enrollment_id AND lp.lesson_id = v_lesson.id AND lp.status = 'completed'
    ) THEN
      v_missing_lessons := v_missing_lessons || jsonb_build_array(jsonb_build_object('lesson_id', v_lesson.id, 'title', v_lesson.title));
    END IF;

    IF EXISTS (
      SELECT 1 FROM lesson_contents lc
      WHERE lc.lesson_id = v_lesson.id AND lc.content_type = 'video' AND lc.required = true
    ) AND NOT EXISTS (
      SELECT 1 FROM learning_video_progress vp
      JOIN lesson_contents lc ON lc.id = vp.content_id
      WHERE vp.enrollment_id = p_enrollment_id
        AND vp.lesson_id = v_lesson.id
        AND vp.watch_percentage >= v_min_video_percent
    ) THEN
      v_missing_videos := v_missing_videos || jsonb_build_array(jsonb_build_object('lesson_id', v_lesson.id, 'title', v_lesson.title));
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO v_required_assessments
  FROM assessments a WHERE a.course_version_id = v_enrollment.course_version_id;

  FOR v_assessment IN
    SELECT a.id, a.title FROM assessments a WHERE a.course_version_id = v_enrollment.course_version_id
  LOOP
    SELECT COUNT(*) INTO v_submitted_count
    FROM learning_assessment_attempts att
    WHERE att.enrollment_id = p_enrollment_id
      AND att.assessment_id = v_assessment.id
      AND att.status = 'submitted';

    IF v_submitted_count = 0 THEN
      v_missing_assessments := v_missing_assessments || jsonb_build_array(jsonb_build_object('assessment_id', v_assessment.id, 'title', v_assessment.title));
    END IF;
  END LOOP;

  v_final_score := calculate_course_score(p_enrollment_id);

  RETURN jsonb_build_object(
    'eligible',
      jsonb_array_length(v_missing_lessons) = 0
      AND jsonb_array_length(v_missing_assessments) = 0
      AND jsonb_array_length(v_missing_videos) = 0
      AND v_final_score >= v_min_score
      AND v_enrollment.progress_percentage >= 100,
    'final_score', v_final_score,
    'minimum_score', v_min_score,
    'missing_lessons', v_missing_lessons,
    'missing_assessments', v_missing_assessments,
    'missing_video_requirements', v_missing_videos,
    'reason', CASE
      WHEN jsonb_array_length(v_missing_lessons) > 0 THEN 'incomplete_lessons'
      WHEN jsonb_array_length(v_missing_videos) > 0 THEN 'incomplete_videos'
      WHEN jsonb_array_length(v_missing_assessments) > 0 THEN 'incomplete_assessments'
      WHEN v_final_score < v_min_score THEN 'insufficient_score'
      WHEN v_enrollment.progress_percentage < 100 THEN 'incomplete_progress'
      ELSE 'eligible'
    END
  );
END;
$$;

-- Validação pública (sem dados sensíveis)
CREATE OR REPLACE FUNCTION validate_public_certificate(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cert certificates%ROWTYPE;
BEGIN
  SELECT * INTO v_cert FROM certificates WHERE upper(trim(validation_code)) = upper(trim(p_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;
  IF v_cert.status = '
  END IF;
  IF v_cert.expires_at IS NOT NULL AND v_cert.expires_at < now() THEN
    RETURN jsonb_build_object('status', 'expired', 'certificate', jsonb_build_object(
      'validation_code', v_cert.validation_code,
      'student_name_snapshot', v_cert.student_name_snapshot,
      'course_title_snapshot', v_cert.course_title_snapshot,
      'issued_at', v_cert.issued_at
    ));
  END IF;
  RETURN jsonb_build_object('status', 'valid', 'certificate', jsonb_build_object(
    'validation_code', v_cert.validation_code,
    'student_name_snapshot', v_cert.student_name_snapshot,
    'course_title_snapshot', v_cert.course_title_snapshot,
    'instructor_name_snapshot', v_cert.instructor_name_snapshot,
    'institution_snapshot', v_cert.institution_snapshot,
    'workload_hours_snapshot', v_cert.workload_hours_snapshot,
    'city_snapshot', v_cert.city_snapshot,
    'issued_at', v_cert.issued_at,
    'is_demo', v_cert.is_demo
  ));
END;
$$;
