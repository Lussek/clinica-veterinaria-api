import { ValidationError } from "../errors/AppError.js";
import { APPOINTMENT_STATUSES } from "../models/Appointment.js";
import type { AppointmentInput, AppointmentStatus } from "../models/Appointment.js";
import { asRecord, isNonEmptyString, isUuid, optionalString } from "./helpers.js";

// Data e hora em ISO 8601, ex.: 2026-12-01T14:30:00Z ou 2026-12-01T14:30:00-03:00
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
    return typeof value === "string" && (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

/** Valida o corpo da requisição de consulta. Lança ValidationError (400). */
export function validateAppointment(body: unknown): AppointmentInput {
    const b = asRecord(body);
    const errors: string[] = [];

    if (!isUuid(b.pet_id)) {
        errors.push("pet_id é obrigatório e deve ser um UUID válido.");
    }

    let scheduledAt = "";
    if (typeof b.scheduled_at !== "string" || !DATETIME_REGEX.test(b.scheduled_at)
        || Number.isNaN(new Date(b.scheduled_at).getTime())) {
        errors.push("scheduled_at é obrigatório e deve estar no formato ISO 8601 (AAAA-MM-DDTHH:MM).");
    } else {
        scheduledAt = new Date(b.scheduled_at).toISOString();
    }

    if (!isNonEmptyString(b.veterinarian)) {
        errors.push("veterinarian é obrigatório.");
    }

    if (!isNonEmptyString(b.reason)) {
        errors.push("reason é obrigatório.");
    }

    let price = 0;
    if (b.price !== undefined) {
        if (typeof b.price !== "number" || !Number.isFinite(b.price)) {
            errors.push("price deve ser um número.");
        } else {
            price = b.price;
        }
    }

    let status: AppointmentStatus = "agendada";
    if (b.status !== undefined) {
        if (!isAppointmentStatus(b.status)) {
            errors.push(`status deve ser um destes valores: ${APPOINTMENT_STATUSES.join(", ")}.`);
        } else {
            status = b.status;
        }
    }

    const notes = optionalString(b.notes, "notes", errors);

    if (errors.length > 0) {
        throw new ValidationError(errors);
    }

    return {
        pet_id: b.pet_id as string,
        scheduled_at: scheduledAt,
        veterinarian: (b.veterinarian as string).trim(),
        reason: (b.reason as string).trim(),
        status,
        price,
        notes,
    };
}
