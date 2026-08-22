-- Run this once as the postgres superuser to create the local DB and user.
-- Open pgAdmin or run: psql -U postgres -h 127.0.0.1 -f setup-local-db.sql

-- Create a dedicated application user (avoid using postgres superuser at runtime)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 's2r2_user') THEN
    CREATE USER s2r2_user WITH PASSWORD 's2r2pass';
  END IF;
END
$$;

-- Create the database owned by the app user
SELECT 'CREATE DATABASE s2r2_inventory OWNER s2r2_user'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 's2r2_inventory')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE s2r2_inventory TO s2r2_user;

-- Connect to the new DB and grant schema privileges
\c s2r2_inventory
GRANT ALL ON SCHEMA public TO s2r2_user;

\echo '✅ Database s2r2_inventory and user s2r2_user created successfully.'
\echo '   Connection string: postgresql://s2r2_user:s2r2pass@localhost:5432/s2r2_inventory'
