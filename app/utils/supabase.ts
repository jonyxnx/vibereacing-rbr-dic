
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_APIKEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_APIKEY) {
    console.warn('Missing Supabase environment variables - using placeholders for build');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
