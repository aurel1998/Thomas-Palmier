-- Initialisation PostgreSQL (exécuté par scripts/setup-ionos-vps.sh)
-- Remplace :DB_PASSWORD par le mot de passe choisi avant exécution.

CREATE DATABASE sport_journal;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sport') THEN
    CREATE USER sport WITH ENCRYPTED PASSWORD ':DB_PASSWORD';
  ELSE
    ALTER USER sport WITH ENCRYPTED PASSWORD ':DB_PASSWORD';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE sport_journal TO sport;

\c sport_journal

GRANT ALL ON SCHEMA public TO sport;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sport;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sport;
