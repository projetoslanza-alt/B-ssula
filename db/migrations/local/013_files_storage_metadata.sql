-- Migration local: 013_files_storage_metadata.sql
-- Gerado por build-local-migrations.ts

-- Storage local — metadados (arquivos em disco)
CREATE TABLE IF NOT EXISTS file_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  checksum TEXT,
  visibility TEXT NOT NULL DEFAULT 'private',
  module TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (tenant_id, bucket, storage_key)
);

CREATE INDEX IF NOT EXISTS idx_file_objects_entity ON file_objects(tenant_id, entity_type, entity_id)
  WHERE deleted_at IS NULL;

