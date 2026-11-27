import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "../../../src/errors/AppError.js";
import { OwnerService } from "../../../src/services/OwnerService.js";
import {
    OTHER_OWNER_ID,
    OWNER_ID,
    makeOwner,
    mockOwnerRepository,
    mockPetRepository,
} from "../helpers/factories.js";

describe("OwnerService", () => {
    let owners: ReturnType<typeof mockOwnerRepository>;
    let pets: ReturnType<typeof mockPetRepository>;
    let service: OwnerService;

    const validBody = { name: "  Maria Souza ", email: "MARIA@Email.com", phone: "(41) 99999-0000" };

    beforeEach(() => {
        owners = mockOwnerRepository();
        pets = mockPetRepository();
        service = new OwnerService(owners, pets);
    });

    describe("findAll", () => {
        it("retorna a lista de tutores do repositório", async () => {
            owners.findAll.mockResolvedValue([makeOwner()]);

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(owners.findAll).toHaveBeenCalledOnce();
        });
    });

    describe("findById", () => {
        it("retorna o tutor quando ele existe", async () => {
            owners.findById.mockResolvedValue(makeOwner());

            const owner = await service.findById(OWNER_ID);

            expect(owner.id).toBe(OWNER_ID);
        });

        it("lança ValidationError (400) para ID que não é UUID", async () => {
            await expect(service.findById("abc")).rejects.toBeInstanceOf(ValidationError);
            expect(owners.findById).not.toHaveBeenCalled();
        });

        it("lança NotFoundError (404) quando o tutor não existe", async () => {
            owners.findById.mockResolvedValue(null);

            await expect(service.findById(OWNER_ID)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("search", () => {
        it("sanitiza a palavra-chave antes de pesquisar", async () => {
            owners.search.mockResolvedValue([]);

            await service.search("ma(ria),");

            expect(owners.search).toHaveBeenCalledWith("ma ria");
        });

        it("rejeita palavra-chave vazia ou só com caracteres especiais", async () => {
            await expect(service.search(" ,() ")).rejects.toBeInstanceOf(ValidationError);
            expect(owners.search).not.toHaveBeenCalled();
        });
    });

    describe("create", () => {
        it("normaliza nome e e-mail e cria o tutor como ativo por padrão", async () => {
            owners.findByEmail.mockResolvedValue(null);
            owners.create.mockResolvedValue(makeOwner());

            await service.create(validBody);

            expect(owners.create).toHaveBeenCalledWith({
                name: "Maria Souza",
                email: "maria@email.com",
                phone: "(41) 99999-0000",
                active: true,
            });
        });

        it("rejeita dados inválidos listando todos os erros", async () => {
            const error = await service.create({ name: "", email: "invalido", phone: 10, active: "sim" })
                .catch((e: unknown) => e);

            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).details).toEqual([
                "name é obrigatório.",
                "email é obrigatório e deve ser válido.",
                "phone deve ser um texto.",
                "active deve ser true ou false.",
            ]);
            expect(owners.create).not.toHaveBeenCalled();
        });

        it("não permite e-mail duplicado (409)", async () => {
            owners.findByEmail.mockResolvedValue(makeOwner({ id: OTHER_OWNER_ID }));

            await expect(service.create(validBody)).rejects.toBeInstanceOf(ConflictError);
            expect(owners.create).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("atualiza quando o tutor existe e mantém o próprio e-mail", async () => {
            owners.findById.mockResolvedValue(makeOwner());
            owners.findByEmail.mockResolvedValue(makeOwner()); // é o próprio tutor
            owners.update.mockResolvedValue(makeOwner({ name: "Maria Souza" }));

            const result = await service.update(OWNER_ID, validBody);

            expect(result.name).toBe("Maria Souza");
            expect(owners.update).toHaveBeenCalledWith(OWNER_ID, expect.objectContaining({ email: "maria@email.com" }));
        });

        it("não permite usar o e-mail de outro tutor (409)", async () => {
            owners.findById.mockResolvedValue(makeOwner());
            owners.findByEmail.mockResolvedValue(makeOwner({ id: OTHER_OWNER_ID }));

            await expect(service.update(OWNER_ID, validBody)).rejects.toBeInstanceOf(ConflictError);
            expect(owners.update).not.toHaveBeenCalled();
        });

        it("lança NotFoundError quando o tutor não existe", async () => {
            owners.findById.mockResolvedValue(null);

            await expect(service.update(OWNER_ID, validBody)).rejects.toBeInstanceOf(NotFoundError);
        });

        it("lança NotFoundError se o registro sumir durante a atualização", async () => {
            owners.findById.mockResolvedValue(makeOwner());
            owners.findByEmail.mockResolvedValue(null);
            owners.update.mockResolvedValue(null);

            await expect(service.update(OWNER_ID, validBody)).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("delete", () => {
        it("remove o tutor sem pets vinculados", async () => {
            owners.findById.mockResolvedValue(makeOwner());
            pets.countByOwner.mockResolvedValue(0);
            owners.delete.mockResolvedValue(true);

            await service.delete(OWNER_ID);

            expect(owners.delete).toHaveBeenCalledWith(OWNER_ID);
        });

        it("impede a remoção de tutor com pets vinculados (409)", async () => {
            owners.findById.mockResolvedValue(makeOwner());
            pets.countByOwner.mockResolvedValue(2);

            await expect(service.delete(OWNER_ID)).rejects.toThrow("possui 2 pet(s)");
            expect(owners.delete).not.toHaveBeenCalled();
        });

        it("lança NotFoundError ao remover tutor inexistente", async () => {
            owners.findById.mockResolvedValue(null);

            await expect(service.delete(OWNER_ID)).rejects.toBeInstanceOf(NotFoundError);
        });
    });
});
