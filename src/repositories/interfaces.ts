import type { Owner, OwnerInput } from "../models/Owner.js";
import type { Pet, PetInput } from "../models/Pet.js";
import type { Appointment, AppointmentInput, AppointmentStatus } from "../models/Appointment.js";

/*
 * Contratos da camada de acesso a dados.
 * Os services dependem destas interfaces (e não do Supabase diretamente),
 * o que permite substituí-las por mocks nos testes unitários.
 */

export interface IOwnerRepository {
    findAll(): Promise<Owner[]>;
    findById(id: string): Promise<Owner | null>;
    findByEmail(email: string): Promise<Owner | null>;
    search(keyword: string): Promise<Owner[]>;
    create(data: OwnerInput): Promise<Owner>;
    update(id: string, data: OwnerInput): Promise<Owner | null>;
    delete(id: string): Promise<boolean>;
}

export interface IPetRepository {
    findAll(ownerId?: string): Promise<Pet[]>;
    findById(id: string): Promise<Pet | null>;
    countByOwner(ownerId: string): Promise<number>;
    create(data: PetInput): Promise<Pet>;
    update(id: string, data: PetInput): Promise<Pet | null>;
    delete(id: string): Promise<boolean>;
}

export interface AppointmentFilters {
    petId?: string;
    status?: AppointmentStatus;
}

export interface IAppointmentRepository {
    findAll(filters: AppointmentFilters): Promise<Appointment[]>;
    findById(id: string): Promise<Appointment | null>;
    /** Consultas com status "agendada" exatamente no horário informado. */
    findScheduledAt(scheduledAt: string): Promise<Appointment[]>;
    countByPet(petId: string): Promise<number>;
    create(data: AppointmentInput): Promise<Appointment>;
    update(id: string, data: AppointmentInput): Promise<Appointment | null>;
    delete(id: string): Promise<boolean>;
}
