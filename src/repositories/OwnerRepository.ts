import type { SupabaseClient } from "@supabase/supabase-js";
import { Owner } from "../models/Owner.js";
import type { OwnerInput, OwnerProps } from "../models/Owner.js";
import type { IOwnerRepository } from "./interfaces.js";

const TABLE = "owners";

function toOwner(row: OwnerProps): Owner {
    return new Owner(row);
}

/** Acesso à tabela "owners" no Supabase/PostgreSQL. */
export class OwnerRepository implements IOwnerRepository {
    constructor(private readonly db: SupabaseClient) {}

    async findAll(): Promise<Owner[]> {
        const { data, error } = await this.db
            .from(TABLE)
            .select("*")
            .order("name", { ascending: true });

        if (error) throw error;
        return (data ?? []).map(toOwner);
    }

    async findById(id: string): Promise<Owner | null> {
        const { data, error } = await this.db
            .from(TABLE)
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) throw error;
        return data ? toOwner(data) : null;
    }

    async findByEmail(email: string): Promise<Owner | null> {
        const { data, error } = await this.db
            .from(TABLE)
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) throw error;
        return data ? toOwner(data) : null;
    }

    // A palavra-chave já chega sanitizada pelo service
    async search(keyword: string): Promise<Owner[]> {
        const { data, error } = await this.db
            .from(TABLE)
            .select("*")
            .or(`name.ilike.%${keyword}%,email.ilike.%${keyword}%`)
            .order("name", { ascending: true });

        if (error) throw error;
        return (data ?? []).map(toOwner);
    }

    async create(input: OwnerInput): Promise<Owner> {
        const { data, error } = await this.db
            .from(TABLE)
            .insert(input)
            .select()
            .single();

        if (error) throw error;
        return toOwner(data);
    }

    async update(id: string, input: OwnerInput): Promise<Owner | null> {
        const { data, error } = await this.db
            .from(TABLE)
            .update(input)
            .eq("id", id)
            .select()
            .maybeSingle();

        if (error) throw error;
        return data ? toOwner(data) : null;
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
