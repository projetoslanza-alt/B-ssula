-- Migration local: 010_news.sql
-- Gerado por build-local-migrations.ts

-- source: 20250703140000_news.sql
-- News: publicações, audiência, anexos e permissões

CREATE TYPE news_publication_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE news_category AS ENUM ('comunicado', 'resultado', 'reconhecimento', 'universidade', 'alerta');
CREATE TYPE news_audience_type AS ENUM ('all', 'teams', 'groups');

CREATE TABLE news_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category news_category NOT NULL DEFAULT 'comunicado',
  status news_publication_status NOT NULL DEFAULT 'draft',
  audience_type news_audience_type NOT NULL DEFAULT 'all',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  author_id UUID NOT NULL REFERENCES profiles(id),
  archived_at TIMESTAMPTZ,
  fixture_key TEXT,
  is_test_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_news_publications_tenant_status ON news_publications(tenant_id, status);
CREATE INDEX idx_news_publications_published_at ON news_publications(tenant_id, published_at DESC);
CREATE INDEX idx_news_publications_fixture ON news_publications(fixture_key) WHERE fixture_key IS NOT NULL;

CREATE TABLE news_publication_teams (
  publication_id UUID NOT NULL REFERENCES news_publications(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (publication_id, team_id)
);

CREATE TABLE news_publication_groups (
  publication_id UUID NOT NULL REFERENCES news_publications(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES access_groups(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (publication_id, group_id)
);

CREATE TABLE news_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL REFERENCES news_publications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TRIGGER news_publications_updated_at
  BEFORE UPDATE ON news_publications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Permissão administrativa de News
INSERT INTO permissions (code, name, module) VALUES
  ('news.manage', 'Gerenciar News', 'news')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code IN ('org_admin', 'platform_admin') AND p.code = 'news.manage'
ON CONFLICT DO NOTHING;

-- has_permission inclui grupos de acesso (Master, etc.)
CREATE OR REPLACE FUNCTION has_permission(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN membership_roles mr ON mr.membership_id = om.id
    JOIN role_permissions rp ON rp.role_id = mr.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE om.user_id = NULL::uuid
      AND om.tenant_id = user_active_tenant_id()
      AND om.status = 'active'
      AND p.code = p_code
  )
  OR EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN membership_access_groups mag ON mag.membership_id = om.id
    JOIN access_group_permissions agp ON agp.group_id = mag.group_id AND agp.granted = true
    JOIN permissions p ON p.id = agp.permission_id
    WHERE om.user_id = NULL::uuid
      AND om.tenant_id = user_active_tenant_id()
      AND om.status = 'active'
      AND p.code = p_code
  );
$$;

CREATE OR REPLACE FUNCTION user_can_view_news(p_pub news_publications)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_pub.tenant_id IS DISTINCT FROM user_active_tenant_id() THEN
    RETURN FALSE;
  END IF;
  IF NOT is_member_of_tenant(p_pub.tenant_id) THEN
    RETURN FALSE;
  END IF;
  IF has_permission('news.manage') THEN
    RETURN TRUE;
  END IF;
  IF p_pub.status <> 'published' THEN
    RETURN FALSE;
  END IF;
  IF p_pub.published_at IS NOT NULL AND p_pub.published_at > now() THEN
    RETURN FALSE;
  END IF;
  IF p_pub.audience_type = 'all' THEN
    RETURN TRUE;
  END IF;
  IF p_pub.audience_type = 'teams' THEN
    RETURN EXISTS (
      SELECT 1
      FROM news_publication_teams npt
      JOIN organization_memberships om
        ON om.team_id = npt.team_id
       AND om.user_id = NULL::uuid
       AND om.tenant_id = p_pub.tenant_id
       AND om.status = 'active'
      WHERE npt.publication_id = p_pub.id
    );
  END IF;
  IF p_pub.audience_type = 'groups' THEN
    RETURN EXISTS (
      SELECT 1
      FROM news_publication_groups npg
      JOIN membership_access_groups mag ON mag.group_id = npg.group_id
      JOIN organization_memberships om
        ON om.id = mag.membership_id
       AND om.user_id = NULL::uuid
       AND om.tenant_id = p_pub.tenant_id
       AND om.status = 'active'
      WHERE npg.publication_id = p_pub.id
    );
  END IF;
  RETURN FALSE;
END;
$$;
