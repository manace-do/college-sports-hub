import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
  );
};

// Default starter sports matching supabase/schema.sql
export const STARTER_SPORTS = [
  { id: 'sp-01', name: 'Football', category: 'men', coach_name: 'Mr. Sharma' },
  { id: 'sp-02', name: 'Cricket', category: 'men', coach_name: 'Mr. Rao' },
  { id: 'sp-03', name: 'Volleyball', category: 'men', coach_name: 'Mr. Nair' },
  { id: 'sp-04', name: 'Throwball', category: 'women', coach_name: 'Ms. Iyer' },
  { id: 'sp-05', name: 'Basketball', category: 'mixed', coach_name: 'Mr. Khan' },
  { id: 'sp-06', name: 'Athletics', category: 'men', coach_name: 'Ms. Das' },
  { id: 'sp-07', name: 'Athletics', category: 'women', coach_name: 'Ms. Das' },
];

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
