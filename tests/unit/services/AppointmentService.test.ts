import { beforeEach, describe, expect, it } from "vitest";
import {
    BusinessRuleError,
    ConflictError,
    NotFoundError,
    ValidationError,
} from "../../../src/errors/AppError.js";
import { AppointmentService } from "../../../src/services/AppointmentService.js";
import {
    APPOINTMENT_ID,
    OTHER_PET_ID,
    PET_ID,
    fixedClock,
    makeAppointment,
    makePet,
    mockAppointmentRepository,
    mockPetRepository,
} from "../helpers/factories.js";

describe("AppointmentService", () => {
    let appointments: ReturnType<typeof mockAppointmentRepository>;
    let pets: ReturnType<typeof mockPetRepository>;
    let service: AppointmentService;

    const validBody = {
        pet_id: PET_ID,
        scheduled_at: "2026-12-10T11:00:00-03:00",
        veterinarian: "Dra. Ana Lima",
        reason: "Vacinação",
        price: 150,
    };

    beforeEach(() => {
        appointments = mockAppointmentRepository();
        pets = mockPetRepository();
        service = new AppointmentService(appointments, pets, fixedClock);
    });

    function arrangeHappyCreate() {
        pets.findById.mockResolvedValue(makePet());
        appointments.findScheduledAt.mockResolvedValue([]);
        appointments.create.mockResolvedValue(makeAppointment());
    }

    describe("findAll", () => {
        it("aplica os filtros de pet e status", async () => {
            appointments.findAll.mockResolvedValue([]);

            await service.findAll(PET_ID, "agendada");

            expect(appointments.findAll).toHaveBeenCalledWith({ petId: PET_ID, status: "agendada" });
        });

        it("lista sem filtros", async () => {
            appointments.findAll.mockResolvedValue([]);

            await service.findAll();

            expect(appointments.findAll).toHaveBeenCalledWith({});
        });

        it("rejeita status desconhecido no filtro", async () => {
            await expect(service.findAll(undefined, "pendente")).rejects.toBeInstanceOf(ValidationError);
        });
    });

    describe("findById", () => {
        it("lança NotFoundError quando a consulta não existe", async () => {
            appointments.findById.mockResolvedValue(null);

            await expect(service.findById(APPOINTMENT_ID)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("create", () => {
        it("agenda a consulta convertendo a data para UTC e com status padrão 'agendada'", async () => {
            arrangeHappyCreate();

            await service.create(validBody);

            expect(appointments.create).toHaveBeenCalledWith({
                pet_id: PET_ID,
                scheduled_at: "2026-12-10T14:00:00.000Z",
                veterinarian: "Dra. Ana Lima",
                reason: "Vacinação",
                status: "agendada",
                price: 150,
                notes: null,
            });
        });

        it("valida formato dos campos", async () => {
            const error = await service
                .create({ pet_id: "x", scheduled_at: "10/12/2026", price: "100", status: "pendente" })
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).details).toHaveLength(6);
        });

        it("não permite valor negativo (422)", async () => {
            pets.findById.mockResolvedValue(makePet());

            await expect(service.create({ ...validBody, price: -10 })).rejects.toThrow("não pode ser negativo");
        });

        it("não permite agendar no passado (422)", async () => {
            pets.findById.mockResolvedValue(makePet());

            await expect(service.create({ ...validBody, scheduled_at: "2026-11-01T10:00:00Z" }))
                .rejects.toThrow("data futura");
        });

        it("exige que uma nova consulta comece como 'agendada'", async () => {
            await expect(service.create({ ...validBody, status: "concluida" }))
                .rejects.toBeInstanceOf(BusinessRuleError);
        });

        it("lança NotFoundError se o pet não existir", async () => {
            pets.findById.mockResolvedValue(null);

            await expect(service.create(validBody)).rejects.toBeInstanceOf(NotFoundError);
        });

        it("não agenda consulta para pet inativo", async () => {
            pets.findById.mockResolvedValue(makePet({ active: false }));

            await expect(service.create(validBody)).rejects.toThrow("pet inativo");
        });

        it("impede dois agendamentos do mesmo pet no mesmo horário (409)", async () => {
            pets.findById.mockResolvedValue(makePet());
            appointments.findScheduledAt.mockResolvedValue([makeAppointment({ veterinarian: "Dr. Outro" })]);

            await expect(service.create(validBody)).rejects.toThrow("Este pet já possui");
        });

        it("impede o mesmo veterinário em dois atendimentos no mesmo horário (409)", async () => {
            pets.findById.mockResolvedValue(makePet());
            appointments.findScheduledAt.mockResolvedValue([
                makeAppointment({ pet_id: OTHER_PET_ID, veterinarian: "dra. ana lima " }),
            ]);

            await expect(service.create(validBody)).rejects.toThrow("Este veterinário já possui");
        });

        it("permite o horário se pet e veterinário forem diferentes", async () => {
            arrangeHappyCreate();
            appointments.findScheduledAt.mockResolvedValue([
                makeAppointment({ pet_id: OTHER_PET_ID, veterinarian: "Dr. Outro" }),
            ]);

            await expect(service.create(validBody)).resolves.toBeDefined();
        });
    });

    describe("update", () => {
        it("conclui uma consulta agendada", async () => {
            appointments.findById.mockResolvedValue(makeAppointment());
            pets.findById.mockResolvedValue(makePet());
            appointments.update.mockResolvedValue(makeAppointment({ status: "concluida" }));

            const result = await service.update(APPOINTMENT_ID, { ...validBody, status: "concluida" });

            expect(result.status).toBe("concluida");
            // Consulta concluída não passa pela checagem de horário
            expect(appointments.findScheduledAt).not.toHaveBeenCalled();
        });

        it("ao manter a data, não exige que ela seja futura e ignora a própria consulta no conflito", async () => {
            appointments.findById.mockResolvedValue(makeAppointment({ scheduled_at: "2026-12-10T14:00:00+00:00" }));
            pets.findById.mockResolvedValue(makePet());
            appointments.findScheduledAt.mockResolvedValue([makeAppointment()]);
            appointments.update.mockResolvedValue(makeAppointment({ notes: "ok" }));

            await expect(service.update(APPOINTMENT_ID, { ...validBody, notes: "ok" })).resolves.toBeDefined();
        });

        it("ao reagendar, a nova data precisa ser futura", async () => {
            appointments.findById.mockResolvedValue(makeAppointment());
            pets.findById.mockResolvedValue(makePet());

            await expect(service.update(APPOINTMENT_ID, { ...validBody, scheduled_at: "2026-11-20T10:00:00Z" }))
                .rejects.toBeInstanceOf(BusinessRuleError);
        });

        it.each(["concluida", "cancelada"] as const)("não altera consulta %s (422)", async (status) => {
            appointments.findById.mockResolvedValue(makeAppointment({ status }));

            await expect(service.update(APPOINTMENT_ID, validBody)).rejects.toThrow("não pode mais ser alterada");
            expect(appointments.update).not.toHaveBeenCalled();
        });

        it("lança NotFoundError se o novo pet não existir", async () => {
            appointments.findById.mockResolvedValue(makeAppointment());
            pets.findById.mockResolvedValue(null);

            await expect(service.update(APPOINTMENT_ID, validBody)).rejects.toBeInstanceOf(NotFoundError);
        });

        it("lança NotFoundError se o registro sumir durante a atualização", async () => {
            appointments.findById.mockResolvedValue(makeAppointment());
            pets.findById.mockResolvedValue(makePet());
            appointments.findScheduledAt.mockResolvedValue([]);
            appointments.update.mockResolvedValue(null);

            await expect(service.update(APPOINTMENT_ID, validBody)).rejects.toBeInstanceOf(NotFoundError);
        });

        it("valida o valor também na atualização", async () => {
            appointments.findById.mockResolvedValue(makeAppointment());
            pets.findById.mockResolvedValue(makePet());

            await expect(service.update(APPOINTMENT_ID, { ...validBody, price: -1 }))
                .rejects.toBeInstanceOf(BusinessRuleError);
        });
    });

    describe("delete", () => {
        it.each(["agendada", "cancelada"] as const)("remove consulta %s", async (status) => {
            appointments.findById.mockResolvedValue(makeAppointment({ status }));
            appointments.delete.mockResolvedValue(true);

            await service.delete(APPOINTMENT_ID);

            expect(appointments.delete).toHaveBeenCalledWith(APPOINTMENT_ID);
        });

        it("não remove consulta concluída (histórico) — 409", async () => {
            appointments.findById.mockResolvedValue(makeAppointment({ status: "concluida" }));

            await expect(service.delete(APPOINTMENT_ID)).rejects.toBeInstanceOf(ConflictError);
            expect(appointments.delete).not.toHaveBeenCalled();
        });
    });
});
