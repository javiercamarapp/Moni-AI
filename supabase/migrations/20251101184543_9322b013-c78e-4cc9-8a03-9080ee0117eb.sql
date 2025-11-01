-- Add username field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles(LOWER(username));

-- Add constraint to ensure username is alphanumeric with underscores only
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS username_format;

ALTER TABLE public.profiles
ADD CONSTRAINT username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;