import { ValidationError } from "../errors/AppError.js";
import type { PetInput } from "../models/Pet.js";
import { asRecord, isNonEmptyString, isUuid, optionalBoolean, optionalString } from "./helpers.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Valida o corpo da requisição de pet. Lança ValidationError (400). */
export function validatePet(body: unknown): PetInput {
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
        }
    }

    if (errors.length > 0) {
        throw new ValidationError(errors);
    }

    return {
        owner_id: b.owner_id as string,
        name: (b.name as string).trim(),
        species: (b.species as string).trim(),
        breed,
        birth_date: birthDate,
        active,
    };
}
