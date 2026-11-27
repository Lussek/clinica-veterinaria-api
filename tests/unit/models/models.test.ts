import { describe, expect, it } from "vitest";
import { OTHER_PET_ID, PET_ID, makeAppointment, makeOwner, makePet } from "../helpers/factories.js";

describe("Entidades do domínio", () => {
    it("Owner: somente tutor ativo pode receber pets", () => {
        expect(makeOwner().canReceivePets()).toBe(true);
        expect(makeOwner({ active: false }).canReceivePets()).toBe(false);
    });

    it("Pet: somente pet ativo pode ser agendado", () => {
        expect(makePet().canBeScheduled()).toBe(true);
        expect(makePet({ active: false }).canBeScheduled()).toBe(false);
    });

    it("toJSON expõe uma cópia dos dados, sem permitir alterar a entidade", () => {
        const owner = makeOwner();
        const json = owner.toJSON();

        json.name = "Alterado";

        expect(owner.name).toBe("Maria Souza");
        expect(JSON.parse(JSON.stringify(owner))).toMatchObject({ id: owner.id, email: owner.email });
    });

    describe("Appointment", () => {
        it("identifica consultas encerradas", () => {
            expect(makeAppointment({ status: "agendada" }).isClosed()).toBe(false);
            expect(makeAppointment({ status: "concluida" }).isClosed()).toBe(true);
            expect(makeAppointment({ status: "cancelada" }).isClosed()).toBe(true);
        });

        it("conflita com o mesmo pet ou com o mesmo veterinário (ignorando maiúsculas)", () => {
            const appointment = makeAppointment();

            expect(appointment.conflictsWith(PET_ID, "Outro")).toBe(true);
            expect(appointment.conflictsWith(OTHER_PET_ID, "  DRA. ANA LIMA ")).toBe(true);
            expect(appointment.conflictsWith(OTHER_PET_ID, "Dr. Outro")).toBe(false);
        });

        it("consulta cancelada não ocupa o horário", () => {
            expect(makeAppointment({ status: "cancelada" }).conflictsWith(PET_ID, "Dra. Ana Lima")).toBe(false);
        });
    });
});
