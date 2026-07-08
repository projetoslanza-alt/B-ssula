-- Aliases e permissões adicionais para administração educacional
INSERT INTO permissions (code, name, module, description) VALUES
  ('learning.course.manage', 'Gerenciar cursos', 'learning', 'Administrar cursos da Universidade (alias operacional de criação/edição)'),
  ('learning.lesson.manage', 'Gerenciar aulas', 'learning', 'Administrar aulas e conteúdos de cursos'),
  ('learning.progress.view', 'Ver progresso dos alunos', 'learning', 'Visualizar progresso educacional da organização')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('learning_admin', 'org_admin', 'platform_admin')
  AND p.code IN ('learning.course.manage', 'learning.lesson.manage', 'learning.progress.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;
