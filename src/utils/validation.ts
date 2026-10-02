import type { OwnerInput } from "../models/Owner.js";
import type { PetInput } from "../models/Pet.js";

export type ValidationResult<T> =
    | { ok: true; data: T }
    | { ok: false; errors: string[] };

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_REGEX.test(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function asRecord(body: unknown): Record<string, unknown> {
    return typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};
}

function optionalString(value: unknown, field: string, errors: string[]): string | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        errors.push(`${field} deve ser um texto.`);
        return null;
    }

    return value.trim() || null;
}

function optionalBoolean(value: unknown, field: string, errors: string[]): boolean {
    if (value === undefined) {
        return true;
    }

    if (typeof value !== "boolean") {
        errors.push(`${field} deve ser true ou false.`);
        return true;
    }

    return value;
}

// Remove caracteres que têm significado especial no filtro .or() do PostgREST
export function sanitizeKeyword(keyword: string): string {
    return keyword.replace(/[,()%*\\"']/g, " ").trim();
}

export function validateOwner(body: unknown): ValidationResult<OwnerInput> {
    const b = asRecord(body);
    const errors: string[] = [];

    if (!isNonEmptyString(b.name)) {
        errors.push("name é obrigatório.");
    }

    if (typeof b.email !== "string" || !EMAIL_REGEX.test(b.email.trim())) {
        errors.push("email é obrigatório e deve ser válido.");
    }

    const phone = optionalString(b.phone, "phone", errors);
    const active = optionalBoolean(b.active, "active", errors);

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    return {
        ok: true,
        data: {
            name: (b.name as string).trim(),
            email: (b.email as string).trim().toLowerCase(),
            phone,
            active,
        },
    };
}

export function validatePet(body: unknown): ValidationResult<PetInput> {
    const b = asRecord(body);
    const errors: string[] = [];

    if (!isUuid(b.owner_id)) {
        errors.push("owner_id é obrigatório e deve ser um UUID válido.");
    }

    if (!isNonEmptyString(b.name)) {
        errors.push("name é obrigatório.");
    }

    if (!isNonEmptyString(b.species)) {
        errors.push("species é obrigatório.");
    }

    const breed = optionalString(b.breed, "breed", errors);
    const birthDate = optionalString(b.birth_date, "birth_date", errors);
    const active = optionalBoolean(b.active, "active", errors);

    if (birthDate !== null) {
        const parsed = new Date(birthDate);

        if (!DATE_REGEX.test(birthDate) || Number.isNaN(parsed.getTime())) {
            errors.push("birth_date deve estar no formato AAAA-MM-DD.");
        } else if (parsed.getTime() > Date.now()) {
            errors.push("birth_date não pode ser uma data futura.");
        }
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    return {
        ok: true,
        data: {
            owner_id: b.owner_id as string,
            name: (b.name as string).trim(),
            species: (b.species as string).trim(),
            breed,
            birth_date: birthDate,
            active,
        },
    };
}
