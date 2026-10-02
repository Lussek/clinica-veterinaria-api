import supabase from "../config/supabase.js";

export interface PetInput {
    owner_id: string;
    name: string;
    species: string;
    breed: string | null;
    birth_date: string | null;
    active: boolean;
}

// Traz também o tutor de cada pet (join pela chave estrangeira)
const PET_WITH_OWNER = "*, owner:owners(id, name)";

async function findAll(ownerId?: string) {
    let query = supabase
        .from("pets")
        .select(PET_WITH_OWNER)
        .order("name", { ascending: true });

    if (ownerId) {
        query = query.eq("owner_id", ownerId);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return data;
}

// Retorna null quando o pet não existe
async function findById(id: string) {
    const { data, error } = await supabase
        .from("pets")
        .select(PET_WITH_OWNER)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

async function create(pet: PetInput) {
    const { data, error } = await supabase
        .from("pets")
        .insert(pet)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

// Retorna null quando o pet não existe
async function update(id: string, pet: PetInput) {
    const { data, error } = await supabase
        .from("pets")
        .update(pet)
        .eq("id", id)
        .select()
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

// Retorna null quando o pet não existe
async function remove(id: string) {
    const { data, error } = await supabase
        .from("pets")
        .delete()
        .eq("id", id)
        .select()
        .maybeSingle();

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
}
