import { createClient } from '@supabase/supabase-js';

const supabaseKey = process.env.SUPABASE_KEY!;
export const supabase = createClient(
	'https://vplnlexboccvokhfpiko.supabase.co',
	supabaseKey
);
