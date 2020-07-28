-- Create links table
DROP TABLE IF EXISTS links CASCADE;
CREATE TABLE public.links (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	alias VARCHAR ( 50 ) UNIQUE NOT NULL,
	url VARCHAR ( 255 ) NOT NULL,
    usage INT NOT NULL DEFAULT 0, 
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
);