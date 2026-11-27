import { Entity } from "./Entity.js";

export const APPOINTMENT_STATUSES = ["agendada", "concluida", "cancelada"] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface AppointmentProps {
    id: string;
    pet_id: string;
    scheduled_at: string;
    veterinarian: string;
    reason: string;
    status: AppointmentStatus;
    price: number;
    notes: string | null;
    created_at: string;
    /** Pet atendido, carregado pelo relacionamento (chave estrangeira). */
    pet?: { id: string; name: string; species: string } | null;
}

/** Dados aceitos na criação/atualização de uma consulta. */
export type AppointmentInput = Omit<AppointmentProps, "id" | "created_at" | "pet">;

/** Consulta veterinária agendada para um pet. */
export class Appointment extends Entity<AppointmentProps> {
    get petId(): string {
        return this.props.pet_id;
    }

    get scheduledAt(): string {
        return this.props.scheduled_at;
    }

    get veterinarian(): string {
        return this.props.veterinarian;
    }

    get status(): AppointmentStatus {
        return this.props.status;
    }

    isScheduled(): boolean {
        return this.props.status === "agendada";
    }

    /** Consultas concluídas ou canceladas estão encerradas e não mudam mais. */
    isClosed(): boolean {
        return this.props.status === "concluida" || this.props.status === "cancelada";
    }

    /**
     * Indica se esta consulta ocupa o mesmo horário que outra para o mesmo
     * pet ou para o mesmo veterinário.
     */
    conflictsWith(petId: string, veterinarian: string): boolean {
        return (
            this.isScheduled() &&
            (this.props.pet_id === petId ||
                this.props.veterinarian.trim().toLowerCase() === veterinarian.trim().toLowerCase())
        );
    }
}
