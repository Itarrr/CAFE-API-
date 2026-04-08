import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wdysmomnuemyivymcdpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkeXNtb21udWVteWl2eW1jZHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzkyODcsImV4cCI6MjA5MTIxNTI4N30.pju8k6vKOqjwSt7jMBldjAyhc8tjF-SKkP_SWtpCv9w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
