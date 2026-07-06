-- Inicialização PostgreSQL local — Windows Server
-- Executar como superuser (postgres) no servidor.

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Banco
SELECT 'CREATE DATABASE bussola_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bussola_prod')\gexec

-- Roles (ajustar senhas no servidor — nunca versionar senhas reais)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bussola_admin') THEN
    CREATE ROLE bussola_admin LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bussola_app') THEN
    CREATE ROLE bussola_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bussola_backup') THEN
    CREATE ROLE bussola_backup LOGIN;
  END IF;
END
$$;

-- Permissões mínimas (aplicar após migrations do schema)
-- GRANT CONNECT ON DATABASE bussola_prod TO bussola_app;
-- GRANT USAGE ON SCHEMA public TO bussola_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bussola_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bussola_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bussola_app;

-- bussola_backup: SELECT + pg_dump via role
-- REVOKE ALL ON DATABASE bussola_prod FROM PUBLIC;
