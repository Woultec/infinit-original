-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles (or just their own depending on requirements, but often profiles are public or at least readable by admins/other members)
-- Let's make it so users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING ( auth.uid() = id );

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );
