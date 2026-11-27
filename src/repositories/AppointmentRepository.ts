import type { SupabaseClient } from "@supabase/supabase-js";
import { Appointment } from "../models/Appointment.js";
import type { AppointmentInput, AppointmentProps } from "../models/Appointment.js";
import type { AppointmentFilters, IAppointmentRepository } from "./interfaces.js";

const TABLE = "appointments";

// Traz também o pet de cada consulta (join pela chave estrangeira pet_id)
const APPOINTMENT_WITH_PET = "*, pet:pets(id, name, species)";

function toAppointment(row: AppointmentProps): Appointment {
    // O PostgreSQL devolve "numeric" que pode chegar como texto; normaliza para número
    return new Appointment({ ...row, price: Number(row.price) });
}

/** Acesso à tabela "appointments" no Supabase/PostgreSQL. */
export class AppointmentRepository implements IAppointmentRepository {
    constructor(private readonly db: SupabaseClient) {}

    async findAll(filters: AppointmentFilters): Promise<Appointment[]> {
        let query = this.db
            .from(TABLE)
            .select(APPOINTMENT_WITH_PET)
            .order("scheduled_at", { ascending: true });

        if (filters.petId) {
            query = query.eq("pet_id", filters.petId);
        }

        if (filters.status) {
            query = query.eq("status", filters.status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data ?? []).map(toAppointment);
    }

    async findById(id: string): Promise<Appointment | null> {
        const { data, error } = await this.db
            .from(TABLE)
            .select(APPOINTMENT_WITH_PET)
            .eq("id", id)
            .maybeSingle();

        if (error) throw error;
        return data ? toAppointment(data) : null;
    }

    async findScheduledAt(scheduledAt: string): Promise<Appointment[]> {
        const { data, error } = await this.db
            .from(TABLE)
            .select("*")
            .eq("scheduled_at", scheduledAt)
            .eq("status", "agendada");

        if (error) throw error;
        return (data ?? []).map(toAppointment);
    }

    async countByPet(petId: string): Promise<number> {
        const { count, error } = await this.db
            .from(TABLE)
            .select("id", { count: "exact", head: true })
            .eq("pet_id", petId);

        if (error) throw error;
        return count ?? 0;
    }

    async create(input: AppointmentInput): Promise<Appointment> {
        const { data, error } = await this.db
            .from(TABLE)
            .insert(input)
            .select(APPOINTMENT_WITH_PET)
            .single();

        if (error) throw error;
        return toAppointment(data);
    }

    async update(id: string, input: AppointmentInput): Promise<Appointment | null> {
        const { data, error } = await this.db
            .from(TABLE)
            .update(input)
            .eq("id", id)
            .select(APPOINTMENT_WITH_PET)
            .maybeSingle();

        if (error) throw error;
        return data ? toAppointment(data) : null;
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
