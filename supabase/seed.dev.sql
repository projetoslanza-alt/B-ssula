-- Seed de desenvolvimento — apenas dados estruturais globais
-- Organizações, usuários e cursos são criados por: npm run qa:setup:local

INSERT INTO learning_categories (id, tenant_id, name, slug, description, is_global) VALUES
  ('55555555-5555-5555-5555-555555555551', NULL, 'Comercial', 'comercial', 'Treinamentos comerciais', true),
  ('55555555-5555-5555-5555-555555555552', NULL, 'Liderança', 'lideranca', 'Desenvolvimento de liderança', true)
ON CONFLICT DO NOTHING;

INSERT INTO learning_paths (id, tenant_id, category_id, title, slug, description, status, is_global, sequential) VALUES
  ('66666666-6666-6666-6666-666666666661', NULL, '55555555-5555-5555-5555-555555555551', 'Formação SDR', 'formacao-sdr', 'Trilha completa para SDRs', 'published', true, true)
ON CONFLICT DO NOTHING;

INSERT INTO feature_flags (tenant_id, code, enabled) VALUES
  (NULL, 'learning.assessments', false),
  (NULL, 'learning.certificates', false),
  (NULL, 'learning.gamification', false),
  (NULL, 'learning.live_sessions', false)
ON CONFLICT DO NOTHING;
