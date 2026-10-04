import { createClient } from '@supabase/supabase-js';

// The publishable key is designed to be shipped in browser code; what it can
// do is limited by the Row Level Security policies in supabase/schema.sql.
// NEVER put the secret / service_role key in this app.
const SUPABASE_URL = 'https://viaucjuirjvdhriklcqm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bE-912M-rdEK-sLd1PG0SA_G_RBq2IX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  // We use our own PIN accounts, not Supabase Auth sessions.
  auth: { persistSession: false, autoRefreshToken: false },
});
