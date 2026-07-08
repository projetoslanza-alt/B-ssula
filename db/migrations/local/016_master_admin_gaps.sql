-- Migration local: 016_master_admin_gaps.sql
-- Permissão reports.export + desativação granular de módulos/aulas/conteúdos

INSERT INTO permissions (code, name, module, description) VALUES
  ('reports.export', 'Exportar relatórios', 'reports', 'Exportar relatórios em CSV e outros formatos')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_course_modules_active ON course_modules (course_version_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lessons_active ON lessons (module_id, is_active);
