import supabase from "../config/supabase.js";

export interface OwnerInput {
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
}

async function findAll() {
    const { data, error } = await supabase
        .from("owners")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

// Retorna null quando o tutor não existe
async function findById(id: string) {
    const { data, error } = await supabase
        .from("owners")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

async function create(owner: OwnerInput) {
    const { data, error } = await supabase
        .from("owners")
        .insert(owner)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

// Retorna null quando o tutor não existe
async function update(id: string, owner: OwnerInput) {
    const { data, error } = await supabase
        .from("owners")
        .update(owner)
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

// Retorna null quando o tutor não existe
async function remove(id: string) {
    const { data, error } = await supabase
        .from("owners")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

// A palavra-chave já deve chegar sanitizada do controller
async function searchByKeyword(keyword: string) {
    const { data, error } = await supabase
        .from("owners")
        .select("*")
        .or(`name.ilike.%${keyword}%,email.ilike.%${keyword}%`)
        .order("name", { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

export default {
    findAll,
    findById,
    create,
    update,
    remove,
    searchByKeyword
}
