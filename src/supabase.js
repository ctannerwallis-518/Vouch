import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://bkbpetcyyuyqudlvbojo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYnBldGN5eXV5cXVkbHZib2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDU2MTAsImV4cCI6MjA4Nzk4MTYxMH0.pca4cP73Fp-pX9mQLRM2R_9bIKwIb9qF9iiB9MCjhoE'
export const supabase = createClient(supabaseUrl, supabaseKey)