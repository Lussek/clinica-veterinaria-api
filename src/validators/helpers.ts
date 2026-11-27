import { ValidationError } from "../errors/AppError.js";

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_REGEX.test(value);
}

/** Lança ValidationError (400) se o identificador não for um UUID. */
export function ensureUuid(value: unknown, label: string): string {
    if (!isUuid(value)) {
        throw new ValidationError([`${label} deve ser um UUID válido.`], `${label} inválido.`);
    }
    return value;
}

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export function asRecord(body: unknown): Record<string, unknown> {
    return typeof body === "object" && body !== null && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
}

/** Campo de texto opcional: vazio/ausente vira null. */
export function optionalString(value: unknown, field: string, errors: string[]): string | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        errors.push(`${field} deve ser um texto.`);
        return null;
    }

    return value.trim() || null;
}

/** Campo booleano opcional: ausente assume true. */
export function optionalBoolean(value: unknown, field: string, errors: string[]): boolean {
    if (value === undefined) {
        return true;
    }

    if (typeof value !== "boolean") {
        errors.push(`${field} deve ser true ou false.`);
        return true;
    }

    return value;
}

/** Remove caracteres com significado especial no filtro .or() do PostgREST. */
export function sanitizeKeyword(keyword: string): string {
    return keyword.replace(/[,()%*\\"']/g, " ").trim();
}
