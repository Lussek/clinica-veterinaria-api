import { vi } from "vitest";
import { Appointment } from "../../../src/models/Appointment.js";
import type { AppointmentProps } from "../../../src/models/Appointment.js";
import { Owner } from "../../../src/models/Owner.js";
import type { OwnerProps } from "../../../src/models/Owner.js";
import { Pet } from "../../../src/models/Pet.js";
import type { PetProps } from "../../../src/models/Pet.js";

export const OWNER_ID = "11111111-1111-4111-8111-111111111111";
export const OTHER_OWNER_ID = "22222222-2222-4222-8222-222222222222";
export const PET_ID = "33333333-3333-4333-8333-333333333333";
export const OTHER_PET_ID = "44444444-4444-4444-8444-444444444444";
export const APPOINTMENT_ID = "55555555-5555-4555-8555-555555555555";

/** "Agora" fixo usado nos testes que dependem de data. */
export const NOW = new Date("2026-11-26T12:00:00.000Z");
export const fixedClock = () => NOW;

export function makeOwner(overrides: Partial<OwnerProps> = {}): Owner {
    return new Owner({
        id: OWNER_ID,
        name: "Maria Souza",
        email: "maria@email.com",
        phone: null,
        active: true,
        created_at: "2026-01-01T00:00:00.000Z",
        ...overrides,
    });
}

export function makePet(overrides: Partial<PetProps> = {}): Pet {
    return new Pet({
        id: PET_ID,
        owner_id: OWNER_ID,
        name: "Thor",
        species: "Cachorro",
        breed: null,
        birth_date: "2021-05-14",
        active: true,
        created_at: "2026-01-01T00:00:00.000Z",
        ...overrides,
    });
}

export function makeAppointment(overrides: Partial<AppointmentProps> = {}): Appointment {
    return new Appointment({
        id: APPOINTMENT_ID,
        pet_id: PET_ID,
        scheduled_at: "2026-12-10T14:00:00.000Z",
        veterinarian: "Dra. Ana Lima",
        reason: "Vacinação",
        status: "agendada",
        price: 150,
        notes: null,
        created_at: "2026-01-01T00:00:00.000Z",
        ...overrides,
    });
}

// ---- Mocks dos repositórios (isolam os services do banco de dados) ----

export function mockOwnerRepository() {
    return {
        findAll: vi.fn(),
        findById: vi.fn(),
        findByEmail: vi.fn(),
        search: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };
}

export function mockPetRepository() {
    return {
        findAll: vi.fn(),
        findById: vi.fn(),
        countByOwner: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };
}

export function mockAppointmentRepository() {
    return {
        findAll: vi.fn(),
        findById: vi.fn(),
        findScheduledAt: vi.fn(),
        countByPet: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };
}
