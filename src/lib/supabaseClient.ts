import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibprrihjxyovyxchocng.supabase.co'; // Supabase > Project Settings > API
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicHJyaWhqeHlvdnl4Y2hvY25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTk2MzAsImV4cCI6MjA2NDg3NTYzMH0.Eq9mZRfQCf3YJtqKwWGJabmCzPZEuAxtf3lbL7A280Y'; // Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
