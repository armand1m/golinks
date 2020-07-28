-- Create app_private schema
CREATE SCHEMA IF NOT EXISTS app_private;

-- Create users table
DROP TABLE IF EXISTS app_private.users CASCADE;
CREATE TABLE app_private.users (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
);