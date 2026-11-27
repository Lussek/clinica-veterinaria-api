import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError.js";
import type { Owner } from "../models/Owner.js";
import type { IOwnerRepository, IPetRepository } from "../repositories/interfaces.js";
import { ensureUuid, sanitizeKeyword } from "../validators/helpers.js";
import { validateOwner } from "../validators/ownerValidator.js";

/**
 * Regras de negócio dos tutores:
 * - o e-mail é único entre todos os tutores;
 * - um tutor com pets vinculados não pode ser removido.
 */
export class OwnerService {
    constructor(
        private readonly owners: IOwnerRepository,
        private readonly pets: IPetRepository,
    ) {}

    async findAll(): Promise<Owner[]> {
        return this.owners.findAll();
    }

    async findById(id: unknown): Promise<Owner> {
        const ownerId = ensureUuid(id, "ID do tutor");
        const owner = await this.owners.findById(ownerId);

        if (!owner) {
            throw new NotFoundError("Tutor não encontrado.");
        }

        return owner;
    }

    async search(keyword: unknown): Promise<Owner[]> {
        const term = typeof keyword === "string" ? sanitizeKeyword(keyword) : "";

        if (!term) {
            throw new ValidationError(["Informe uma palavra-chave para a pesquisa."], "Palavra-chave não informada.");
        }

        return this.owners.search(term);
    }

    async create(body: unknown): Promise<Owner> {
        const data = validateOwner(body);

        await this.ensureEmailAvailable(data.email);

        return this.owners.create(data);
    }

    async update(id: unknown, body: unknown): Promise<Owner> {
        const ownerId = ensureUuid(id, "ID do tutor");
        const data = validateOwner(body);

        await this.findById(ownerId);
        await this.ensureEmailAvailable(data.email, ownerId);

        const updated = await this.owners.update(ownerId, data);

        if (!updated) {
            throw new NotFoundError("Tutor não encontrado.");
        }

        return updated;
    }

    async delete(id: unknown): Promise<void> {
        const owner = await this.findById(id);
        const petCount = await this.pets.countByOwner(owner.id);

        if (petCount > 0) {
            throw new ConflictError(
                `Este tutor possui ${petCount} pet(s) vinculado(s) e não pode ser removido.`,
            );
        }

        await this.owners.delete(owner.id);
    }

    /** Garante que nenhum outro tutor usa o e-mail informado. */
    private async ensureEmailAvailable(email: string, currentOwnerId?: string): Promise<void> {
        const existing = await this.owners.findByEmail(email);

        if (existing && existing.id !== currentOwnerId) {
            throw new ConflictError("Já existe um tutor cadastrado com este e-mail.");
        }
    }
}
