import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bkbpetcyyuyqudlvbojo.supabase.co'
const supabaseKey = 'sb_publishable_fQWC8s9Ll0kzrTi_jMzJgw_hMhDbUSO'

export const supabase = createClient(supabaseUrl, supabaseKey)