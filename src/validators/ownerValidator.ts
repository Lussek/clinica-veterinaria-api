import { ValidationError } from "../errors/AppError.js";
import type { OwnerInput } from "../models/Owner.js";
import { asRecord, isNonEmptyString, optionalBoolean, optionalString } from "./helpers.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida o corpo da requisição de tutor. Lança ValidationError (400). */
export function validateOwner(body: unknown): OwnerInput {
    const b = asRecord(body);
    const errors: string[] = [];

    if (!isNonEmptyString(b.name)) {
        errors.push("name é obrigatório.");
    } else if (b.name.trim().length > 120) {
        errors.push("name deve ter no máximo 120 caracteres.");
    }

    if (typeof b.email !== "string" || !EMAIL_REGEX.test(b.email.trim())) {
        errors.push("email é obrigatório e deve ser válido.");
    }

    const phone = optionalString(b.phone, "phone", errors);
    const active = optionalBoolean(b.active, "active", errors);

    if (errors.length > 0) {
        throw new ValidationError(errors);
    }

    return {
        name: (b.name as string).trim(),
        email: (b.email as string).trim().toLowerCase(),
        phone,
        active,
    };
}
