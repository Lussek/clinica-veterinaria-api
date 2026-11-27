import { BusinessRuleError, ConflictError, NotFoundError, ValidationError } from "../errors/AppError.js";
import { APPOINTMENT_STATUSES } from "../models/Appointment.js";
import type { Appointment, AppointmentInput } from "../models/Appointment.js";
import type {
    AppointmentFilters,
    IAppointmentRepository,
    IPetRepository,
} from "../repositories/interfaces.js";
import { isAppointmentStatus, validateAppointment } from "../validators/appointmentValidator.js";
import { ensureUuid } from "../validators/helpers.js";

/**
 * Regras de negócio das consultas:
 * - o pet deve existir e estar ativo para receber uma nova consulta;
 * - toda consulta nova começa com status "agendada" e em data futura;
 * - o valor (price) não pode ser negativo;
 * - o mesmo pet ou o mesmo veterinário não pode ter duas consultas agendadas no mesmo horário;
 * - consultas concluídas ou canceladas não podem mais ser alteradas;
 * - consultas concluídas fazem parte do histórico e não podem ser removidas.
 */
export class AppointmentService {
    constructor(
        private readonly appointments: IAppointmentRepository,
        private readonly pets: IPetRepository,
        private readonly now: () => Date = () => new Date(),
    ) {}

    async findAll(petId?: unknown, status?: unknown): Promise<Appointment[]> {
        const filters: AppointmentFilters = {};

        if (petId !== undefined) {
            filters.petId = ensureUuid(petId, "pet_id");
        }

        if (status !== undefined) {
            if (!isAppointmentStatus(status)) {
                throw new ValidationError(
                    [`status deve ser um destes valores: ${APPOINTMENT_STATUSES.join(", ")}.`],
                    "Filtro inválido.",
                );
            }
            filters.status = status;
        }

        return this.appointments.findAll(filters);
    }

    async findById(id: unknown): Promise<Appointment> {
        const appointmentId = ensureUuid(id, "ID da consulta");
        const appointment = await this.appointments.findById(appointmentId);

        if (!appointment) {
            throw new NotFoundError("Consulta não encontrada.");
        }

        return appointment;
    }

    async create(body: unknown): Promise<Appointment> {
        const data = validateAppointment(body);

        if (data.status !== "agendada") {
            throw new BusinessRuleError('Uma nova consulta deve ser criada com status "agendada".');
        }

        const pet = await this.pets.findById(data.pet_id);

        if (!pet) {
            throw new NotFoundError("O pet informado em pet_id não foi encontrado.");
        }

        if (!pet.canBeScheduled()) {
            throw new BusinessRuleError("Não é possível agendar consulta para um pet inativo.");
        }

        this.ensurePriceIsValid(data);
        this.ensureFutureDate(data);
        await this.ensureNoScheduleConflict(data);

        return this.appointments.create(data);
    }

    async update(id: unknown, body: unknown): Promise<Appointment> {
        const appointmentId = ensureUuid(id, "ID da consulta");
        const data = validateAppointment(body);
        const current = await this.findById(appointmentId);

        if (current.isClosed()) {
            throw new BusinessRuleError(
                `Esta consulta já está ${current.status} e não pode mais ser alterada.`,
            );
        }

        const pet = await this.pets.findById(data.pet_id);

        if (!pet) {
            throw new NotFoundError("O pet informado em pet_id não foi encontrado.");
        }

        this.ensurePriceIsValid(data);

        // Reagendamento: a nova data precisa ser futura e o horário precisa estar livre
        if (data.status === "agendada") {
            if (data.scheduled_at !== new Date(current.scheduledAt).toISOString()) {
                this.ensureFutureDate(data);
            }
            await this.ensureNoScheduleConflict(data, appointmentId);
        }

        const updated = await this.appointments.update(appointmentId, data);

        if (!updated) {
            throw new NotFoundError("Consulta não encontrada.");
        }

        return updated;
    }

    async delete(id: unknown): Promise<void> {
        const appointment = await this.findById(id);

        if (appointment.status === "concluida") {
            throw new ConflictError(
                "Consultas concluídas fazem parte do histórico do pet e não podem ser removidas.",
            );
        }

        await this.appointments.delete(appointment.id);
    }

    private ensurePriceIsValid(data: AppointmentInput): void {
        if (data.price < 0) {
            throw new BusinessRuleError("O valor da consulta não pode ser negativo.");
        }
    }

    private ensureFutureDate(data: AppointmentInput): void {
        if (new Date(data.scheduled_at).getTime() <= this.now().getTime()) {
            throw new BusinessRuleError("A consulta deve ser agendada para uma data futura.");
        }
    }

    private async ensureNoScheduleConflict(data: AppointmentInput, ignoreId?: string): Promise<void> {
        const sameTime = await this.appointments.findScheduledAt(data.scheduled_at);
        const conflict = sameTime.find(
            (other) => other.id !== ignoreId && other.conflictsWith(data.pet_id, data.veterinarian),
        );

        if (conflict) {
            throw new ConflictError(
                conflict.petId === data.pet_id
                    ? "Este pet já possui uma consulta agendada neste horário."
                    : "Este veterinário já possui uma consulta agendada neste horário.",
            );
        }
    }
}
