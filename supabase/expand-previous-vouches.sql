-- Viewer preference: expand previous vouches on profile pages (default on).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS expand_previous_vouches boolean DEFAULT true;

UPDATE profiles
SET expand_previous_vouches = true
WHERE expand_previous_vouches IS NULL;
