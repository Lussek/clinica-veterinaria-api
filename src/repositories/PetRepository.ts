import type { SupabaseClient } from "@supabase/supabase-js";
import { Pet } from "../models/Pet.js";
import type { PetInput, PetProps } from "../models/Pet.js";
import type { IPetRepository } from "./interfaces.js";

const TABLE = "pets";

// Traz também o tutor de cada pet (join pela chave estrangeira owner_id)
const PET_WITH_OWNER = "*, owner:owners(id, name)";

function toPet(row: PetProps): Pet {
    return new Pet(row);
}

/** Acesso à tabela "pets" no Supabase/PostgreSQL. */
export class PetRepository implements IPetRepository {
    constructor(private readonly db: SupabaseClient) {}

    async findAll(ownerId?: string): Promise<Pet[]> {
        let query = this.db
            .from(TABLE)
            .select(PET_WITH_OWNER)
            .order("name", { ascending: true });

        if (ownerId) {
            query = query.eq("owner_id", ownerId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data ?? []).map(toPet);
    }

    async findById(id: string): Promise<Pet | null> {
        const { data, error } = await this.db
            .from(TABLE)
            .select(PET_WITH_OWNER)
            .eq("id", id)
            .maybeSingle();

        if (error) throw error;
        return data ? toPet(data) : null;
    }

    async countByOwner(ownerId: string): Promise<number> {
        const { count, error } = await this.db
            .from(TABLE)
            .select("id", { count: "exact", head: true })
            .eq("owner_id", ownerId);

        if (error) throw error;
        return count ?? 0;
    }

    async create(input: PetInput): Promise<Pet> {
        const { data, error } = await this.db
            .from(TABLE)
            .insert(input)
            .select(PET_WITH_OWNER)
            .single();

        if (error) throw error;
        return toPet(data);
    }

    async update(id: string, input: PetInput): Promise<Pet | null> {
        const { data, error } = await this.db
            .from(TABLE)
            .update(input)
            .eq("id", id)
            .select(PET_WITH_OWNER)
            .maybeSingle();

        if (error) throw error;
        return data ? toPet(data) : null;
    }

    async delete(id: string): Promise<boolean> {
        const { data, error } = await this.db
            .from(TABLE)
            .delete()
            .eq("id", id)
            .select("id");

        if (error) throw error;
        return (data?.length ?? 0) > 0;
    }
}
