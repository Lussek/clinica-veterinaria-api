import { beforeEach, describe, expect, it } from "vitest";
import {
    BusinessRuleError,
    ConflictError,
    NotFoundError,
    ValidationError,
} from "../../../src/errors/AppError.js";
import { PetService } from "../../../src/services/PetService.js";
import {
    OTHER_OWNER_ID,
    OWNER_ID,
    PET_ID,
    fixedClock,
    makeOwner,
    makePet,
    mockAppointmentRepository,
    mockOwnerRepository,
    mockPetRepository,
} from "../helpers/factories.js";

describe("PetService", () => {
    let pets: ReturnType<typeof mockPetRepository>;
    let owners: ReturnType<typeof mockOwnerRepository>;
    let appointments: ReturnType<typeof mockAppointmentRepository>;
    let service: PetService;

    const validBody = {
        owner_id: OWNER_ID,
        name: " Thor ",
        species: "Cachorro",
        breed: "",
        birth_date: "2021-05-14",
    };

    beforeEach(() => {
        pets = mockPetRepository();
        owners = mockOwnerRepository();
        appointments = mockAppointmentRepository();
        service = new PetService(pets, owners, appointments, fixedClock);
    });

    describe("findAll", () => {
        it("lista todos os pets quando não há filtro", async () => {
            pets.findAll.mockResolvedValue([makePet()]);

            await service.findAll();

            expect(pets.findAll).toHaveBeenCalledWith();
        });

        it("filtra pelos pets de um tutor", async () => {
            pets.findAll.mockResolvedValue([]);

            await service.findAll(OWNER_ID);

            expect(pets.findAll).toHaveBeenCalledWith(OWNER_ID);
        });

        it("rejeita filtro owner_id inválido", async () => {
            await expect(service.findAll("123")).rejects.toBeInstanceOf(ValidationError);
        });
    });

    describe("findById", () => {
        it("retorna o pet existente", async () => {
            pets.findById.mockResolvedValue(makePet());

            expect((await service.findById(PET_ID)).name).toBe("Thor");
        });

        it("lança NotFoundError para pet inexistente", async () => {
            pets.findById.mockResolvedValue(null);

            await expect(service.findById(PET_ID)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("create", () => {
        it("cria o pet com dados normalizados quando o tutor está ativo", async () => {
            owners.findById.mockResolvedValue(makeOwner());
            pets.create.mockResolvedValue(makePet());

            await service.create(validBody);

            expect(pets.create).toHaveBeenCalledWith({
                owner_id: OWNER_ID,
                name: "Thor",
                species: "Cachorro",
                breed: null,
                birth_date: "2021-05-14",
                active: true,
            });
        });

        it("rejeita campos obrigatórios ausentes e data em formato inválido", async () => {
            const error = await service.create({ birth_date: "14/05/2021" }).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).details).toEqual([
                "owner_id é obrigatório e deve ser um UUID válido.",
                "name é obrigatório.",
                "species é obrigatório.",
                "birth_date deve estar no formato AAAA-MM-DD.",
            ]);
        });

        it("lança NotFoundError quando o tutor não existe", async () => {
            owners.findById.mockResolvedValue(null);

            await expect(service.create(validBody)).rejects.toBeInstanceOf(NotFoundError);
            expect(pets.create).not.toHaveBeenCalled();
        });

        it("não vincula pet a tutor inativo (422)", async () => {
            owners.findById.mockResolvedValue(makeOwner({ active: false }));

            await expect(service.create(validBody)).rejects.toThrow(BusinessRuleError);
            expect(pets.create).not.toHaveBeenCalled();
        });

        it("não aceita data de nascimento futura (422)", async () => {
            owners.findById.mockResolvedValue(makeOwner());

            await expect(service.create({ ...validBody, birth_date: "2027-01-01" }))
                .rejects.toThrow("não pode ser futura");
        });
    });

    describe("update", () => {
        it("permite atualizar pet de tutor inativo se o tutor não mudar", async () => {
            pets.findById.mockResolvedValue(makePet());
            owners.findById.mockResolvedValue(makeOwner({ active: false }));
            pets.update.mockResolvedValue(makePet({ active: false }));

            const result = await service.update(PET_ID, { ...validBody, active: false });

            expect(result.active).toBe(false);
        });

        it("impede transferir o pet para um tutor inativo", async () => {
            pets.findById.mockResolvedValue(makePet());
            owners.findById.mockResolvedValue(makeOwner({ id: OTHER_OWNER_ID, active: false }));

            await expect(service.update(PET_ID, { ...validBody, owner_id: OTHER_OWNER_ID }))
                .rejects.toBeInstanceOf(BusinessRuleError);
            expect(pets.update).not.toHaveBeenCalled();
        });

        it("lança NotFoundError se o pet não existir", async () => {
            pets.findById.mockResolvedValue(null);

            await expect(service.update(PET_ID, validBody)).rejects.toBeInstanceOf(NotFoundError);
        });

        it("lança NotFoundError se o registro sumir durante a atualização", async () => {
            pets.findById.mockResolvedValue(makePet());
            owners.findById.mockResolvedValue(makeOwner());
            pets.update.mockResolvedValue(null);

            await expect(service.update(PET_ID, validBody)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("delete", () => {
        it("remove pet sem consultas", async () => {
            pets.findById.mockResolvedValue(makePet());
            appointments.countByPet.mockResolvedValue(0);
            pets.delete.mockResolvedValue(true);

            await service.delete(PET_ID);

            expect(pets.delete).toHaveBeenCalledWith(PET_ID);
        });

        it("impede remover pet com consultas registradas (409)", async () => {
            pets.findById.mockResolvedValue(makePet());
            appointments.countByPet.mockResolvedValue(3);

            await expect(service.delete(PET_ID)).rejects.toBeInstanceOf(ConflictError);
            expect(pets.delete).not.toHaveBeenCalled();
        });
    });
});
