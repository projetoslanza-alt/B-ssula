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
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES profiles(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoke_reason TEXT;

-- Buckets dedicados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('learning-videos', 'learning-videos', false, 2147483648, ARRAY['video/mp4', 'video/webm']),
  ('learning-certificates', 'learning-certificates', false, 15728640, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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
  ('learning.certificate.revoke', 'Revogar certificados', 'learning', 'Revogar certificados'),
  ('learning.certificate.template_manage', 'Gerenciar modelos', 'learning', 'Gerenciar templates de certificado'),
  ('learning.course.assign_instructor', 'Atribuir professor', 'learning', 'Definir professor do curso'),
  ('learning.enrollment.manage', 'Gerenciar matrículas', 'learning', 'Matricular e gerenciar alunos'),
  ('profile.view_own', 'Ver próprio perfil', 'core', 'Visualizar perfil próprio'),
  ('profile.update_own', 'Atualizar próprio perfil', 'core', 'Atualizar dados pessoais')
ON CONFLICT (code) DO NOTHING;

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

-- RLS
ALTER TABLE learning_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assessment_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY learning_media_assets_manage ON learning_media_assets
  FOR ALL USING (tenant_id = user_active_tenant_id() AND has_permission('learning.media.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('learning.media.manage'));

CREATE POLICY learning_media_assets_read ON learning_media_assets
  FOR SELECT USING (tenant_id = user_active_tenant_id() AND has_permission('learning.media.view'));

CREATE POLICY learning_video_progress_own ON learning_video_progress
  FOR ALL USING (
    tenant_id = user_active_tenant_id()
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM course_enrollments e
      WHERE e.id = learning_video_progress.enrollment_id AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND user_id = auth.uid()
  );

CREATE POLICY learning_video_progress_team ON learning_video_progress
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND (has_permission('learning.reports.read') OR has_permission('learning.assessment.results.view_team'))
  );

CREATE POLICY assessment_questions_read ON learning_assessment_questions
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND EXISTS (
      SELECT 1 FROM assessments a
      JOIN course_versions cv ON cv.id = a.course_version_id
      WHERE a.id = learning_assessment_questions.assessment_id
        AND (cv.status = 'published' OR has_permission('learning.assessment.manage'))
    )
  );

CREATE POLICY assessment_questions_manage ON learning_assessment_questions
  FOR ALL USING (tenant_id = user_active_tenant_id() AND has_permission('learning.assessment.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('learning.assessment.manage'));

CREATE POLICY assessment_options_read ON learning_assessment_options
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND EXISTS (
      SELECT 1 FROM learning_assessment_questions q
      WHERE q.id = learning_assessment_options.question_id
    )
  );

CREATE POLICY assessment_options_manage ON learning_assessment_options
  FOR ALL USING (tenant_id = user_active_tenant_id() AND has_permission('learning.assessment.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('learning.assessment.manage'));

CREATE POLICY assessment_attempts_own ON learning_assessment_attempts
  FOR ALL USING (
    tenant_id = user_active_tenant_id()
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND user_id = auth.uid()
  );

CREATE POLICY assessment_attempts_team ON learning_assessment_attempts
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND (has_permission('learning.reports.read') OR has_permission('learning.assessment.results.view_team'))
  );

CREATE POLICY assessment_answers_own ON learning_assessment_answers
  FOR ALL USING (
    tenant_id = user_active_tenant_id()
    AND EXISTS (
      SELECT 1 FROM learning_assessment_attempts att
      WHERE att.id = learning_assessment_answers.attempt_id AND att.user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND EXISTS (
      SELECT 1 FROM learning_assessment_attempts att
      WHERE att.id = learning_assessment_answers.attempt_id AND att.user_id = auth.uid()
    )
  );

-- assessments + certificate_templates RLS
CREATE POLICY assessments_read ON assessments
  FOR SELECT USING (
    tenant_id = user_active_tenant_id()
    AND (
      has_permission('learning.assessment.manage')
      OR EXISTS (
        SELECT 1 FROM course_versions cv
        WHERE cv.id = assessments.course_version_id AND cv.status = 'published'
      )
    )
  );

CREATE POLICY assessments_manage ON assessments
  FOR ALL USING (tenant_id = user_active_tenant_id() AND has_permission('learning.assessment.manage'))
  WITH CHECK (tenant_id = user_active_tenant_id() AND has_permission('learning.assessment.manage'));

CREATE POLICY certificate_templates_manage ON certificate_templates
  FOR ALL USING (
    (tenant_id = user_active_tenant_id() OR is_global = true)
    AND has_permission('learning.certificate.template_manage')
  );

CREATE POLICY certificates_insert ON certificates
  FOR INSERT WITH CHECK (
    tenant_id = user_active_tenant_id()
    AND (user_id = auth.uid() OR has_permission('learning.certificate.issue'))
  );

CREATE POLICY certificates_update ON certificates
  FOR UPDATE USING (
    tenant_id = user_active_tenant_id()
    AND has_permission('learning.certificate.revoke')
  );

-- Storage policies
CREATE POLICY learning_videos_upload ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'learning-videos'
    AND (storage.foldername(name))[1] = user_active_tenant_id()::text
    AND has_permission('learning.media.manage')
  );

CREATE POLICY learning_videos_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'learning-videos'
    AND (storage.foldername(name))[1] = user_active_tenant_id()::text
    AND has_permission('learning.media.view')
  );

CREATE POLICY learning_certificates_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'learning-certificates'
    AND (
      (storage.foldername(name))[1] = user_active_tenant_id()::text
      OR has_permission('learning.certificate.view_all')
    )
  );

CREATE POLICY learning_certificates_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'learning-certificates'
    AND (storage.foldername(name))[1] = user_active_tenant_id()::text
    AND has_permission('learning.certificate.issue')
  );

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

  IF v_enrollment.user_id IS DISTINCT FROM auth.uid()
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

  IF v_enrollment.user_id IS DISTINCT FROM auth.uid()
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

GRANT EXECUTE ON FUNCTION calculate_course_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION evaluate_certificate_eligibility(UUID) TO authenticated;

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
  IF v_cert.status = 'revoked' THEN
    RETURN jsonb_build_object('status', 'revoked', 'certificate', jsonb_build_object(
      'validation_code', v_cert.validation_code,
      'student_name_snapshot', v_cert.student_name_snapshot,
      'course_title_snapshot', v_cert.course_title_snapshot,
      'instructor_name_snapshot', v_cert.instructor_name_snapshot,
      'institution_snapshot', v_cert.institution_snapshot,
      'workload_hours_snapshot', v_cert.workload_hours_snapshot,
      'issued_at', v_cert.issued_at,
      'is_demo', v_cert.is_demo
    ));
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

GRANT EXECUTE ON FUNCTION validate_public_certificate(TEXT) TO anon, authenticated;
