-- Add location fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lat FLOAT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lng FLOAT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_ghost_mode BOOLEAN DEFAULT FALSE;

-- Enable Realtime for the profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
-- Optional: if you also need full row data on UPDATE/DELETE events
ALTER TABLE profiles REPLICA IDENTITY FULL;
