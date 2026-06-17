import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://prfmtgjkelstgbsmgjua.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_9AK9TxFywucDfNBJDYmkKw_Hixr84yb"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
