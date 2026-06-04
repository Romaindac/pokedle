// Connexion à Supabase (base de données en ligne pour le classement).
// La clé "anon" est publique par nature : elle est faite pour être dans le code d'un site.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zxykperdpglmcdfcrpuo.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eWtwZXJkcGdsbWNkZmNycHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjI3MTUsImV4cCI6MjA5NjEzODcxNX0.AHw4699q2wJc-nC8nUPA1Kz27qoPvjqCiQ1dPB0lfIg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)