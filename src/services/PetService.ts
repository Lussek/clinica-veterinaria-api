import { BusinessRuleError, ConflictError, NotFoundError } from "../errors/AppError.js";
import type { Owner } from "../models/Owner.js";
import type { Pet, PetInput } from "../models/Pet.js";
import type {
    IAppointmentRepository,
    IOwnerRepository,
    IPetRepository,
} from "../repositories/interfaces.js";
import { ensureUuid } from "../validators/helpers.js";
import { validatePet } from "../validators/petValidator.js";

/**
 * Regras de negócio dos pets:
 * - o tutor informado deve existir;
 * - não é possível vincular um pet a um tutor inativo;
 * - a data de nascimento não pode ser futura;
 * - um pet com consultas registradas não pode ser removido (deve ser inativado).
 */
export class PetService {
    constructor(
        private readonly pets: IPetRepository,
        private readonly owners: IOwnerRepository,
        private readonly appointments: IAppointmentRepository,
        private readonly now: () => Date = () => new Date(),
    ) {}

    async findAll(ownerId?: unknown): Promise<Pet[]> {
        if (ownerId === undefined) {
            return this.pets.findAll();
        }

        return this.pets.findAll(ensureUuid(ownerId, "owner_id"));
    }

    async findById(id: unknown): Promise<Pet> {
        const petId = ensureUuid(id, "ID do pet");
        const pet = await this.pets.findById(petId);

        if (!pet) {
            throw new NotFoundError("Pet não encontrado.");
        }

        return pet;
    }

    async create(body: unknown): Promise<Pet> {
        const data = validatePet(body);
        const owner = await this.getOwner(data.owner_id);

        this.applyRules(data, owner, true);

        return this.pets.create(data);
    }

    async update(id: unknown, body: unknown): Promise<Pet> {
        const petId = ensureUuid(id, "ID do pet");
        const data = validatePet(body);
        const current = await this.findById(petId);
        const owner = await this.getOwner(data.owner_id);

        // Trocar de tutor exige que o novo tutor esteja ativo
        this.applyRules(data, owner, current.ownerId !== data.owner_id);

        const updated = await this.pets.update(petId, data);

        if (!updated) {
            throw new NotFoundError("Pet não encontrado.");
        }

        return updated;
    }

    async delete(id: unknown): Promise<void> {
        const pet = await this.findById(id);
        const appointmentCount = await this.appointments.countByPet(pet.id);

        if (appointmentCount > 0) {
            throw new ConflictError(
                "Este pet possui consultas registradas e não pode ser removido. Inative o cadastro (active: false).",
            );
        }

        await this.pets.delete(pet.id);
    }

    private async getOwner(ownerId: string): Promise<Owner> {
        const owner = await this.owners.findById(ownerId);

        if (!owner) {
            throw new NotFoundError("O tutor informado em owner_id não foi encontrado.");
        }

        return owner;
    }

    private applyRules(data: PetInput, owner: Owner, isNewLink: boolean): void {
        if (isNewLink && !owner.canReceivePets()) {
            throw new BusinessRuleError("Não é possível vincular um pet a um tutor inativo.");
        }

        if (data.birth_date !== null && new Date(data.birth_date).getTime() > this.now().getTime()) {
            throw new BusinessRuleError("A data de nascimento do pet não pode ser futura.");
        }
    }
}
