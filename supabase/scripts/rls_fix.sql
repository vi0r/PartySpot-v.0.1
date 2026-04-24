CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
