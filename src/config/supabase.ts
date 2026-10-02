import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
        "Variáveis SUPABASE_URL e SUPABASE_SECRET_KEY não definidas. Verifique o arquivo .env.",
    );
}

const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
);

export default supabase;
